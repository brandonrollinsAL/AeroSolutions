import { Router, Request, Response } from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { db } from '../db';
import { twitterPosts, posts } from '@shared/schema';
import { twitterPoster } from '../utils/twitterPoster';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

const router = Router();

// Middleware to ensure admin access
const requireAdmin = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};

/**
 * Get all scheduled tweets
 * GET /api/twitter/scheduled
 * Protected: Admin only
 */
router.get('/scheduled', requireAdmin, async (req: Request, res: Response) => {
  try {
    const scheduledTweets = await db.select()
      .from(twitterPosts)
      .where(eq(twitterPosts.status, 'scheduled'))
      .orderBy(desc(twitterPosts.scheduledTime))
      .limit(50);
    
    return res.status(200).json({
      success: true,
      data: scheduledTweets
    });
  } catch (error) {
    console.error('Error fetching scheduled tweets:', error);
    return res.status(500).json({ error: 'Failed to fetch scheduled tweets' });
  }
});

/**
 * Get tweets by status
 * GET /api/twitter/by-status/:status
 * Protected: Admin only
 */
router.get('/by-status/:status', requireAdmin, async (req: Request, res: Response) => {
  const { status } = req.params;
  const validStatuses = ['draft', 'scheduled', 'processing', 'posted', 'failed', 'cancelled', 'missed'];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status parameter' });
  }
  
  try {
    const tweets = await db.select()
      .from(twitterPosts)
      .where(eq(twitterPosts.status, status))
      .orderBy(status === 'scheduled' ? desc(twitterPosts.scheduledTime) : desc(twitterPosts.createdAt))
      .limit(50);
    
    return res.status(200).json({
      success: true,
      data: tweets
    });
  } catch (error) {
    console.error(`Error fetching tweets with status ${status}:`, error);
    return res.status(500).json({ error: `Failed to fetch tweets with status ${status}` });
  }
});

/**
 * Get tweets for a specific day
 * GET /api/twitter/by-date?date=YYYY-MM-DD
 * Protected: Admin only
 */
router.get('/by-date', requireAdmin, [
  query('date').isDate().withMessage('Valid date in YYYY-MM-DD format is required')
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const dateStr = req.query.date as string;
  const date = parseISO(dateStr);
  const start = startOfDay(date);
  const end = endOfDay(date);
  
  try {
    const tweets = await db.select()
      .from(twitterPosts)
      .where(
        and(
          gte(twitterPosts.scheduledTime, start.toISOString()),
          lte(twitterPosts.scheduledTime, end.toISOString())
        )
      )
      .orderBy(desc(twitterPosts.scheduledTime))
      .limit(50);
    
    return res.status(200).json({
      success: true,
      data: tweets
    });
  } catch (error) {
    console.error(`Error fetching tweets for date ${dateStr}:`, error);
    return res.status(500).json({ error: `Failed to fetch tweets for date ${dateStr}` });
  }
});

/**
 * Get Twitter posting stats
 * GET /api/twitter/stats
 * Protected: Admin only
 */
router.get('/stats', requireAdmin, async (req: Request, res: Response) => {
  try {
    const stats = await db.select({
      status: twitterPosts.status,
      count: sql<number>`count(*)`,
    })
      .from(twitterPosts)
      .groupBy(twitterPosts.status);
    
    const resultsMap: Record<string, number> = {};
    let total = 0;
    
    stats.forEach(stat => {
      resultsMap[stat.status] = stat.count;
      total += stat.count;
    });
    
    return res.status(200).json({
      success: true,
      data: {
        ...resultsMap,
        total
      }
    });
  } catch (error) {
    console.error('Error fetching Twitter stats:', error);
    return res.status(500).json({ error: 'Failed to fetch Twitter stats' });
  }
});

/**
 * Generate a tweet from article
 * POST /api/twitter/generate-from-article
 * Protected: Admin only
 * Body: { articleId: number }
 */
