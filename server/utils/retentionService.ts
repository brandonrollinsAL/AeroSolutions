import { sql, eq, and, lte, gte, desc } from 'drizzle-orm';
import { db } from '../db';
import { users, userActivity, userRetentionMessages, notifications } from '@shared/schema';
import { emailService } from './emailService';
import { callXAI, generateText } from './xaiClient';
import { logger } from './logger';

/**
 * User retention service that analyzes user activity,
 * generates targeted retention messages, and delivers them
 * through appropriate channels
 */
export class RetentionService {
  private static instance: RetentionService;
  private riskThreshold = 0.7; // Risk score threshold (0-1)
  private inactivityThresholdDays = 14; // Consider users inactive after this many days
  private campaignWindowDays = 30; // Don't send another retention message within this period

  private constructor() {}

  public static getInstance(): RetentionService {
    if (!RetentionService.instance) {
      RetentionService.instance = new RetentionService();
    }
    return RetentionService.instance;
  }

  /**
   * Identifies users at risk of churning based on activity patterns
   * @returns Array of user IDs and risk scores
   */
  async identifyAtRiskUsers(): Promise<Array<{ userId: number; riskScore: number; lastActivity: Date; daysSinceActivity: number }>> {
    try {
      // Get all active users
      const allUsers = await db.select().from(users).where(eq(users.role, 'user'));
      
      const results: Array<{ userId: number; riskScore: number; lastActivity: Date; daysSinceActivity: number }> = [];
      
      // For each user, analyze their activity
      for (const user of allUsers) {
        // Find their last activity
        const [lastActivityRecord] = await db
          .select()
          .from(userActivity)
          .where(eq(userActivity.userId, user.id))
          .orderBy(desc(userActivity.timestamp))
          .limit(1);

        const now = new Date();
        const lastActivity = lastActivityRecord?.timestamp || user.lastLoginAt || user.createdAt;
        
        if (!lastActivity) continue;
        
        // Calculate days since last activity
        const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        
        // Calculate risk score (0-1)
        // The longer inactive, the higher the risk, capped at 1.0
        const riskScore = Math.min(1.0, daysSinceActivity / this.inactivityThresholdDays);
        
        if (riskScore >= this.riskThreshold) {
          results.push({
            userId: user.id,
            riskScore,
            lastActivity,
            daysSinceActivity
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error identifying at-risk users:', error);
      return [];
    }
  }

  /**
   * Gets user's activity data to provide context for message generation
   */
  private async getUserActivityContext(userId: number): Promise<any> {
    try {
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user || user.length === 0) return null;

      // Get recent activities
      const recentActivities = await db
        .select()
        .from(userActivity)
        .where(eq(userActivity.userId, userId))
        .orderBy(desc(userActivity.timestamp))
        .limit(10);

      // Check for other data points we might have
      const [lastMessage] = await db
        .select()
        .from(userRetentionMessages)
        .where(eq(userRetentionMessages.userId, userId))
        .orderBy(desc(userRetentionMessages.createdAt))
        .limit(1);

      return {
        user: user[0],
        recentActivities,
        lastRetentionMessage: lastMessage,
        activityCount: recentActivities.length,
        businessType: user[0].businessType || 'unknown',
        daysSinceLastActivity: recentActivities.length > 0 
          ? Math.floor((new Date().getTime() - recentActivities[0].timestamp.getTime()) / (1000 * 60 * 60 * 24))
          : null
      };
    } catch (error) {
      console.error('Error getting user activity context:', error);
      return {};
    }
  }

  /**
   * Generates a personalized retention message using Elevion AI
   * @param userId User to generate message for
   * @param messageType Type of message (email, in-app, etc)
   */
  async generateRetentionMessage(userId: number, messageType: 'email' | 'in-app' = 'email'): Promise<string> {
    try {
      const context = await this.getUserActivityContext(userId);
      if (!context || !context.user) {
        return '';
      }

      const systemPrompt = `You are a personalized user retention specialist for Elevion, a web development company. 
Generate a personalized message to re-engage the user.
Follow these guidelines:
1. Message should be warm and professional
2. Refer to the user by name if available
3. Reference their recent activity or business type if available
4. Highlight the value of Elevion's services for their business
5. Include a clear next action or value proposition
6. Keep tone consistent with Elevion's brand voice (professional, helpful, innovative)
7. For email messages, include HTML formatting. For in-app messages, use plain text.`;

      const userPrompt = `Generate a personalized ${messageType} message for this user:
First Name: ${context.user.firstName || 'Valued Customer'}
Business Type: ${context.user.businessType || 'small business'}
Days Since Last Activity: ${context.daysSinceLastActivity || 'unknown'}
Recent Activity Types: ${context.recentActivities.map(a => a.type).join(', ') || 'no recent activity'}`;

      try {
        const response = await callXAI('/chat/completions', {
          model: 'grok-2-1212',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        });
        const message = response.choices[0].message.content;
        return message;
      } catch (err) {
        logger.error('Error generating retention message with XAI', err);
        return '';
      }
    } catch (error) {
      console.error('Error generating retention message:', error);
      return '';
    }
  }

  /**
   * Delivers retention messages through appropriate channels
   * @param userId User to deliver message to
   * @param messageType Type of message (email, in-app)
   * @param message Optional pre-generated message (if not provided, one will be generated)
   */
  async deliverRetentionMessage(
    userId: number, 
    messageType: 'email' | 'in-app' = 'email',
    message?: string
  ): Promise<boolean> {
    try {
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user || user.length === 0) return false;
      
      // Check if we've sent a message recently to avoid spamming
      const recentMessage = await db
        .select()
        .from(userRetentionMessages)
        .where(
          and(
            eq(userRetentionMessages.userId, userId),
            eq(userRetentionMessages.type, messageType),
            gte(
              userRetentionMessages.createdAt, 
              new Date(Date.now() - this.campaignWindowDays * 24 * 60 * 60 * 1000)
            )
          )
        )
        .limit(1);
      
      if (recentMessage.length > 0) {
        console.log(`Skip ${messageType} retention message for user ${userId}: recent message sent ${recentMessage[0].createdAt}`);
        return false;
      }
      
      // Generate message if not provided
      const retentionMessage = message || await this.generateRetentionMessage(userId, messageType);
      if (!retentionMessage) return false;
      
      // Record the message in database first
      const [insertedMessage] = await db
        .insert(userRetentionMessages)
        .values({
          userId,
          type: messageType,
          content: retentionMessage,
          status: 'generated',
          metadata: {}
        })
        .returning();
      
      let success = false;
      
      // Deliver based on type
      if (messageType === 'email' && user[0].email) {
        // Extract a good subject line from the message
        const subjectMatch = retentionMessage.match(/<h1>(.*?)<\/h1>|<strong>(.*?)<\/strong>|<b>(.*?)<\/b>/);
        const subject = subjectMatch ? 
          (subjectMatch[1] || subjectMatch[2] || subjectMatch[3] || 'We miss you at Elevion!') : 
          'We miss you at Elevion!';
          
        try {
          const response = await emailService.sendEmail({
            to: user[0].email,
            subject,
            html: retentionMessage,
            tags: ['retention', 'campaign'],
            'o:tracking': true
          });
          success = !!response.id;
          logger.info(`Retention email sent to ${user[0].email}`, {
            userId,
            messageId: response.id
          });
        } catch (err) {
          logger.error(`Failed to send retention email to ${user[0].email}`, err);
          success = false;
        }
      } else if (messageType === 'in-app') {
        // Create in-app notification
        await db.insert(notifications).values({
          userId,
          type: 'retention',
          title: 'We miss you!',
          content: retentionMessage,
          status: 'unread',
          metadata: { messageId: insertedMessage.id }
        });
        success = true;
      }
      
      // Update message status
      await db
        .update(userRetentionMessages)
        .set({ 
          status: success ? 'sent' : 'failed',
          updatedAt: new Date()
        })
        .where(eq(userRetentionMessages.id, insertedMessage.id));
      
      return success;
    } catch (error) {
      console.error('Error delivering retention message:', error);
      return false;
    }
  }

  /**
   * Runs the retention workflow to identify at-risk users and send messages
   * @param options Configuration options
   */
  async runRetentionCampaign(
    options: {
      messageType?: 'email' | 'in-app',
      dryRun?: boolean,
      maxUsers?: number
    } = {}
  ): Promise<{ 
    totalIdentified: number, 
    messagesSent: number, 
    errors: number 
  }> {
    const { 
      messageType = 'email',
      dryRun = false,
      maxUsers = 50
    } = options;
    
    try {
      const atRiskUsers = await this.identifyAtRiskUsers();
      let messagesSent = 0;
      let errors = 0;
      
      // Sort by risk score (highest first)
      const sortedUsers = atRiskUsers
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, maxUsers);
      
      if (dryRun) {
        console.log(`[DRY RUN] Identified ${sortedUsers.length} at-risk users`);
        return { totalIdentified: sortedUsers.length, messagesSent: 0, errors: 0 };
      }
      
      // Send messages to each user
      for (const user of sortedUsers) {
        try {
          const success = await this.deliverRetentionMessage(user.userId, messageType);
          if (success) {
            messagesSent++;
          } else {
            errors++;
          }
        } catch (error) {
          console.error(`Error sending retention message to user ${user.userId}:`, error);
          errors++;
        }
      }
      
      return {
        totalIdentified: sortedUsers.length,
        messagesSent,
        errors
      };
    } catch (error) {
      console.error('Error running retention campaign:', error);
      return { totalIdentified: 0, messagesSent: 0, errors: 1 };
    }
  }
}

export const retentionService = RetentionService.getInstance();