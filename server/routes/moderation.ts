import express, { Request, Response } from 'express';
import { db } from '../db';
import { contentComplianceAlerts, contentComplianceScans } from '@shared/schema';
import { eq, desc, and, like } from 'drizzle-orm';
import { adminMiddleware } from '../utils/auth';
import { contentModerationService } from '../utils/contentModeration';

const moderationRouter = express.Router();

/**
 * Get all content moderation violations
 * GET /api/moderation/violations
 * Restricted to admins only
 */
moderationRouter.get(
  '/violations',
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      // Query parameters for filtering
      const { status = 'all', type = 'all', page = '1', limit = '20', search = '' } = req.query;
      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);
      const offset = (pageNumber - 1) * limitNumber;
      
      // Build the query based on filters
      let query = db.select()
        .from(contentComplianceAlerts)
        .orderBy(desc(contentComplianceAlerts.createdAt))
        .limit(limitNumber)
        .offset(offset);
        
      // Add status filter
      if (status !== 'all') {
        query = query.where(eq(contentComplianceAlerts.status, status as string));
      }
      
      // Add content type filter
      if (type !== 'all') {
        query = query.where(eq(contentComplianceAlerts.contentType, type as string));
      }
      
      // Add search filter
      if (search) {
        query = query.where(
          like(contentComplianceAlerts.contentTitle, `%${search}%`)
        );
      }
      
      // Execute the query
      const violations = await query;
      
      // Get total count for pagination
      const totalCountResult = await db.select({ count: db.fn.count() })
        .from(contentComplianceAlerts);
      const totalCount = Number(totalCountResult[0].count) || 0;
      
      return res.status(200).json({
        success: true,
        data: {
          violations,
          pagination: {
            page: pageNumber,
            limit: limitNumber,
            total: totalCount,
            pages: Math.ceil(totalCount / limitNumber)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching moderation violations:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch moderation violations',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Get a single moderation violation by ID
 * GET /api/moderation/violations/:id
 * Restricted to admins only
 */
moderationRouter.get(
  '/violations/:id',
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id, 10))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid violation ID'
        });
      }
      
      // Get the violation details
      const [violation] = await db.select()
        .from(contentComplianceAlerts)
        .where(eq(contentComplianceAlerts.id, parseInt(id, 10)));
      
      if (!violation) {
        return res.status(404).json({
          success: false,
          message: 'Violation not found'
        });
      }
      
      // Get the related scan details
      const [scan] = await db.select()
        .from(contentComplianceScans)
        .where(eq(contentComplianceScans.id, violation.scanId));
      
      return res.status(200).json({
        success: true,
        data: {
          violation,
          scan
        }
      });
    } catch (error) {
      console.error('Error fetching moderation violation details:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch violation details',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Update a moderation violation status
 * PATCH /api/moderation/violations/:id
 * Restricted to admins only
 */
moderationRouter.patch(
  '/violations/:id',
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;
      
      if (!id || isNaN(parseInt(id, 10))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid violation ID'
        });
      }
      
      // Validate status
      if (status && !['open', 'resolved', 'false_positive', 'escalated'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value'
        });
      }
      
      // Prepare update data
      const updateData: Record<string, any> = {};
      if (status) updateData.status = status;
      if (adminNotes) updateData.adminNotes = adminNotes;
      updateData.updatedAt = new Date();
      
      // Update the violation
      const [updatedViolation] = await db.update(contentComplianceAlerts)
        .set(updateData)
        .where(eq(contentComplianceAlerts.id, parseInt(id, 10)))
        .returning();
      
      if (!updatedViolation) {
        return res.status(404).json({
          success: false,
          message: 'Violation not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: updatedViolation,
        message: 'Violation updated successfully'
      });
    } catch (error) {
      console.error('Error updating moderation violation:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update violation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Manually moderate content
 * POST /api/moderation/analyze
 * Allows admins to run content through moderation checks manually
 */
moderationRouter.post(
  '/analyze',
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { content, contentType = 'manual_check', contentTitle = 'Manual Content Check', contentId = `manual-${Date.now()}` } = req.body;
      
      if (!content || typeof content !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Content is required'
        });
      }
      
      console.log(`Performing manual moderation check on ${contentType}: "${contentTitle.substring(0, 30)}${contentTitle.length > 30 ? '...' : ''}"`);
      
      // Run the content through moderation
      const moderationResult = await contentModerationService.analyzeContent(content, contentType);
      
      // If content violates policies, record the violation
      if (!moderationResult.isAllowed) {
        await contentModerationService.recordViolation(
          contentId,
          contentType,
          contentTitle,
          moderationResult.category || 'policy_violation',
          moderationResult.reason || 'Content violates platform policies',
          content.substring(0, 500) // Store excerpt of violating content
        );
      }
      
      return res.status(200).json({
        success: true,
        data: moderationResult,
        message: moderationResult.isAllowed 
          ? 'Content passed moderation checks' 
          : 'Content violates platform policies'
      });
    } catch (error) {
      console.error('Error performing manual moderation:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to analyze content',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Get moderation stats
 * GET /api/moderation/stats
 * Get statistics about content moderation and violations
 * Restricted to admins only
 */
moderationRouter.get(
  '/stats',
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      // Get counts of violations by status
      const statusCounts = await db
        .select({
          status: contentComplianceAlerts.status,
          count: db.fn.count()
        })
        .from(contentComplianceAlerts)
        .groupBy(contentComplianceAlerts.status);
      
      // Get counts of violations by content type
      const typeCounts = await db
        .select({
          contentType: contentComplianceAlerts.contentType,
          count: db.fn.count()
        })
        .from(contentComplianceAlerts)
        .groupBy(contentComplianceAlerts.contentType);
      
      // Get counts of violations by category
      const categoryCounts = await db
        .select({
          category: contentComplianceAlerts.category,
          count: db.fn.count()
        })
        .from(contentComplianceAlerts)
        .groupBy(contentComplianceAlerts.category);
      
      // Get total scans count
      const [totalScansResult] = await db
        .select({ count: db.fn.count() })
        .from(contentComplianceScans);
      
      // Get recent violations (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentViolations = await db
        .select()
        .from(contentComplianceAlerts)
        .where(contentComplianceAlerts.createdAt > sevenDaysAgo)
        .orderBy(desc(contentComplianceAlerts.createdAt))
        .limit(5);
      
      // Format the data for the response
      const stats = {
        totalViolations: statusCounts.reduce((sum, item) => sum + Number(item.count), 0),
        totalScans: Number(totalScansResult.count) || 0,
        statusBreakdown: statusCounts.reduce((acc, item) => {
          acc[item.status] = Number(item.count);
          return acc;
        }, {} as Record<string, number>),
        contentTypeBreakdown: typeCounts.reduce((acc, item) => {
          acc[item.contentType] = Number(item.count);
          return acc;
        }, {} as Record<string, number>),
        categoryBreakdown: categoryCounts.reduce((acc, item) => {
          acc[item.category] = Number(item.count);
          return acc;
        }, {} as Record<string, number>),
        recentViolations
      };
      
      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching moderation stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch moderation statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default moderationRouter;