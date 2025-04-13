import { db } from '../db';
import { users } from '@shared/schema';
import { achievementService, AchievementType } from './achievementService';

/**
 * Scheduler Service
 * Handles periodic tasks like checking for user achievements
 */
export class SchedulerService {
  private static instance: SchedulerService;
  private achievementCheckIntervalHours = 24; // Check for achievements daily
  private achievementIntervalId: NodeJS.Timeout | null = null;
  
  private constructor() {}

  public static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  /**
   * Start all scheduled tasks
   */
  startScheduledTasks(): void {
    this.startAchievementChecks();
    console.log('Scheduled tasks started');
  }

  /**
   * Stop all scheduled tasks
   */
  stopScheduledTasks(): void {
    if (this.achievementIntervalId) {
      clearInterval(this.achievementIntervalId);
      this.achievementIntervalId = null;
    }
    console.log('Scheduled tasks stopped');
  }

  /**
   * Start periodic achievement checks
   */
  private startAchievementChecks(): void {
    // Run once at startup
    this.checkAllUserAchievements();
    
    // Set up interval
    const intervalMs = this.achievementCheckIntervalHours * 60 * 60 * 1000;
    this.achievementIntervalId = setInterval(() => {
      this.checkAllUserAchievements();
    }, intervalMs);
    
    console.log(`Achievement checks scheduled every ${this.achievementCheckIntervalHours} hours`);
  }

  /**
   * Check achievements for all users
   */
  private async checkAllUserAchievements(): Promise<void> {
    try {
      console.log('Running scheduled achievement check for all users...');
      
      // Get all active users
      const allUsers = await db.select().from(users);
      let achievementsDetected = 0;
      
      // Check achievements for each user
      for (const user of allUsers) {
        try {
          const achievements = await achievementService.checkAchievements(user.id);
          if (achievements.length > 0) {
            achievementsDetected += achievements.length;
            console.log(`Detected ${achievements.length} achievements for user ${user.id}: ${achievements.join(', ')}`);
          }
        } catch (error) {
          console.error(`Error checking achievements for user ${user.id}:`, error);
        }
      }
      
      console.log(`Achievement check complete. Detected ${achievementsDetected} achievements across ${allUsers.length} users.`);
    } catch (error) {
      console.error('Error in scheduled achievement check:', error);
    }
  }
  
  /**
   * Manually check achievements for a specific user
   * This can be called on specific user actions
   */
  async checkUserAchievements(userId: number): Promise<AchievementType[]> {
    try {
      return await achievementService.checkAchievements(userId);
    } catch (error) {
      console.error(`Error checking achievements for user ${userId}:`, error);
      return [];
    }
  }
}

export const schedulerService = SchedulerService.getInstance();