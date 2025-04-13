import express, { Request, Response } from 'express';
import { db } from '../db';
import { eq, and, desc } from 'drizzle-orm';
import { userAchievements, achievements } from '@shared/schema';
import { grokApi } from '../grok';
import * as achievementService from '../utils/achievementService';

const router = express.Router();

/**
 * Get all achievements
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await db.select().from(achievements);
    return res.json(result);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

/**
 * Get achievement by id
 */
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const result = await db.select().from(achievements).where(eq(achievements.id, Number(id)));
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Achievement not found' });
    }
    
    return res.json(result[0]);
  } catch (error) {
    console.error(`Error fetching achievement ${id}:`, error);
    return res.status(500).json({ error: 'Failed to fetch achievement' });
  }
});

/**
 * Get current user's achievements
 */
router.get('/user', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const userId = req.user?.id;
    
    const result = await db.select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.createdAt));
    
    return res.json(result);
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    return res.status(500).json({ error: 'Failed to fetch user achievements' });
  }
});

/**
 * Get user achievements by user ID (admin only)
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user?.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const { userId } = req.params;
  
  try {
    const result = await db.select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, Number(userId)))
      .orderBy(desc(userAchievements.createdAt));
    
    return res.json(result);
  } catch (error) {
    console.error(`Error fetching achievements for user ${userId}:`, error);
    return res.status(500).json({ error: 'Failed to fetch user achievements' });
  }
});

/**
 * Mark achievement as read
 */
router.patch('/:id/read', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const { id } = req.params;
  const userId = req.user?.id;
  
  try {
    // Check if the achievement belongs to the user
    const achievement = await db.select()
      .from(userAchievements)
      .where(
        and(
          eq(userAchievements.id, Number(id)),
          eq(userAchievements.userId, userId)
        )
      );
    
    if (achievement.length === 0) {
      return res.status(404).json({ error: 'Achievement not found' });
    }
    
    // Update the achievement status
    await db.update(userAchievements)
      .set({ 
        status: 'read',
        readAt: new Date()
      })
      .where(eq(userAchievements.id, Number(id)));
    
    return res.json({ success: true });
  } catch (error) {
    console.error(`Error marking achievement ${id} as read:`, error);
    return res.status(500).json({ error: 'Failed to update achievement' });
  }
});

/**
 * Dismiss achievement
 */
router.patch('/:id/dismiss', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const { id } = req.params;
  const userId = req.user?.id;
  
  try {
    // Check if the achievement belongs to the user
    const achievement = await db.select()
      .from(userAchievements)
      .where(
        and(
          eq(userAchievements.id, Number(id)),
          eq(userAchievements.userId, userId)
        )
      );
    
    if (achievement.length === 0) {
      return res.status(404).json({ error: 'Achievement not found' });
    }
    
    // Update the achievement status
    await db.update(userAchievements)
      .set({ status: 'dismissed' })
      .where(eq(userAchievements.id, Number(id)));
    
    return res.json({ success: true });
  } catch (error) {
    console.error(`Error dismissing achievement ${id}:`, error);
    return res.status(500).json({ error: 'Failed to update achievement' });
  }
});

/**
 * Manually run achievement check (admin only)
 */
router.post('/check', async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user?.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  try {
    const newAchievements = await achievementService.checkForNewAchievements();
    const specialDayAchievements = await achievementService.checkForSpecialDays();
    
    return res.json({
      success: true,
      newAchievements,
      specialDayAchievements,
      total: newAchievements + specialDayAchievements
    });
  } catch (error) {
    console.error('Error running achievement check:', error);
    return res.status(500).json({ error: 'Failed to run achievement check' });
  }
});

export default router;