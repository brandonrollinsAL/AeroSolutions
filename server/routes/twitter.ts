import express, { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { adminMiddleware, authMiddleware } from '../utils/auth';
import { twitterPoster } from '../utils/twitterPoster';
import { db } from '../db';
import { twitterPosts, posts } from '@shared/schema';
import { eq, and, gte, desc } from 'drizzle-orm';

// Create express router
const twitterRouter = express.Router();

/**
 * Get all scheduled tweets
 * GET /api/twitter/scheduled
 * Protected: Admin only
 */
twitterRouter.get(
  '/scheduled',
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      const scheduledTweets = await twitterPoster.getScheduledTweets();
      
      return res.status(200).json({
        success: true,
        data: scheduledTweets
      });
    } catch (error) {
      console.error('Error getting scheduled tweets:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get scheduled tweets',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Get tweets by status
 * GET /api/twitter/by-status/:status
 * Protected: Admin only
 */
twitterRouter.get(
  '/by-status/:status',
  adminMiddleware,
  [
    param('status')
      .isString()
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['draft', 'scheduled', 'processing', 'posted', 'failed', 'cancelled', 'missed'])
      .withMessage('Invalid status')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { status } = req.params;
      const tweets = await twitterPoster.getTweetsByStatus(status);
      
      return res.status(200).json({
        success: true,
        data: tweets
      });
    } catch (error) {
      console.error(`Error getting tweets by status ${req.params.status}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get tweets',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Get tweets for a specific day
 * GET /api/twitter/by-date?date=YYYY-MM-DD
 * Protected: Admin only
 */
twitterRouter.get(
  '/by-date',
  adminMiddleware,
  [
    query('date')
      .isString()
      .notEmpty()
      .withMessage('Date is required')
      .isISO8601()
      .withMessage('Invalid date format (use YYYY-MM-DD)')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const date = new Date(req.query.date as string);
      const tweets = await twitterPoster.getTweetsForDay(date);
      
      return res.status(200).json({
        success: true,
        data: tweets
      });
    } catch (error) {
      console.error(`Error getting tweets for date ${req.query.date}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get tweets for date',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Get Twitter posting stats
 * GET /api/twitter/stats
 * Protected: Admin only
 */
twitterRouter.get(
  '/stats',
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      const stats = await twitterPoster.getTweetStats();
      
      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting Twitter stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get Twitter stats',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Generate a tweet from article
 * POST /api/twitter/generate-from-article
 * Protected: Admin only
 * Body: { articleId: number }
 */
twitterRouter.post(
  '/generate-from-article',
  adminMiddleware,
  [
    body('articleId')
      .isInt({ min: 1 })
      .withMessage('Article ID must be a positive integer')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { articleId } = req.body;
      
      // Get the article from the database
      const [article] = await db.select()
        .from(posts)
        .where(eq(posts.id, articleId));
      
      if (!article) {
        return res.status(404).json({
          success: false,
          message: 'Article not found'
        });
      }
      
      // Generate the tweet content
      const tags = Array.isArray(article.tags) ? article.tags : [];
      const tweetContent = await twitterPoster.generateTweetFromArticle(
        article.content,
        article.title,
        tags
      );
      
      return res.status(200).json({
        success: true,
        data: {
          tweet: tweetContent,
          articleId: article.id,
          articleTitle: article.title
        }
      });
    } catch (error) {
      console.error('Error generating tweet from article:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate tweet',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Schedule a new tweet
 * POST /api/twitter/schedule
 * Protected: Admin only
 * Body: { content: string, scheduledTime: ISO string, articleId?: number }
 */
twitterRouter.post(
  '/schedule',
  adminMiddleware,
  [
    body('content')
      .isString()
      .notEmpty()
      .withMessage('Tweet content is required')
      .isLength({ max: 280 })
      .withMessage('Tweet content must be 280 characters or less'),
    body('scheduledTime')
      .isISO8601()
      .withMessage('Scheduled time must be a valid ISO 8601 date string'),
    body('articleId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Article ID must be a positive integer if provided')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { content, scheduledTime, articleId } = req.body;
      
      // Validate that the scheduled time is in the future
      const scheduledDate = new Date(scheduledTime);
      if (scheduledDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Scheduled time must be in the future'
        });
      }
      
      // If articleId is provided, verify it exists
      if (articleId) {
        const [article] = await db.select()
          .from(posts)
          .where(eq(posts.id, articleId));
        
        if (!article) {
          return res.status(404).json({
            success: false,
            message: 'Referenced article not found'
          });
        }
      }
      
      // Schedule the tweet
      const scheduledTweet = await twitterPoster.scheduleTweet(
        content,
        scheduledDate,
        articleId
      );
      
      return res.status(201).json({
        success: true,
        message: 'Tweet scheduled successfully',
        data: scheduledTweet
      });
    } catch (error) {
      console.error('Error scheduling tweet:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to schedule tweet',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Cancel a scheduled tweet
 * DELETE /api/twitter/scheduled/:id
 * Protected: Admin only
 */
twitterRouter.delete(
  '/scheduled/:id',
  adminMiddleware,
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Tweet ID must be a positive integer')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const tweetId = parseInt(req.params.id, 10);
      const cancelled = await twitterPoster.cancelScheduledTweet(tweetId);
      
      if (!cancelled) {
        return res.status(404).json({
          success: false,
          message: 'Tweet not found or not in scheduled status'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Tweet cancelled successfully'
      });
    } catch (error) {
      console.error(`Error cancelling tweet ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to cancel tweet',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Reschedule a tweet
 * PATCH /api/twitter/reschedule/:id
 * Protected: Admin only
 * Body: { scheduledTime: ISO string }
 */
twitterRouter.patch(
  '/reschedule/:id',
  adminMiddleware,
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Tweet ID must be a positive integer'),
    body('scheduledTime')
      .isISO8601()
      .withMessage('Scheduled time must be a valid ISO 8601 date string')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const tweetId = parseInt(req.params.id, 10);
      const { scheduledTime } = req.body;
      
      // Validate that the scheduled time is in the future
      const scheduledDate = new Date(scheduledTime);
      if (scheduledDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Scheduled time must be in the future'
        });
      }
      
      const rescheduled = await twitterPoster.rescheduleTweet(tweetId, scheduledDate);
      
      if (!rescheduled) {
        return res.status(404).json({
          success: false,
          message: 'Tweet not found or cannot be rescheduled'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Tweet rescheduled successfully'
      });
    } catch (error) {
      console.error(`Error rescheduling tweet ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to reschedule tweet',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Auto-generate and schedule tweets for recent articles
 * POST /api/twitter/auto-schedule
 * Protected: Admin only
 * Body: { days: number, postsPerDay: number, startDate?: ISO string }
 */
twitterRouter.post(
  '/auto-schedule',
  adminMiddleware,
  [
    body('days')
      .isInt({ min: 1, max: 30 })
      .withMessage('Days must be between 1 and 30'),
    body('postsPerDay')
      .isInt({ min: 1, max: 5 })
      .withMessage('Posts per day must be between 1 and 5'),
    body('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date string if provided')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { days, postsPerDay, startDate } = req.body;
      
      // Get start date (default to tomorrow)
      const start = startDate ? new Date(startDate) : new Date();
      if (start <= new Date()) {
        start.setDate(start.getDate() + 1); // Set to tomorrow
        start.setHours(9, 0, 0, 0); // 9 AM
      }
      
      // Get recent articles not already scheduled for Twitter
      const recentArticles = await db.select()
        .from(posts)
        .where(
          and(
            eq(posts.status, 'published'),
            gte(posts.createdAt, new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)) // Last 90 days
          )
        )
        .orderBy(desc(posts.createdAt))
        .limit(days * postsPerDay * 2); // Get twice as many as needed to account for already scheduled
      
      // Get already scheduled article IDs
      const scheduledArticleIds = (await db.select({ articleId: twitterPosts.articleId })
        .from(twitterPosts)
        .where(
          and(
            eq(twitterPosts.status, 'scheduled'),
            twitterPosts.articleId.isNotNull()
          )
        ))
        .map(row => row.articleId)
        .filter(Boolean) as number[];
      
      // Filter out already scheduled articles
      const availableArticles = recentArticles.filter(article => 
        !scheduledArticleIds.includes(article.id)
      );
      
      if (availableArticles.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No recent articles available for scheduling'
        });
      }
      
      // Schedule tweets
      const scheduledTweets = [];
      const totalToSchedule = Math.min(days * postsPerDay, availableArticles.length);
      const currentDate = new Date(start);
      
      for (let i = 0; i < totalToSchedule; i++) {
        const article = availableArticles[i];
        const postTime = new Date(currentDate);
        
        // Distribute posts throughout the day
        const hour = 9 + (i % postsPerDay) * (8 / postsPerDay); // Between 9 AM and 5 PM
        postTime.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0);
        
        // Move to next day if we've scheduled all posts for today
        if ((i + 1) % postsPerDay === 0) {
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Generate tweet content
        const tags = Array.isArray(article.tags) ? article.tags : [];
        const tweetContent = await twitterPoster.generateTweetFromArticle(
          article.content,
          article.title,
          tags
        );
        
        // Schedule the tweet
        const scheduledTweet = await twitterPoster.scheduleTweet(
          tweetContent,
          postTime,
          article.id
        );
        
        scheduledTweets.push(scheduledTweet);
      }
      
      return res.status(200).json({
        success: true,
        message: `Successfully scheduled ${scheduledTweets.length} tweets`,
        data: {
          scheduledTweets,
          count: scheduledTweets.length
        }
      });
    } catch (error) {
      console.error('Error auto-scheduling tweets:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to auto-schedule tweets',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Get required Twitter API credentials
 * GET /api/twitter/credentials-check
 * Protected: Admin only
 */
twitterRouter.get(
  '/credentials-check',
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      // Check if Twitter API is initialized
      const isReady = twitterPoster.isReady();
      
      if (!isReady) {
        // List the required environment variables
        const required = [
          'TWITTER_API_KEY',
          'TWITTER_API_SECRET',
          'TWITTER_ACCESS_TOKEN',
          'TWITTER_ACCESS_SECRET',
          'TWITTER_BEARER_TOKEN',
          'TWITTER_CLIENT_ID',
          'TWITTER_CLIENT_SECRET'
        ];
        
        // Check which ones are missing
        const missing = required.filter(key => !process.env[key]);
        
        return res.status(200).json({
          success: false,
          ready: false,
          message: 'Twitter API is not initialized',
          missingCredentials: missing
        });
      }
      
      return res.status(200).json({
        success: true,
        ready: true,
        message: 'Twitter API is initialized and ready'
      });
    } catch (error) {
      console.error('Error checking Twitter credentials:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check Twitter credentials',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Export the router
export default twitterRouter;