import express, { Request, Response } from 'express';
import { db } from '../db';
import { retentionService } from '../utils/retentionService';
import { userRetentionMessages, notifications } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';

const router = express.Router();

// Auth middleware - only admins can access these routes
function adminOnly(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated() || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
}

// Get at-risk users dashboard data
router.get('/at-risk-users', adminOnly, async (req: Request, res: Response) => {
  try {
    const atRiskUsers = await retentionService.identifyAtRiskUsers();
    res.json(atRiskUsers);
  } catch (error) {
    console.error('Error getting at-risk users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Run retention campaign
router.post('/run-campaign', adminOnly, async (req: Request, res: Response) => {
  try {
    const { messageType = 'email', dryRun = false, maxUsers = 50 } = req.body;
    
    if (messageType !== 'email' && messageType !== 'in-app') {
      return res.status(400).json({ error: 'Invalid message type' });
    }
    
    const result = await retentionService.runRetentionCampaign({
      messageType,
      dryRun: Boolean(dryRun),
      maxUsers: Number(maxUsers)
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error running retention campaign:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get retention message history
router.get('/messages', adminOnly, async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;
    
    const messages = await db
      .select()
      .from(userRetentionMessages)
      .orderBy(desc(userRetentionMessages.createdAt))
      .limit(limit)
      .offset(offset);
    
    const total = await db
      .select({ count: db.fn.count() })
      .from(userRetentionMessages);
    
    res.json({
      messages,
      total: Number(total[0].count) || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error getting retention messages:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate and send a test retention message
router.post('/test-message', adminOnly, async (req: Request, res: Response) => {
  try {
    const { userId, messageType = 'email' } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    if (messageType !== 'email' && messageType !== 'in-app') {
      return res.status(400).json({ error: 'Invalid message type' });
    }
    
    // Generate message but don't send it
    const message = await retentionService.generateRetentionMessage(
      Number(userId),
      messageType
    );
    
    if (!message) {
      return res.status(404).json({ error: 'Failed to generate message or user not found' });
    }
    
    res.json({ userId, messageType, message });
  } catch (error) {
    console.error('Error generating test message:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send a specific retention message
router.post('/send-message', adminOnly, async (req: Request, res: Response) => {
  try {
    const { userId, messageType = 'email', message } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ error: 'userId and message are required' });
    }
    
    if (messageType !== 'email' && messageType !== 'in-app') {
      return res.status(400).json({ error: 'Invalid message type' });
    }
    
    const success = await retentionService.deliverRetentionMessage(
      Number(userId),
      messageType,
      message
    );
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to deliver message' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// API endpoints for users - notifications

// Mark notification as read
router.patch('/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const notificationId = Number(req.params.id);
    
    // Verify the notification belongs to the user
    const [notification] = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, req.user.id)
        )
      );
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    await db
      .update(notifications)
      .set({ 
        status: 'read',
        readAt: new Date()
      })
      .where(eq(notifications.id, notificationId));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's unread notifications
router.get('/notifications/unread', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const unreadNotifications = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, req.user.id),
          eq(notifications.status, 'unread')
        )
      )
      .orderBy(desc(notifications.createdAt));
    
    res.json(unreadNotifications);
  } catch (error) {
    console.error('Error getting unread notifications:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all user's notifications with pagination
router.get('/notifications', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const status = req.query.status as string | undefined;
    
    let query = db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, req.user.id));
    
    if (status === 'unread' || status === 'read' || status === 'dismissed') {
      query = query.where(eq(notifications.status, status));
    }
    
    const allNotifications = await query
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
    
    // Get total count
    const countQuery = db
      .select({ count: db.fn.count() })
      .from(notifications)
      .where(eq(notifications.userId, req.user.id));
    
    if (status === 'unread' || status === 'read' || status === 'dismissed') {
      countQuery.where(eq(notifications.status, status));
    }
    
    const [total] = await countQuery;
    
    res.json({
      notifications: allNotifications,
      total: Number(total.count) || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;