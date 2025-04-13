import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { ComplianceMonitor, ComplianceContentType } from '../utils/complianceMonitor';
import { contentComplianceAlerts, contentComplianceScans } from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';

const router = express.Router();

// Middleware to check admin authorization
const adminAuthCheck = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
  
  next();
};

// Get recent compliance alerts
router.get('/alerts/recent', adminAuthCheck, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const alerts = await ComplianceMonitor.getRecentAlerts(limit);
    
    return res.json(alerts);
  } catch (error) {
    console.error('Error fetching recent alerts:', error);
    return res.status(500).json({ message: 'Failed to fetch recent compliance alerts' });
  }
});

// Get alerts for a specific content item
router.get('/alerts/content/:contentId', adminAuthCheck, async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
    const contentType = req.query.contentType as string;
    
    if (!contentId || !contentType) {
      return res.status(400).json({ message: 'Content ID and content type are required' });
    }
    
    // Validate content type
    if (!Object.values(ComplianceContentType).includes(contentType as ComplianceContentType)) {
      return res.status(400).json({ message: 'Invalid content type' });
    }
    
    const alerts = await ComplianceMonitor.getContentAlerts(
      contentId,
      contentType as ComplianceContentType
    );
    
    return res.json(alerts);
  } catch (error) {
    console.error('Error fetching content alerts:', error);
    return res.status(500).json({ message: 'Failed to fetch content compliance alerts' });
  }
});

// Get compliance scan history for a specific content item
router.get('/scans/content/:contentId', adminAuthCheck, async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
    const contentType = req.query.contentType as string;
    
    if (!contentId || !contentType) {
      return res.status(400).json({ message: 'Content ID and content type are required' });
    }
    
    // Validate content type
    if (!Object.values(ComplianceContentType).includes(contentType as ComplianceContentType)) {
      return res.status(400).json({ message: 'Invalid content type' });
    }
    
    const scans = await db.select()
      .from(contentComplianceScans)
      .where(and(
        eq(contentComplianceScans.contentId, contentId),
        eq(contentComplianceScans.contentType, contentType)
      ))
      .orderBy(desc(contentComplianceScans.scanStartedAt));
    
    return res.json(scans);
  } catch (error) {
    console.error('Error fetching content scans:', error);
    return res.status(500).json({ message: 'Failed to fetch content compliance scans' });
  }
});

// Update alert status (resolve, acknowledge, mark as false positive)
router.patch('/alerts/:alertId/status', adminAuthCheck, async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    
    // Validate request body
    const statusSchema = z.object({
      status: z.enum(['resolved', 'acknowledged', 'false_positive']),
      resolutionNotes: z.string().optional()
    });
    
    const validatedData = statusSchema.parse(req.body);
    
    // Check if alert exists
    const [existingAlert] = await db.select()
      .from(contentComplianceAlerts)
      .where(eq(contentComplianceAlerts.id, parseInt(alertId)));
    
    if (!existingAlert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    
    // Update alert status
    await ComplianceMonitor.updateAlertStatus(
      parseInt(alertId),
      validatedData.status,
      validatedData.resolutionNotes
    );
    
    // Return updated alert
    const [updatedAlert] = await db.select()
      .from(contentComplianceAlerts)
      .where(eq(contentComplianceAlerts.id, parseInt(alertId)));
    
    return res.json(updatedAlert);
  } catch (error) {
    console.error('Error updating alert status:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
    }
    
    return res.status(500).json({ message: 'Failed to update alert status' });
  }
});

// Manually trigger a compliance check for a content item
router.post('/check', adminAuthCheck, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const checkSchema = z.object({
      contentId: z.string().or(z.number()),
      contentType: z.enum(Object.values(ComplianceContentType) as [string, ...string[]]),
      contentTitle: z.string().optional(),
      content: z.string(),
      metadata: z.record(z.any()).optional(),
      categories: z.array(z.string()).optional()
    });
    
    const validatedData = checkSchema.parse(req.body);
    
    // Trigger compliance check
    const result = await ComplianceMonitor.checkCompliance(validatedData);
    
    return res.json(result);
  } catch (error) {
    console.error('Error during compliance check:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
    }
    
    return res.status(500).json({ message: 'Failed to perform compliance check' });
  }
});

// Get compliance dashboard stats
router.get('/stats', adminAuthCheck, async (req: Request, res: Response) => {
  try {
    // Get total number of scans
    const [scanCount] = await db.select({ count: db.fn.count() })
      .from(contentComplianceScans);
    
    // Get total number of open alerts
    const [openAlertCount] = await db.select({ count: db.fn.count() })
      .from(contentComplianceAlerts)
      .where(eq(contentComplianceAlerts.status, 'open'));
    
    // Get alerts by severity
    const alertsBySeverity = await db.select({
      severity: contentComplianceAlerts.severity,
      count: db.fn.count()
    })
    .from(contentComplianceAlerts)
    .groupBy(contentComplianceAlerts.severity);
    
    // Get alerts by category
    const alertsByCategory = await db.select({
      category: contentComplianceAlerts.category,
      count: db.fn.count()
    })
    .from(contentComplianceAlerts)
    .groupBy(contentComplianceAlerts.category);
    
    // Get recent failed scans (content that didn't pass compliance)
    const recentFailedScans = await db.select()
      .from(contentComplianceScans)
      .where(eq(contentComplianceScans.passedCheck, false))
      .orderBy(desc(contentComplianceScans.scanStartedAt))
      .limit(5);
    
    return res.json({
      totalScans: scanCount.count,
      openAlerts: openAlertCount.count,
      alertsBySeverity,
      alertsByCategory,
      recentFailedScans
    });
  } catch (error) {
    console.error('Error fetching compliance stats:', error);
    return res.status(500).json({ message: 'Failed to fetch compliance statistics' });
  }
});

export default router;