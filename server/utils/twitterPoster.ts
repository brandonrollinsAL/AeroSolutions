import { getTwitterClient, TwitterClient } from './twitterClient';
import { db } from '../db';
import { twitterPosts } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { generateText } from './xaiClient';
import type { TwitterPost } from '@shared/schema';

/**
 * Service for generating, scheduling, and posting to Twitter
 */
export class TwitterPosterService {
  private twitterClient: TwitterClient | null = null;
  private scheduledJobs: Map<number, NodeJS.Timeout> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    // Validate environment variables
    this.validateEnvVars();
    // Initialize Twitter client
    this.twitterClient = getTwitterClient();
  }

  /**
   * Validates that all required environment variables are present
   */
  private validateEnvVars() {
    const requiredVars = [
      'TWITTER_API_KEY',
      'TWITTER_API_SECRET',
      'TWITTER_ACCESS_TOKEN',
      'TWITTER_ACCESS_SECRET',
      'TWITTER_BEARER_TOKEN',
      'TWITTER_CLIENT_ID',
      'TWITTER_CLIENT_SECRET',
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.warn(`Missing Twitter environment variables: ${missingVars.join(', ')}`);
      console.warn('Twitter posting functionality will be disabled.');
      this.isInitialized = false;
    } else {
      this.isInitialized = true;
    }
  }

  /**
   * Checks if the service is properly initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.twitterClient !== null;
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
    if (!this.isReady()) {
      throw new Error('Twitter poster service is not initialized');
    }
    
    // Get the first 1000 characters of content to avoid token limits
    const truncatedContent = content.length > 1000 ? content.substring(0, 1000) + '...' : content;
    
    // Create a prompt for the model
    const prompt = `You are a social media expert crafting a tweet for a tech article. 
Given the following article title and partial content, create an engaging tweet (max 280 chars)
that will drive clicks to read the full article. Include hashtags for relevant keywords.
Maintain a professional tone that matches Elevion's brand as a web development company.

Article Title: ${title}
${tags.length > 0 ? `Keywords: ${tags.join(', ')}` : ''}
Article Content: ${truncatedContent}

Write ONLY the tweet text without any other explanations or formatting. It MUST be under 280 characters.`;

    try {
      // Use Elevion's xAI client to generate the tweet
      const tweetContent = await generateText(prompt, 'grok-3-mini');
      
      // Ensure the tweet is under 280 characters
      if (tweetContent.length > 280) {
        return tweetContent.substring(0, 277) + '...';
      }
      
      return tweetContent;
    } catch (error) {
      console.error('Error generating tweet content:', error);
      throw new Error('Failed to generate tweet content');
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
    if (!this.isReady()) {
      throw new Error('Twitter poster service is not initialized');
    }
    
    // Make sure the tweet is not too long
    if (tweetText.length > 280) {
      tweetText = tweetText.substring(0, 277) + '...';
    }
    
    try {
      // Insert the tweet into the database
      const [tweet] = await db.insert(twitterPosts).values({
        content: tweetText,
        status: 'scheduled',
        scheduledTime,
        articleId: articleId || null,
      }).returning();
      
      // Schedule the job to post the tweet
      this.scheduleJob(tweet);
      
      return tweet;
    } catch (error) {
      console.error('Error scheduling tweet:', error);
      throw new Error('Failed to schedule tweet');
    }
  }

  /**
   * Sets up a scheduled job to post a tweet at the specified time
   */
  private scheduleJob(tweet: TwitterPost): void {
    const now = new Date();
    const scheduledTime = new Date(tweet.scheduledTime!);
    const delay = scheduledTime.getTime() - now.getTime();
    
    // Only schedule if the time is in the future
    if (delay <= 0) {
      console.warn(`Tweet ${tweet.id} is scheduled in the past. Marking as missed.`);
      this.markTweetAsMissed(tweet.id);
      return;
    }
    
    // Clear any existing job for this tweet
    if (this.scheduledJobs.has(tweet.id)) {
      clearTimeout(this.scheduledJobs.get(tweet.id));
      this.scheduledJobs.delete(tweet.id);
    }
    
    // Schedule the job
    const job = setTimeout(() => {
      this.postScheduledTweet(tweet.id);
    }, delay);
    
    // Store the job reference
    this.scheduledJobs.set(tweet.id, job);
    
    console.log(`Tweet ${tweet.id} scheduled for ${scheduledTime.toISOString()}`);
  }

  /**
   * Marks a tweet as missed
   */
  private async markTweetAsMissed(tweetId: number): Promise<void> {
    try {
      await db.update(twitterPosts)
        .set({
          status: 'missed',
          updatedAt: new Date(),
        })
        .where(eq(twitterPosts.id, tweetId));
    } catch (error) {
      console.error(`Error marking tweet ${tweetId} as missed:`, error);
    }
  }

  /**
   * Posts a scheduled tweet to Twitter
   */
  private async postScheduledTweet(tweetId: number): Promise<void> {
    if (!this.isReady() || !this.twitterClient) {
      this.markTweetAsMissed(tweetId);
      return;
    }
    
    try {
      // First update the status to processing
      await db.update(twitterPosts)
        .set({
          status: 'processing',
          updatedAt: new Date(),
        })
        .where(eq(twitterPosts.id, tweetId));
      
      // Get the tweet from the database
      const [tweet] = await db.select()
        .from(twitterPosts)
        .where(eq(twitterPosts.id, tweetId));
      
      if (!tweet) {
        console.error(`Tweet ${tweetId} not found`);
        return;
      }
      
      // Post to Twitter
      const result = await this.twitterClient.createTweet(tweet.content);
      
      // Update the tweet with the result
      await db.update(twitterPosts)
        .set({
          status: 'posted',
          postedAt: new Date(),
          externalId: result.data.id,
          updatedAt: new Date(),
        })
        .where(eq(twitterPosts.id, tweetId));
      
      console.log(`Tweet ${tweetId} posted to Twitter with ID ${result.data.id}`);
    } catch (error) {
      console.error(`Error posting tweet ${tweetId}:`, error);
      
      // Update the tweet with the error
      await db.update(twitterPosts)
        .set({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : String(error),
          updatedAt: new Date(),
        })
        .where(eq(twitterPosts.id, tweetId));
    } finally {
      // Clean up the scheduled job
      if (this.scheduledJobs.has(tweetId)) {
        this.scheduledJobs.delete(tweetId);
      }
    }
  }

  /**
   * Gets all scheduled tweets
   */
  async getScheduledTweets(): Promise<TwitterPost[]> {
    return db.select()
      .from(twitterPosts)
      .where(eq(twitterPosts.status, 'scheduled'))
      .orderBy(twitterPosts.scheduledTime);
  }

  /**
   * Gets all tweets for a specific day
   */
  async getTweetsForDay(date: Date): Promise<TwitterPost[]> {
    // Set start and end of the day
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    
    return db.select()
      .from(twitterPosts)
      .where(
        and(
          twitterPosts.scheduledTime.gte(startOfDay),
          twitterPosts.scheduledTime.lte(endOfDay)
        )
      )
      .orderBy(twitterPosts.scheduledTime);
  }

  /**
   * Gets all tweets with a given status
   */
  async getTweetsByStatus(status: string): Promise<TwitterPost[]> {
    return db.select()
      .from(twitterPosts)
      .where(eq(twitterPosts.status, status))
      .orderBy(twitterPosts.scheduledTime);
  }

  /**
   * Gets tweet stats by status
   */
  async getTweetStats(): Promise<Record<string, number>> {
    const statuses = ['draft', 'scheduled', 'processing', 'posted', 'failed', 'cancelled', 'missed'];
    const stats: Record<string, number> = {};
    
    for (const status of statuses) {
      const count = await db.select({ count: db.fn.count() })
        .from(twitterPosts)
        .where(eq(twitterPosts.status, status));
      
      stats[status] = Number(count[0].count);
    }
    
    // Add total
    const total = await db.select({ count: db.fn.count() }).from(twitterPosts);
    stats.total = Number(total[0].count);
    
    return stats;
  }

  /**
   * Cancels a scheduled tweet
   */
  async cancelScheduledTweet(tweetId: number): Promise<boolean> {
    // Get the tweet to check it's in a state that can be cancelled
    const [tweet] = await db.select()
      .from(twitterPosts)
      .where(eq(twitterPosts.id, tweetId));
    
    if (!tweet || tweet.status !== 'scheduled') {
      return false;
    }
    
    // Clear the scheduled job
    if (this.scheduledJobs.has(tweetId)) {
      clearTimeout(this.scheduledJobs.get(tweetId));
      this.scheduledJobs.delete(tweetId);
    }
    
    // Update the tweet status
    await db.update(twitterPosts)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(twitterPosts.id, tweetId));
    
    return true;
  }

  /**
   * Reschedules a tweet
   */
  async rescheduleTweet(tweetId: number, newScheduledTime: Date): Promise<boolean> {
    // Get the tweet to check it's in a state that can be rescheduled
    const [tweet] = await db.select()
      .from(twitterPosts)
      .where(eq(twitterPosts.id, tweetId));
    
    if (!tweet || !['scheduled', 'missed', 'cancelled', 'failed'].includes(tweet.status)) {
      return false;
    }
    
    // Clear any existing scheduled job
    if (this.scheduledJobs.has(tweetId)) {
      clearTimeout(this.scheduledJobs.get(tweetId));
      this.scheduledJobs.delete(tweetId);
    }
    
    // Update the tweet
    await db.update(twitterPosts)
      .set({
        status: 'scheduled',
        scheduledTime: newScheduledTime,
        updatedAt: new Date(),
      })
      .where(eq(twitterPosts.id, tweetId));
    
    // Get the updated tweet
    const [updatedTweet] = await db.select()
      .from(twitterPosts)
      .where(eq(twitterPosts.id, tweetId));
    
    // Schedule the job
    this.scheduleJob(updatedTweet);
    
    return true;
  }

  /**
   * Initializes all scheduled tweets from the database
   * Call this on server startup
   */
  async initializeScheduledTweets(): Promise<void> {
    if (!this.isReady()) {
      console.warn('Twitter poster service is not initialized. Skipping tweet initialization.');
      return;
    }
    
    try {
      // Get all scheduled tweets
      const scheduledTweets = await this.getScheduledTweets();
      
      // Schedule all tweets
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