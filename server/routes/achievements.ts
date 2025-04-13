import express, { Request, Response } from 'express';
import { db } from '../db';
import { notifications } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { schedulerService } from '../utils/schedulerService';
import * as authUtils from '../utils/auth';

const router = express.Router();

/**
 * Get all achievement notifications for the current user
 */
router.get('/', authUtils.authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Get all achievement notifications for this user
    const achievements = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, req.user.id),
          eq(notifications.type, 'achievement')
        )
      )
      .orderBy(desc(notifications.createdAt));

    return res.json({
      success: true,
      data: achievements
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch achievements'
    });
  }
});

/**
 * Mark an achievement notification as read
 */
router.patch('/:id/read', authUtils.authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const notificationId = parseInt(req.params.id);
    if (isNaN(notificationId)) {
      return res.status(400).json({ success: false, message: 'Invalid notification ID' });
    }

    // Verify the notification belongs to this user
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
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // Update the notification's status
    await db
      .update(notifications)
      .set({ 
        status: 'read',
        readAt: new Date()
      })
      .where(eq(notifications.id, notificationId));

    return res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update notification'
    });
  }
});

/**
 * Manually check for new achievements (can be used after important user actions)
 */
router.post('/check', authUtils.authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const newAchievements = await schedulerService.checkUserAchievements(req.user.id);

    return res.json({
      success: true,
      data: {
        newAchievements,
        count: newAchievements.length
      }
    });
  } catch (error) {
    console.error('Error checking achievements:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check achievements'
    });
  }
});

export default router;