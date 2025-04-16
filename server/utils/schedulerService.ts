/**
 * Scheduler Service for Elevion Platform
 * 
 * Handles scheduling and running automated tasks including
 * XAI scanning, testing, and maintenance.
 */

import { tester } from './comprehensiveTester';
import fs from 'fs';
import path from 'path';
import { db } from '../db';
import { bug_reports } from '@shared/schema';

// Class to handle scheduling tests and maintenance
export class SchedulerService {
  private isInitialized: boolean = false;
  private dailyScanTimeout: NodeJS.Timeout | null = null;
  private weeklyScanTimeout: NodeJS.Timeout | null = null;
  
  // Initialize the scheduler
  public initialize() {
    if (this.isInitialized) {
      console.log('Scheduler already initialized');
      return;
    }
    
    console.log('Initializing test scheduler service...');
    
    // Schedule daily tests
    this.scheduleDailyTests();
    
    // Schedule weekly deep scans
    this.scheduleWeeklyScans();
    
    this.isInitialized = true;
    console.log('Test scheduler service initialized successfully');
  }
  
  // Shutdown the scheduler (for clean app termination)
  public shutdown() {
    console.log('Shutting down scheduler service...');
    
    if (this.dailyScanTimeout) {
      clearTimeout(this.dailyScanTimeout);
      this.dailyScanTimeout = null;
    }
    
    if (this.weeklyScanTimeout) {
      clearTimeout(this.weeklyScanTimeout);
      this.weeklyScanTimeout = null;
    }
    
    console.log('Scheduler service shut down');
  }
  
  // Schedule daily tests
  private scheduleDailyTests() {
    // Calculate time until next scheduled run (2 AM)
    const now = new Date();
    const targetHour = 2; // 2 AM
    
    let targetTime = new Date(now);
    targetTime.setHours(targetHour, 0, 0, 0);
    
    // If it's already past 2 AM, schedule for tomorrow
    if (now.getHours() >= targetHour) {
      targetTime.setDate(targetTime.getDate() + 1);
    }
    
    const timeUntilNextRun = targetTime.getTime() - now.getTime();
    
    console.log(`Daily tests scheduled to run at ${targetTime.toLocaleString()} (in ${(timeUntilNextRun / (1000 * 60 * 60)).toFixed(1)} hours)`);
    
    // Schedule the first run
    this.dailyScanTimeout = setTimeout(async () => {
      try {
        console.log('Running daily platform tests...');
        
        // Run tests and analyze logs
        const testResults = await tester.runAllTests();
        
        console.log(`Daily tests completed: ${testResults.passedTests}/${testResults.totalTests} passed`);
        
        if (testResults.criticalIssues > 0) {
          console.error(`⚠️ ${testResults.criticalIssues} critical issues found!`);
          
          // Log the critical issues summary
          await this.logTestSummary(testResults);
        }
        
        // Reschedule for the next day
        this.scheduleDailyTests();
      } catch (error) {
        console.error('Error running daily tests:', error);
        
        // Log the error
        await db.insert(bug_reports).values({
          source: 'SchedulerService',
          title: 'Error running daily tests',
          description: error instanceof Error ? error.message : 'Unknown error',
          severity: 'high',
          status: 'open',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // Reschedule despite the error
        this.scheduleDailyTests();
      }
    }, timeUntilNextRun);
  }
  
  // Schedule weekly deep scans
  private scheduleWeeklyScans() {
    // Calculate time until next scheduled run (Sunday at 3 AM)
    const now = new Date();
    const targetDay = 0; // Sunday
    const targetHour = 3; // 3 AM
    
    let targetTime = new Date(now);
    targetTime.setHours(targetHour, 0, 0, 0);
    
    // Adjust to the next Sunday
    const daysUntilSunday = (targetDay - now.getDay() + 7) % 7;
    targetTime.setDate(now.getDate() + daysUntilSunday);
    
    // If it's Sunday and already past 3 AM, schedule for next week
    if (now.getDay() === targetDay && now.getHours() >= targetHour) {
      targetTime.setDate(targetTime.getDate() + 7);
    }
    
    const timeUntilNextRun = targetTime.getTime() - now.getTime();
    const daysUntilNextRun = timeUntilNextRun / (1000 * 60 * 60 * 24);
    
    console.log(`Weekly deep scan scheduled to run on Sunday at ${targetHour}:00 AM (in ${daysUntilNextRun.toFixed(1)} days)`);
    
    // Schedule the deep scan
    this.weeklyScanTimeout = setTimeout(async () => {
      try {
        console.log('Running weekly deep scan...');
        
        // Import the runDailyXAIScan script and execute it
        // Run the test without importing to avoid circular dependencies
        // We're using the tester directly which is already imported
        console.log('Running weekly deep platform scan...');
        const testResults = await tester.runAllTests();
        console.log(`Deep scan completed: ${testResults.passedTests}/${testResults.totalTests} tests passed`);
        
        // Reschedule for the next week
        this.scheduleWeeklyScans();
      } catch (error) {
        console.error('Error running weekly scan:', error);
        
        // Log the error
        await db.insert(bug_reports).values({
          source: 'SchedulerService',
          title: 'Error running weekly deep scan',
          description: error instanceof Error ? error.message : 'Unknown error',
          severity: 'high', 
          status: 'open',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // Reschedule despite the error
        this.scheduleWeeklyScans();
      }
    }, timeUntilNextRun);
  }
  
  // Log a summary of test results to the bug reports
  private async logTestSummary(testResults: any) {
    try {
      // Get critical issues
      const criticalIssues = testResults.testResults.filter(
        (result: any) => !result.success && result.severity === 'critical'
      );
      
      // Format the issues for the bug report
      const issuesSummary = criticalIssues.map((issue: any, index: number) => 
        `${index + 1}. [${issue.category}] ${issue.message}\n   Location: ${issue.location || 'N/A'}`
      ).join('\n');
      
      // Create a bug report entry
      await db.insert(bug_reports).values({
        source: 'AutomatedTesting',
        title: `${criticalIssues.length} critical issues found in automated tests`,
        description: `Test Summary:\n\nTotal Tests: ${testResults.totalTests}\nPassed: ${testResults.passedTests}\nFailed: ${testResults.failedTests}\n\nCritical Issues:\n${issuesSummary}`,
        severity: 'critical',
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
    } catch (error) {
      console.error('Error logging test summary:', error);
    }
  }
}

// Export a singleton instance
export const scheduler = new SchedulerService();