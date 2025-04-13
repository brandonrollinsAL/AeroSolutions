import { db } from '../db';
import { users, userActivity, userRetentionMessages } from '@shared/schema';
import { eq, and, lte, desc, gte, sql } from 'drizzle-orm';
import { generateText, generateJson } from './xaiClient';
import { sendCampaignEmail } from './emailService';
import { addDays, subDays, format } from 'date-fns';

/**
 * User retention service that analyzes user activity,
 * generates targeted retention messages, and delivers them
 * through appropriate channels
 */
export class RetentionService {
  private static instance: RetentionService;

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
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    
    try {
      // Get users with their most recent activity
      const usersWithActivity = await db.select({
        userId: users.id,
        lastActivity: sql<Date>`MAX(${userActivity.timestamp})`,
      })
      .from(users)
      .leftJoin(userActivity, eq(users.id, userActivity.userId))
      .groupBy(users.id);

      // Calculate risk scores based on recency of activity
      const atRiskUsers = usersWithActivity.map(user => {
        const lastActivity = user.lastActivity || subDays(now, 60); // Default to 60 days if no activity
        const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        
        // Calculate risk score (0-100) where higher means more at risk
        // 0-7 days: low risk (0-30)
        // 8-14 days: medium risk (31-60)
        // 15-30 days: high risk (61-90)
        // >30 days: very high risk (91-100)
        let riskScore = 0;
        
        if (daysSinceActivity <= 7) {
          riskScore = (daysSinceActivity / 7) * 30;
        } else if (daysSinceActivity <= 14) {
          riskScore = 30 + ((daysSinceActivity - 7) / 7) * 30;
        } else if (daysSinceActivity <= 30) {
          riskScore = 60 + ((daysSinceActivity - 14) / 16) * 30;
        } else {
          riskScore = 90 + Math.min(((daysSinceActivity - 30) / 30) * 10, 10);
        }
        
        return {
          userId: user.userId,
          riskScore: Math.min(Math.round(riskScore), 100),
          lastActivity,
          daysSinceActivity
        };
      });
      
      // Filter and sort by risk score (higher first)
      return atRiskUsers
        .filter(user => user.riskScore > 30) // Only users with medium to high risk
        .sort((a, b) => b.riskScore - a.riskScore);
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
      // Get user information
      const [userInfo] = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId));
      
      if (!userInfo) {
        throw new Error(`User not found with ID ${userId}`);
      }
      
      // Get user's recent activity
      const thirtyDaysAgo = subDays(new Date(), 30);
      const recentActivity = await db.select({
        type: userActivity.type,
        detail: userActivity.detail,
        timestamp: userActivity.timestamp
      })
      .from(userActivity)
      .where(and(
        eq(userActivity.userId, userId),
        gte(userActivity.timestamp, thirtyDaysAgo)
      ))
      .orderBy(desc(userActivity.timestamp))
      .limit(10);
      
      // Get project milestones
      const projectMilestones = await db.select({
        type: 'project' as const,
        title: 'title' as any, // Assuming projects table has title
        completedSteps: 'completedSteps' as any, // Assuming projects have completed steps
        timestamp: 'updatedAt' as any // Assuming projects have updatedAt
      })
      .from(sql`projects`) // Replace with actual project table
      .where(eq(sql`user_id`, userId))
      .limit(5);
      
      // Get previous retention messages sent
      const previousMessages = await db.select({
        type: userRetentionMessages.type,
        content: userRetentionMessages.content,
        sentAt: userRetentionMessages.createdAt
      })
      .from(userRetentionMessages)
      .where(eq(userRetentionMessages.userId, userId))
      .orderBy(desc(userRetentionMessages.createdAt))
      .limit(3);
      
      // Calculate days since registration
      const daysSinceRegistration = Math.floor(
        (new Date().getTime() - new Date(userInfo.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      return {
        user: {
          ...userInfo,
          daysSinceRegistration
        },
        recentActivity,
        projectMilestones,
        previousMessages
      };
    } catch (error) {
      console.error(`Error getting activity context for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Generates a personalized retention message using xAI
   * @param userId User to generate message for
   * @param messageType Type of message (email, in-app, etc)
   */
  async generateRetentionMessage(userId: number, messageType: 'email' | 'in-app' = 'email'): Promise<string> {
    try {
      // Get user context for personalization
      const userContext = await this.getUserActivityContext(userId);
      
      // Prepare prompt for xAI
      const prompt = `
You are a user retention specialist for Elevion, a web development platform for small businesses.
Create a personalized ${messageType === 'email' ? 'email message' : 'in-app notification'} to encourage a user to return and engage with the platform.

USER PROFILE:
- Name: ${userContext.user.name || userContext.user.username}
- Days since registration: ${userContext.user.daysSinceRegistration}
- Days since last activity: ${userContext.recentActivity.length > 0 ? 
  Math.floor((new Date().getTime() - new Date(userContext.recentActivity[0].timestamp).getTime()) / (1000 * 60 * 60 * 24)) : 
  'Unknown'}
- Recent activities: ${userContext.recentActivity.map(a => `${a.type} (${format(new Date(a.timestamp), 'MMM d')})`).join(', ')}

GUIDELINES:
- Be conversational and friendly, not pushy or salesy
- Acknowledge their specific activity or lack thereof
- Highlight a value proposition relevant to their profile
- Include a clear call-to-action
- Keep the message concise (max 3 paragraphs)
- Don't use placeholders or variables - all content should be ready to send

${messageType === 'email' ? 'FORMAT AS EMAIL WITH SUBJECT LINE AND BODY' : 'FORMAT AS SHORT NOTIFICATION MESSAGE'}

Output ONLY the message text without any explanation or additional comments.
`;

      // Generate message using xAI
      const message = await generateText(prompt, 'grok-3-mini');
      
      // Store the generated message
      await db.insert(userRetentionMessages).values({
        userId,
        type: messageType,
        content: message,
        status: 'generated',
      });
      
      return message;
    } catch (error) {
      console.error(`Error generating retention message for user ${userId}:`, error);
      throw error;
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
      // Get user info
      const [user] = await db.select({
        id: users.id,
        email: users.email,
        username: users.username,
        name: users.name
      })
      .from(users)
      .where(eq(users.id, userId));
      
      if (!user) {
        throw new Error(`User not found with ID ${userId}`);
      }
      
      // Generate message if not provided
      const retentionMessage = message || await this.generateRetentionMessage(userId, messageType);
      
      // Deliver based on message type
      if (messageType === 'email') {
        // Extract subject line for email
        const subjectMatch = retentionMessage.match(/^Subject:(.+?)(?:\n|$)/i);
        const subject = subjectMatch ? subjectMatch[1].trim() : 'Elevion: We miss you!';
        
        // Extract or use full message body
        const body = subjectMatch ? 
          retentionMessage.substring(retentionMessage.indexOf('\n') + 1).trim() : 
          retentionMessage;
        
        // Send email via email campaign service
        await sendCampaignEmail({
          to: user.email,
          subject,
          content: body,
          campaignId: 'retention',
          userId: user.id
        });
        
        // Update message status
        await db.update(userRetentionMessages)
          .set({ status: 'sent' })
          .where(and(
            eq(userRetentionMessages.userId, userId),
            eq(userRetentionMessages.content, retentionMessage)
          ));
        
        return true;
      } else if (messageType === 'in-app') {
        // Store in-app notification
        await db.insert(sql`notifications`).values({
          userId: user.id,
          content: retentionMessage,
          type: 'retention',
          status: 'unread',
          createdAt: new Date()
        });
        
        // Update message status
        await db.update(userRetentionMessages)
          .set({ status: 'sent' })
          .where(and(
            eq(userRetentionMessages.userId, userId),
            eq(userRetentionMessages.content, retentionMessage)
          ));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error delivering retention message for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Runs the retention workflow to identify at-risk users and send messages
   * @param options Configuration options
   */
  async runRetentionCampaign(
    options: {
      riskThreshold?: number;   // Minimum risk score to send messages (0-100)
      maxUsers?: number;        // Maximum number of users to process
      channelPreference?: 'email' | 'in-app' | 'both';  // Preferred delivery channel
    } = {}
  ): Promise<{ processed: number; delivered: number; errors: number }> {
    const {
      riskThreshold = 60,       // Default to high risk only
      maxUsers = 50,            // Process up to 50 users by default
      channelPreference = 'both' // Use both channels by default
    } = options;
    
    // Track metrics
    const metrics = {
      processed: 0,
      delivered: 0,
      errors: 0
    };
    
    try {
      // Get at-risk users
      const atRiskUsers = await this.identifyAtRiskUsers();
      
      // Filter by risk threshold
      const usersToTarget = atRiskUsers
        .filter(user => user.riskScore >= riskThreshold)
        .slice(0, maxUsers);
      
      console.log(`Running retention campaign for ${usersToTarget.length} at-risk users`);
      
      // Process each user
      for (const user of usersToTarget) {
        try {
          metrics.processed++;
          
          // Determine which channels to use
          const channels: Array<'email' | 'in-app'> = [];
          if (channelPreference === 'both') {
            channels.push('email', 'in-app');
          } else {
            channels.push(channelPreference);
          }
          
          // Generate a single message for both channels
          const message = await this.generateRetentionMessage(user.userId, channels[0]);
          
          // Deliver through each channel
          for (const channel of channels) {
            await this.deliverRetentionMessage(user.userId, channel, message);
          }
          
          metrics.delivered++;
        } catch (error) {
          console.error(`Error processing user ${user.userId} for retention:`, error);
          metrics.errors++;
        }
      }
      
      console.log(`Retention campaign complete: ${metrics.delivered}/${metrics.processed} messages delivered, ${metrics.errors} errors`);
      return metrics;
    } catch (error) {
      console.error('Error running retention campaign:', error);
      throw error;
    }
  }
}

export const retentionService = RetentionService.getInstance();