router.post('/generate-from-article', requireAdmin, [
  body('articleId').isInt().withMessage('Article ID must be an integer')
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { articleId } = req.body;
  
  try {
    // Get the article
    const article = await db.select()
      .from(posts)
      .where(eq(posts.id, articleId))
      .limit(1);
    
    if (!article || article.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    // Generate tweet from article
    const tweetContent = await twitterPoster.generateTweetFromArticle(
      article[0].content, 
      article[0].title,
      article[0].tags ? article[0].tags.split(',').map(tag => tag.trim()) : []
    );
    
    return res.status(200).json({
      success: true,
      data: {
        content: tweetContent,
        articleId
      }
    });
  } catch (error) {
    console.error('Error generating tweet from article:', error);
    return res.status(500).json({ error: 'Failed to generate tweet from article' });
  }
});

/**
 * Schedule a new tweet
 * POST /api/twitter/schedule
 * Protected: Admin only
 * Body: { content: string, scheduledTime: ISO string, articleId?: number }
 */
router.post('/schedule', requireAdmin, [
  body('content').isString().isLength({ min: 1, max: 280 }).withMessage('Content must be between 1 and 280 characters'),
  body('scheduledTime').isISO8601().withMessage('Scheduled time must be a valid ISO datetime'),
  body('articleId').optional().isInt().withMessage('Article ID must be an integer if provided')
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { content, scheduledTime, articleId } = req.body;
  
  try {
    const tweet = await twitterPoster.scheduleTweet(
      content,
      new Date(scheduledTime),
      articleId
    );
    
    return res.status(201).json({
      success: true,
      data: tweet
    });
  } catch (error) {
    console.error('Error scheduling tweet:', error);
    return res.status(500).json({ error: 'Failed to schedule tweet' });
  }
});

/**
 * Cancel a scheduled tweet
 * DELETE /api/twitter/scheduled/:id
 * Protected: Admin only
 */
router.delete('/scheduled/:id', requireAdmin, [
  param('id').isInt().withMessage('Tweet ID must be an integer')
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const tweetId = parseInt(req.params.id, 10);
  
  try {
    const result = await twitterPoster.cancelScheduledTweet(tweetId);
    
    if (!result) {
      return res.status(404).json({ error: 'Tweet not found or already posted' });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Tweet cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling tweet:', error);
    return res.status(500).json({ error: 'Failed to cancel tweet' });
  }
});

/**
 * Reschedule a tweet
 * PATCH /api/twitter/reschedule/:id
 * Protected: Admin only
 * Body: { scheduledTime: ISO string }
 */
router.patch('/reschedule/:id', requireAdmin, [
  param('id').isInt().withMessage('Tweet ID must be an integer'),
  body('scheduledTime').isISO8601().withMessage('Scheduled time must be a valid ISO datetime')
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const tweetId = parseInt(req.params.id, 10);
  const { scheduledTime } = req.body;
  
  try {
    const result = await twitterPoster.rescheduleTweet(tweetId, new Date(scheduledTime));
    
    if (!result) {
      return res.status(404).json({ error: 'Tweet not found or already posted' });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Tweet rescheduled successfully'
    });
  } catch (error) {
    console.error('Error rescheduling tweet:', error);
    return res.status(500).json({ error: 'Failed to reschedule tweet' });
  }
});

/**
 * Auto-generate and schedule tweets for recent articles
 * POST /api/twitter/auto-schedule
 * Protected: Admin only
 * Body: { days: number, postsPerDay: number, startDate?: ISO string }
 */
router.post('/auto-schedule', requireAdmin, [
  body('days').isInt({ min: 1, max: 30 }).withMessage('Days must be between 1 and 30'),
  body('postsPerDay').isInt({ min: 1, max: 5 }).withMessage('Posts per day must be between 1 and 5'),
  body('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO datetime if provided')
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { days, postsPerDay, startDate } = req.body;
  
  try {
    // Get recent articles that don't have tweets
    const recentArticles = await db.select()
      .from(posts)
      .where(
        sql`${posts.id} NOT IN (
          SELECT DISTINCT "articleId" FROM ${twitterPosts} 
          WHERE "articleId" IS NOT NULL
        )`
      )
      .orderBy(desc(posts.createdAt))
      .limit(days * postsPerDay);
    
    if (recentArticles.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          message: 'No new articles found to schedule tweets for',
          count: 0
        }
      });
    }
    
    const startDateObj = startDate ? new Date(startDate) : new Date(Date.now() + 24 * 60 * 60 * 1000); // Default to tomorrow
    const scheduledCount = Math.min(recentArticles.length, days * postsPerDay);
    const scheduledTweets = [];
    
    // Schedule tweets spread across the specified days
    for (let i = 0; i < scheduledCount; i++) {
      const article = recentArticles[i];
      const dayOffset = Math.floor(i / postsPerDay);
      const timeSlotWithinDay = i % postsPerDay;
      
      // Generate a schedule time that's evenly spread throughout the day
      const scheduledTime = new Date(startDateObj);
      scheduledTime.setDate(scheduledTime.getDate() + dayOffset);
      
      // Start at 9 AM, spread throughout the day until 5 PM
      const hourOffset = 9 + (8 * timeSlotWithinDay / postsPerDay);
      scheduledTime.setHours(Math.floor(hourOffset), (hourOffset % 1) * 60, 0, 0);
      
      try {
        // Generate tweet content
        const tweetContent = await twitterPoster.generateTweetFromArticle(
          article.content,
          article.title,
          article.tags ? article.tags.split(',').map(tag => tag.trim()) : []
        );
        
        // Schedule the tweet
        const tweet = await twitterPoster.scheduleTweet(
          tweetContent,
          scheduledTime,
          article.id
        );
        
        scheduledTweets.push(tweet);
      } catch (genError) {
        console.error('Error generating or scheduling tweet for article:', article.id, genError);
        // Continue with next article
      }
    }
    
    return res.status(200).json({
      success: true,
      data: {
        message: `Successfully scheduled ${scheduledTweets.length} tweets`,
        count: scheduledTweets.length,
        firstScheduledAt: scheduledTweets.length > 0 ? scheduledTweets[0].scheduledTime : null
      }
    });
  } catch (error) {
    console.error('Error auto-scheduling tweets:', error);
    return res.status(500).json({ error: 'Failed to auto-schedule tweets' });
  }
});

/**
 * Get required Twitter API credentials
 * GET /api/twitter/credentials-check
 * Protected: Admin only
 */
router.get('/credentials-check', requireAdmin, async (req: Request, res: Response) => {
  try {
    const isReady = twitterPoster.isReady();
    const missingCredentials = [];
    
    // Check environment variables
    if (!process.env.TWITTER_API_KEY) missingCredentials.push('TWITTER_API_KEY');
    if (!process.env.TWITTER_API_SECRET) missingCredentials.push('TWITTER_API_SECRET');
    if (!process.env.TWITTER_ACCESS_TOKEN) missingCredentials.push('TWITTER_ACCESS_TOKEN');
    if (!process.env.TWITTER_ACCESS_SECRET) missingCredentials.push('TWITTER_ACCESS_SECRET');
    
    return res.status(200).json({
      ready: isReady,
      message: isReady 
        ? 'Twitter API credentials are configured properly'
        : 'Twitter API credentials are missing or invalid',
      missingCredentials: missingCredentials.length > 0 ? missingCredentials : undefined
    });
  } catch (error) {
    console.error('Error checking Twitter credentials:', error);
    return res.status(500).json({ error: 'Failed to check Twitter credentials' });
  }
});

export default router;