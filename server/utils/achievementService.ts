import { sql, eq, and, or, gte, lte, desc, count } from 'drizzle-orm';
import { db } from '../db';
import { 
  users,
  userActivity,
  mockupRequests,
  mockupEngagement,
  userRetentionMessages,
  notifications
} from '@shared/schema';
import { generateText, generateJson } from './xaiClient';
import { sendEmail } from './emailService';

/**
 * Types of user achievements that can be tracked
 */
export type AchievementType = 
  | 'first_mockup_created'
  | 'first_mockup_viewed'
  | 'profile_completed'
  | 'account_anniversary'
  | 'birthday'
  | 'first_project_completed'
  | 'five_mockups_created'
  | 'ten_mockups_created'
  | 'high_engagement'
  | 'first_feedback_given';

/**
 * Achievement metadata for notification generation
 */
interface AchievementMetadata {
  id: AchievementType;
  title: string;
  description: string;
  congratsMessage: string;
  icon?: string;
  points?: number;
}

/**
 * User Achievement Service
 * Tracks, detects and rewards user achievements
 */
export class AchievementService {
  private static instance: AchievementService;
  
  // Achievement definitions with templates for notifications
  private achievementTemplates: Record<AchievementType, AchievementMetadata> = {
    first_mockup_created: {
      id: 'first_mockup_created',
      title: 'First Mockup Created',
      description: 'You created your first website mockup!',
      congratsMessage: 'Congratulations on creating your first website mockup! Your journey to an amazing website has begun.',
      icon: '🎨',
      points: 100
    },
    first_mockup_viewed: {
      id: 'first_mockup_viewed',
      title: 'First Mockup Viewed',
      description: 'You viewed your first website mockup!',
      congratsMessage: 'Great job checking out your first website mockup! We hope you enjoyed the design.',
      icon: '👀',
      points: 50
    },
    profile_completed: {
      id: 'profile_completed',
      title: 'Profile Completed',
      description: 'You completed your user profile!',
      congratsMessage: 'Thanks for completing your profile! This helps us personalize your experience.',
      icon: '✅',
      points: 75
    },
    account_anniversary: {
      id: 'account_anniversary',
      title: 'Account Anniversary',
      description: 'Happy anniversary with Elevion!',
      congratsMessage: 'Happy anniversary! Thank you for being with us for another year.',
      icon: '🎂',
      points: 150
    },
    birthday: {
      id: 'birthday',
      title: 'Birthday Celebration',
      description: 'Happy birthday from Elevion!',
      congratsMessage: 'Happy birthday! We hope you have a fantastic day!',
      icon: '🎉',
      points: 200
    },
    first_project_completed: {
      id: 'first_project_completed',
      title: 'First Project Completed',
      description: 'You completed your first project!',
      congratsMessage: 'Congratulations on completing your first project! We can\'t wait to see what you\'ll build next.',
      icon: '🏆',
      points: 250
    },
    five_mockups_created: {
      id: 'five_mockups_created',
      title: 'Five Mockups Created',
      description: 'You\'ve created five mockups!',
      congratsMessage: 'You\'ve created 5 mockups! You\'re becoming a design expert!',
      icon: '⭐',
      points: 300
    },
    ten_mockups_created: {
      id: 'ten_mockups_created',
      title: 'Ten Mockups Created',
      description: 'You\'ve created ten mockups!',
      congratsMessage: 'Wow! You\'ve created 10 mockups! You\'re a mockup master!',
      icon: '🌟',
      points: 500
    },
    high_engagement: {
      id: 'high_engagement',
      title: 'High Engagement',
      description: 'You\'re a highly engaged user!',
      congratsMessage: 'Your engagement with our platform is impressive! Thank you for your active participation.',
      icon: '💯',
      points: 350
    },
    first_feedback_given: {
      id: 'first_feedback_given',
      title: 'First Feedback Given',
      description: 'You gave your first feedback!',
      congratsMessage: 'Thank you for providing your first feedback! Your insights help us improve.',
      icon: '💬',
      points: 75
    }
  };

  private constructor() {}

  public static getInstance(): AchievementService {
    if (!AchievementService.instance) {
      AchievementService.instance = new AchievementService();
    }
    return AchievementService.instance;
  }

