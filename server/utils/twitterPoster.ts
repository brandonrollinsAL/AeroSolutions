import { TwitterClient } from './twitterClient';
import { grokApi } from '../grok';
import { db } from '../db';
import { twitterPosts, type TwitterPost } from '@shared/schema';
import { and, eq, gte, lte } from 'drizzle-orm';

/**
 * Service for generating, scheduling, and posting to Twitter
 */
export class TwitterPosterService {
  private twitterClient: TwitterClient;
  private scheduledJobs: Map<number, NodeJS.Timeout> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    try {
      // Validate required environment variables
      this.validateEnvVars();

      // Initialize Twitter client
      this.twitterClient = new TwitterClient({
        apiKey: process.env.TWITTER_API_KEY!,
        apiKeySecret: process.env.TWITTER_API_SECRET!,
        accessToken: process.env.TWITTER_ACCESS_TOKEN!,
        accessTokenSecret: process.env.TWITTER_ACCESS_SECRET!,
        bearerToken: process.env.TWITTER_BEARER_TOKEN!,
        clientId: process.env.TWITTER_CLIENT_ID!,
        clientSecret: process.env.TWITTER_CLIENT_SECRET!,
        callbackUrl: `${process.env.APP_URL || 'http://localhost:3000'}/api/twitter/callback`
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize TwitterPosterService:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Validates that all required environment variables are present
   */
  private validateEnvVars() {
    const required = [
      'TWITTER_API_KEY',
      'TWITTER_API_SECRET',
      'TWITTER_ACCESS_TOKEN',
      'TWITTER_ACCESS_SECRET',
      'TWITTER_BEARER_TOKEN',
      'TWITTER_CLIENT_ID',
      'TWITTER_CLIENT_SECRET'
    ];

    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables for Twitter API: ${missing.join(', ')}`);
    }
  }

  /**
   * Checks if the service is properly initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Uses XAI to generate a tweet based on the given article content
   * 
   * @param content The article content
   * @param title The article title
   * @param tags Optional tags or keywords
   * @returns Generated tweet text
   */
  async generateTweetFromArticle(content: string, title: string, tags: string[] = []): Promise<string> {
    try {
      // Prepare the prompt for XAI
      const prompt = `Generate a professional tweet about this web development article. 
      
      Title: "${title}"
      
      Content summary: ${content.substring(0, 500)}${content.length > 500 ? '...' : ''}
      
      Tags: ${tags.join(', ')}
      
      Guidelines:
      - Use a professional tone suitable for a web development company named Elevion
      - Keep under 280 characters
      - Include a professional call to action
      - Include relevant hashtags (max 3)
      - Do not use excessive emoji
      - Maintain a professional, elegant style with a slate-blue corporate feel
      
      Tweet:`;

      // Use grok-3-mini for faster response
      const response = await grokApi.generateText(prompt, 'grok-3-mini');
      
      // Clean up and limit the tweet text
      let tweet = response.trim();
      
      // Ensure the tweet doesn't exceed 280 characters
      if (tweet.length > 280) {
        tweet = tweet.substring(0, 277) + '...';
      }
      
      return tweet;
    } catch (error) {
      console.error('Error generating tweet:', error);
      throw new Error('Failed to generate tweet from article');
    }
  }

  /**
   * Schedules a tweet for posting at a future time
   * 
   * @param tweetText The text to post
   * @param scheduledTime When to post the tweet
   * @param articleId Optional ID of the associated article
   * @returns The scheduled tweet record
   */
  async scheduleTweet(tweetText: string, scheduledTime: Date, articleId?: number): Promise<TwitterPost> {
    try {
      // Insert the scheduled tweet into the database
      const [scheduledTweet] = await db.insert(twitterPosts).values({
        content: tweetText,
        scheduledTime: scheduledTime,
        status: 'scheduled',
        articleId: articleId || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      // Schedule the tweet to be posted at the scheduled time
      this.scheduleJob(scheduledTweet);

      return scheduledTweet;
    } catch (error) {
      console.error('Error scheduling tweet:', error);
      throw new Error('Failed to schedule tweet');
    }
  }

  /**
   * Sets up a scheduled job to post a tweet at the specified time
   */
  private scheduleJob(tweet: TwitterPost): void {
    // Calculate milliseconds until scheduled time
    const now = new Date();
    const scheduledTime = new Date(tweet.scheduledTime);
    const timeUntilPost = scheduledTime.getTime() - now.getTime();

    // Only schedule if the time is in the future
    if (timeUntilPost <= 0) {
      console.log(`Tweet ID ${tweet.id} scheduled time has already passed, marking as missed`);
      this.markTweetAsMissed(tweet.id);
      return;
    }

    // Schedule the tweet
    const job = setTimeout(async () => {
      await this.postScheduledTweet(tweet.id);
    }, timeUntilPost);

    // Store the job reference for potential cancellation
    this.scheduledJobs.set(tweet.id, job);
    console.log(`Tweet ID ${tweet.id} scheduled for ${scheduledTime.toISOString()}`);
  }

  /**
   * Marks a tweet as missed
   */
  private async markTweetAsMissed(tweetId: number): Promise<void> {
    try {
      await db.update(twitterPosts)
        .set({ status: 'missed', updatedAt: new Date() })
        .where(eq(twitterPosts.id, tweetId));
    } catch (error) {
      console.error(`Error marking tweet ${tweetId} as missed:`, error);
    }
  }

  /**
   * Posts a scheduled tweet to Twitter
   */
  private async postScheduledTweet(tweetId: number): Promise<void> {
    try {
      // Get the tweet from the database
      const [tweet] = await db.select()
        .from(twitterPosts)
        .where(eq(twitterPosts.id, tweetId));

      if (!tweet) {
        console.error(`Tweet ID ${tweetId} not found in database`);
        return;
      }

      // Update status to processing
      await db.update(twitterPosts)
        .set({ status: 'processing', updatedAt: new Date() })
        .where(eq(twitterPosts.id, tweetId));

      // Post the tweet to Twitter
      const response = await this.twitterClient.createTweet(tweet.content);

      // Update with success information
      await db.update(twitterPosts)
        .set({
          status: 'posted',
          externalId: response.data?.id?.toString() || null,
          postedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(twitterPosts.id, tweetId));

      console.log(`Successfully posted tweet ID ${tweetId} to Twitter`);
    } catch (error) {
      console.error(`Error posting tweet ${tweetId}:`, error);
      
      // Update with failure information
      await db.update(twitterPosts)
        .set({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          updatedAt: new Date()
        })
        .where(eq(twitterPosts.id, tweetId));
    } finally {
      // Clean up the scheduled job
      this.scheduledJobs.delete(tweetId);
    }
  }

  /**
   * Gets all scheduled tweets
   */
  async getScheduledTweets(): Promise<TwitterPost[]> {
    return await db.select()
      .from(twitterPosts)
      .where(eq(twitterPosts.status, 'scheduled'))
      .orderBy(twitterPosts.scheduledTime);
  }

  /**
   * Gets all tweets for a specific day
   */
  async getTweetsForDay(date: Date): Promise<TwitterPost[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return await db.select()
      .from(twitterPosts)
      .where(
        and(
          gte(twitterPosts.scheduledTime, startOfDay),
          lte(twitterPosts.scheduledTime, endOfDay)
        )
      )
      .orderBy(twitterPosts.scheduledTime);
  }

  /**
   * Gets all tweets with a given status
   */
  async getTweetsByStatus(status: string): Promise<TwitterPost[]> {
    return await db.select()
      .from(twitterPosts)
      .where(eq(twitterPosts.status, status))
      .orderBy(twitterPosts.scheduledTime);
  }

  /**
   * Gets tweet stats by status
   */
  async getTweetStats(): Promise<Record<string, number>> {
    const statuses = ['scheduled', 'posted', 'failed', 'missed', 'processing'];
    const stats: Record<string, number> = {};
    
    for (const status of statuses) {
      const count = await db.select({ count: db.fn.count() })
        .from(twitterPosts)
        .where(eq(twitterPosts.status, status));
      
      stats[status] = Number(count[0]?.count || 0);
    }
    
    // Get total
    const total = await db.select({ count: db.fn.count() }).from(twitterPosts);
    stats.total = Number(total[0]?.count || 0);
    
    return stats;
  }

  /**
   * Cancels a scheduled tweet
   */
  async cancelScheduledTweet(tweetId: number): Promise<boolean> {
    try {
      // Get the tweet
      const [tweet] = await db.select()
        .from(twitterPosts)
        .where(eq(twitterPosts.id, tweetId));
      
      if (!tweet || tweet.status !== 'scheduled') {
        return false;
      }
      
      // Cancel the scheduled job
      const job = this.scheduledJobs.get(tweetId);
      if (job) {
        clearTimeout(job);
        this.scheduledJobs.delete(tweetId);
      }
      
      // Update the status in the database
      await db.update(twitterPosts)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(twitterPosts.id, tweetId));
      
      return true;
    } catch (error) {
      console.error(`Error cancelling tweet ${tweetId}:`, error);
      return false;
    }
  }

  /**
   * Reschedules a tweet
   */
  async rescheduleTweet(tweetId: number, newScheduledTime: Date): Promise<boolean> {
    try {
      // Get the tweet
      const [tweet] = await db.select()
        .from(twitterPosts)
        .where(eq(twitterPosts.id, tweetId));
      
      if (!tweet || !['scheduled', 'missed', 'failed', 'cancelled'].includes(tweet.status)) {
        return false;
      }
      
      // Cancel the current scheduled job if exists
      const job = this.scheduledJobs.get(tweetId);
      if (job) {
        clearTimeout(job);
        this.scheduledJobs.delete(tweetId);
      }
      
      // Update the schedule
      const [updatedTweet] = await db.update(twitterPosts)
        .set({ 
          status: 'scheduled', 
          scheduledTime: newScheduledTime,
          updatedAt: new Date(),
          errorMessage: null
        })
        .where(eq(twitterPosts.id, tweetId))
        .returning();
      
      // Create a new schedule
      this.scheduleJob(updatedTweet);
      
      return true;
    } catch (error) {
      console.error(`Error rescheduling tweet ${tweetId}:`, error);
      return false;
    }
  }

  /**
   * Initializes all scheduled tweets from the database
   * Call this on server startup
   */
  async initializeScheduledTweets(): Promise<void> {
    try {
      // Get all scheduled tweets
      const scheduledTweets = await this.getScheduledTweets();
      
      // Schedule each tweet
      for (const tweet of scheduledTweets) {
        this.scheduleJob(tweet);
      }
      
      console.log(`Initialized ${scheduledTweets.length} scheduled tweets`);
    } catch (error) {
      console.error('Error initializing scheduled tweets:', error);
    }
  }
}

// Export a singleton instance
export const twitterPoster = new TwitterPosterService();