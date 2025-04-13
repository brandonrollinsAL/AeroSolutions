import express, { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { db } from '../db';
import { 
  contentComplianceScans, 
  contentComplianceAlerts,
  ContentComplianceAlert,
  ContentComplianceScan
} from '@shared/schema';
import { complianceMonitor } from '../utils/complianceMonitor';

const router = express.Router();

// Middleware to check if user is admin
const adminAuthCheck = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  try {
    // Check if user has admin role
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    
    // Not an admin
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  } catch (error) {
    console.error('Error in admin auth check:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying admin access'
    });
  }
};

// Get recent compliance alerts
router.get('/alerts/recent', adminAuthCheck, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    
    const alerts = await db
      .select()
      .from(contentComplianceAlerts)
      .orderBy(desc(contentComplianceAlerts.createdAt))
      .limit(limit);

    return res.status(200).json(alerts);
  } catch (error) {
    console.error('Error fetching recent compliance alerts:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch compliance alerts' 
    });
  }
});

// Get compliance alerts for specific content
router.get('/alerts/content/:contentId', adminAuthCheck, async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
    
    const alerts = await db
      .select()
      .from(contentComplianceAlerts)
      .where(eq(contentComplianceAlerts.contentId, contentId))
      .orderBy(desc(contentComplianceAlerts.createdAt));

    return res.status(200).json(alerts);
  } catch (error) {
    console.error('Error fetching content compliance alerts:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch content compliance alerts' 
    });
  }
});

// Get compliance scans for specific content
router.get('/scans/content/:contentId', adminAuthCheck, async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
    
    const scans = await db
      .select()
      .from(contentComplianceScans)
      .where(eq(contentComplianceScans.contentId, contentId))
      .orderBy(desc(contentComplianceScans.scanStartedAt));

    return res.status(200).json(scans);
  } catch (error) {
    console.error('Error fetching content compliance scans:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch content compliance scans' 
    });
  }
});

// Update alert status
router.patch('/alerts/:alertId/status', adminAuthCheck, [
  param('alertId').isInt().withMessage('Invalid alert ID'),
  body('status')
    .isIn(['open', 'resolved', 'acknowledged', 'false_positive'])
    .withMessage('Invalid status value'),
  body('resolutionNotes')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Resolution notes must be a string with maximum 1000 characters')
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data",
        errors: errors.array()
      });
    }

    const { alertId } = req.params;
    const { status, resolutionNotes } = req.body;
    
    // Update the alert
    const [updatedAlert] = await db
      .update(contentComplianceAlerts)
      .set({
        status,
        resolutionNotes,
        resolvedAt: status === 'resolved' ? new Date() : null
      })
      .where(eq(contentComplianceAlerts.id, parseInt(alertId)))
      .returning();
    
    if (!updatedAlert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Alert status updated',
      alert: updatedAlert
    });
    
  } catch (error) {
    console.error('Error updating compliance alert status:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to update alert status' 
    });
  }
});

// Manually trigger compliance check
router.post('/check', adminAuthCheck, [
  body('contentId').isString().withMessage('Content ID is required'),
  body('contentType')
    .isIn(['blog', 'product', 'service', 'marketplace', 'advertisement', 'landing_page'])
    .withMessage('Invalid content type'),
  body('contentTitle').isString().withMessage('Content title is required'),
  body('content').isString().withMessage('Content is required')
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data",
        errors: errors.array()
      });
    }

    const { contentId, contentType, contentTitle, content } = req.body;

    // Start compliance check
    const result = await complianceMonitor.checkCompliance(contentId, contentType, contentTitle, content);
    
    return res.status(200).json({
      success: true,
      message: 'Compliance check completed',
      result
    });
    
  } catch (error) {
    console.error('Error running compliance check:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to run compliance check' 
    });
  }
});

// Get compliance stats
router.get('/stats', adminAuthCheck, async (req: Request, res: Response) => {
  try {
    // Get total scans
    const [totalScansResult] = await db
      .select({ count: count() })
      .from(contentComplianceScans);
    
    const totalScans = totalScansResult?.count || 0;
    
    // Get open alerts count
    const [openAlertsResult] = await db
      .select({ count: count() })
      .from(contentComplianceAlerts)
      .where(eq(contentComplianceAlerts.status, 'open'));
    
    const openAlerts = openAlertsResult?.count || 0;
    
    // Get alerts by severity
    const alertsBySeverity = await db
      .select({
        severity: contentComplianceAlerts.severity,
        count: count()
      })
      .from(contentComplianceAlerts)
      .groupBy(contentComplianceAlerts.severity)
      .orderBy(contentComplianceAlerts.severity);
    
    // Get alerts by category
    const alertsByCategory = await db
      .select({
        category: contentComplianceAlerts.category,
        count: count()
      })
      .from(contentComplianceAlerts)
      .groupBy(contentComplianceAlerts.category)
      .orderBy(contentComplianceAlerts.category);
    
    // Get recent failed scans
    const recentFailedScans = await db
      .select()
      .from(contentComplianceScans)
      .where(eq(contentComplianceScans.passedCheck, false))
      .orderBy(desc(contentComplianceScans.scanStartedAt))
      .limit(5);
    
    return res.status(200).json({
      totalScans,
      openAlerts,
      alertsBySeverity,
      alertsByCategory,
      recentFailedScans
    });
    
  } catch (error) {
    console.error('Error fetching compliance stats:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch compliance stats' 
    });
  }
});

export default router;