  /**
   * Check for and process new user achievements
   * @param userId The user ID to check for achievements
   * @returns Array of detected achievements
   */
  async checkAchievements(userId: number): Promise<AchievementType[]> {
    try {
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user || user.length === 0) return [];

      const userRecord = user[0];
      const achievementsToNotify: AchievementType[] = [];

      // Check each achievement type
      const checkFunctions: Array<() => Promise<AchievementType | null>> = [
        () => this.checkFirstMockupCreated(userId),
        () => this.checkFirstMockupViewed(userId),
        () => this.checkProfileCompleted(userRecord),
        () => this.checkAccountAnniversary(userRecord),
        () => this.checkBirthday(userRecord),
        () => this.checkFirstProjectCompleted(userId),
        () => this.checkMockupMilestone(userId, 5),
        () => this.checkMockupMilestone(userId, 10),
        () => this.checkHighEngagement(userId),
        () => this.checkFirstFeedbackGiven(userId)
      ];

      // Run all checks in parallel
      const achievementResults = await Promise.all(checkFunctions.map(fn => fn()));
      
      // Filter out null results and send notifications for new achievements
      for (const achievement of achievementResults) {
        if (achievement) {
          // Check if we've already notified the user about this achievement
          const alreadyNotified = await this.hasAchievementBeenNotified(userId, achievement);
          
          if (!alreadyNotified) {
            await this.sendAchievementNotification(userId, achievement);
            achievementsToNotify.push(achievement);
          }
        }
      }

      return achievementsToNotify;
    } catch (error) {
      console.error(`Error checking achievements for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Checks if a user has been notified about an achievement already
   */
  private async hasAchievementBeenNotified(userId: number, achievementType: AchievementType): Promise<boolean> {
    const existingNotifications = await db.select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.type, 'achievement'),
          sql`metadata->>'achievementType' = ${achievementType}`
        )
      )
      .limit(1);
    
    return existingNotifications.length > 0;
  }

  /**
   * Sends an achievement notification to the user
   */
  private async sendAchievementNotification(userId: number, achievementType: AchievementType): Promise<void> {
    const template = this.achievementTemplates[achievementType];
    if (!template) return;

    try {
      // Create personalized message with XAI
      const personalizedMessage = await this.generatePersonalizedAchievementMessage(userId, achievementType);
      
      // Create in-app notification
      await db.insert(notifications).values({
        userId,
        type: 'achievement',
        title: template.title,
        content: personalizedMessage || template.congratsMessage,
        status: 'unread',
        metadata: {
          achievementType,
          icon: template.icon,
          points: template.points,
          timestamp: new Date().toISOString()
        }
      });
      
      // Get user email for sending email notification
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (user && user.email) {
        // Send email notification
        await sendEmail({
          to: user.email,
          from: process.env.EMAIL_FROM || 'info@elevion.dev',
          subject: `Achievement Unlocked: ${template.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <h2 style="color: #3B5B9D;">Achievement Unlocked! ${template.icon || '🏆'}</h2>
              <h3 style="color: #00D1D1;">${template.title}</h3>
              <p style="font-size: 16px; line-height: 1.5;">${personalizedMessage || template.congratsMessage}</p>
              <p style="font-size: 14px; margin-top: 30px; color: #666;">
                Keep up the great work!<br>
                The Elevion Team
              </p>
            </div>
          `
        });
      }
    } catch (error) {
      console.error(`Error sending achievement notification for user ${userId}:`, error);
    }
  }

  /**
   * Generate a personalized achievement message using XAI
   */
  private async generatePersonalizedAchievementMessage(userId: number, achievementType: AchievementType): Promise<string | null> {
    try {
      const template = this.achievementTemplates[achievementType];
      
      // Get user data for personalization
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) return null;
      
      const firstName = user.firstName || user.username.split(' ')[0];
      const businessType = user.businessType || "business";
      
      // Create prompt for XAI
      const systemPrompt = `You are Elevion's user success assistant. You craft friendly, personalized celebration messages for user achievements.`;
      
      const prompt = `
        Write a personalized congratulatory message for the following achievement:
        - Achievement: ${template.title} (${template.description})
        - User's first name: ${firstName}
        - User's business type: ${businessType}
        
        Make the message friendly, upbeat, and specific to this particular achievement.
        Keep it brief (3 sentences max) but authentic and engaging.
        Avoid generic language and overly formal tone.
        Don't use "Congratulations on..." at the start of every message.
        Vary your message style.
      `;
      
      // Call XAI API
      const message = await generateText(prompt, systemPrompt, {
        model: 'grok-2-1212',
        temperature: 0.7,
        max_tokens: 120
      });
      
      return message;
    } catch (error) {
      console.error("Error generating personalized achievement message:", error);
      return null;
    }
  }

  /* Achievement detection methods */

  /**
   * Check if a user has created their first mockup
   */
  private async checkFirstMockupCreated(userId: number): Promise<AchievementType | null> {
    const mockups = await db
      .select({ count: count() })
      .from(mockupRequests)
      .where(eq(mockupRequests.userId, userId))
      .limit(1);
    
    if (mockups.length > 0 && mockups[0].count === 1) {
      return 'first_mockup_created';
    }
    
    return null;
  }
  
  /**
   * Check if a user has viewed their first mockup
   */
  private async checkFirstMockupViewed(userId: number): Promise<AchievementType | null> {
    // First, find mockups created by this user
    const userMockups = await db
      .select()
      .from(mockupRequests)
      .where(eq(mockupRequests.userId, userId));
    
    if (userMockups.length === 0) return null;
    
    // Check if any of these mockups have been viewed
    for (const mockup of userMockups) {
      const [engagement] = await db
        .select()
        .from(mockupEngagement)
        .where(
          and(
            eq(mockupEngagement.mockupId, mockup.id),
            gte(mockupEngagement.views, 1)
          )
        )
        .limit(1);
      
      if (engagement) {
        return 'first_mockup_viewed';
      }
    }
    
    return null;
  }
  
  /**
   * Check if a user has completed their profile
   */
  private async checkProfileCompleted(user: any): Promise<AchievementType | null> {
    // Consider a profile complete if they have firstName, lastName, and businessType
    if (user.firstName && user.lastName && user.businessType) {
      return 'profile_completed';
    }
    
    return null;
  }
  
  /**
   * Check if today is the user's account anniversary
   */
  private async checkAccountAnniversary(user: any): Promise<AchievementType | null> {
    if (!user.createdAt) return null;
    
    const today = new Date();
    const createdAt = new Date(user.createdAt);
    
    // Check if it's the anniversary of account creation (same month and day)
    if (today.getMonth() === createdAt.getMonth() && 
        today.getDate() === createdAt.getDate() && 
        today.getFullYear() > createdAt.getFullYear()) {
      return 'account_anniversary';
    }
    
    return null;
  }
  
  /**
   * Check if today is the user's birthday
   * Note: Would need a birthdate field in the user model
   */
  private async checkBirthday(user: any): Promise<AchievementType | null> {
    // Check if user has birthdate information
    // This would require a schema change - for now we'll check if it's in the preferences
    if (user.preferences) {
      try {
        const preferences = typeof user.preferences === 'string' 
          ? JSON.parse(user.preferences) 
          : user.preferences;
        
        if (preferences.birthdate) {
          const birthdate = new Date(preferences.birthdate);
          const today = new Date();
          
          // Check if today is the user's birthday (same month and day)
          if (today.getMonth() === birthdate.getMonth() && 
              today.getDate() === birthdate.getDate()) {
            return 'birthday';
          }
        }
      } catch (e) {
        console.error("Error parsing user preferences:", e);
      }
    }
    
    return null;
  }
  
  /**
   * Check if a user has completed their first project
   */
  private async checkFirstProjectCompleted(userId: number): Promise<AchievementType | null> {
    const completedMockups = await db
      .select({ count: count() })
      .from(mockupRequests)
      .where(
        and(
          eq(mockupRequests.userId, userId),
          eq(mockupRequests.status, 'completed')
        )
      );
    
    if (completedMockups.length > 0 && completedMockups[0].count >= 1) {
      return 'first_project_completed';
    }
    
    return null;
  }
  
  /**
   * Check if a user has created a specific number of mockups
   */
  private async checkMockupMilestone(userId: number, milestone: number): Promise<AchievementType | null> {
    const mockupCount = await db
      .select({ count: count() })
      .from(mockupRequests)
      .where(eq(mockupRequests.userId, userId));
    
    if (mockupCount.length > 0) {
      const count = Number(mockupCount[0].count);
      
      if (milestone === 5 && count === 5) {
        return 'five_mockups_created';
      } else if (milestone === 10 && count === 10) {
        return 'ten_mockups_created';
      }
    }
    
    return null;
  }
  
  /**
   * Check if a user has high engagement based on activity
   */
  private async checkHighEngagement(userId: number): Promise<AchievementType | null> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Count user activities in the last 30 days
    const activityCount = await db
      .select({ count: count() })
      .from(userActivity)
      .where(
        and(
          eq(userActivity.userId, userId),
          gte(userActivity.timestamp, thirtyDaysAgo)
        )
      );
    
    // Consider high engagement if they have more than 20 activities in 30 days
    if (activityCount.length > 0 && activityCount[0].count > 20) {
      return 'high_engagement';
    }
    
    return null;
  }
  
  /**
   * Check if a user has given their first feedback
   */
  private async checkFirstFeedbackGiven(userId: number): Promise<AchievementType | null> {
    // Check if user has given feedback on any mockup
    const feedback = await db
      .select()
      .from(mockupEngagement)
      .innerJoin(mockupRequests, eq(mockupEngagement.mockupId, mockupRequests.id))
      .where(
        and(
          eq(mockupRequests.userId, userId),
          sql`${mockupEngagement.feedback} IS NOT NULL`
        )
      )
      .limit(1);
    
    if (feedback.length > 0) {
      return 'first_feedback_given';
    }
    
    return null;
  }
}

export const achievementService = AchievementService.getInstance();