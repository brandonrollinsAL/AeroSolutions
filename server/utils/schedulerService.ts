import { db } from '../db';
import { grokApi } from '../grok';
import * as achievementService from './achievementService';

/**
 * Scheduler Service
 * Handles scheduled tasks for checking achievements and milestones
 */

// Export the service as an object
export const schedulerService = {
  startScheduledTasks,
  runAchievementCheck
};

// Schedule daily milestone checks
function startScheduledTasks() {
  console.log('Starting achievement scheduling service...');
  
  // Run achievement check immediately at startup
  setTimeout(runAchievementCheck, 5000);

  // Set up a daily check for achievements at 00:05 AM
  const now = new Date();
  const targetTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1, // Tomorrow
    0, // Hour: 00
    5, // Minute: 05
    0 // Second: 00
  );

  let timeUntilTargetTime = targetTime.getTime() - now.getTime();
  
  // Schedule the first run
  setTimeout(() => {
    runAchievementCheck();
    // Then run it every 24 hours
    setInterval(runAchievementCheck, 24 * 60 * 60 * 1000);
  }, timeUntilTargetTime);
  
  console.log(`Achievement checks scheduled to run daily at 12:05 AM (next run in ${Math.round(timeUntilTargetTime / (60 * 60 * 1000))} hours)`);
}

// Check for any achievements
async function runAchievementCheck() {
  console.log('Running scheduled achievement check...');
  
  try {
    const newAchievementsCount = await achievementService.checkForNewAchievements();
    console.log(`Achievement check completed. Found ${newAchievementsCount} new achievements.`);
  } catch (error) {
    console.error('Error running achievement check:', error);
  }
  
  try {
    const specialDayAchievements = await achievementService.checkForSpecialDays();
    console.log(`Special day achievements check completed. Found ${specialDayAchievements} special day achievements.`);
  } catch (error) {
    console.error('Error running special day achievement check:', error);
  }
}

// Add more scheduled tasks as needed