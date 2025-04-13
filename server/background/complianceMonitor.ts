import { db } from '../db';
import { eq, desc, sql, lt, and, or } from 'drizzle-orm';
import { posts, marketplaceItems } from '@shared/schema';
import { complianceMonitor } from '../utils/complianceMonitor';

/**
 * Background process to automatically scan website content for compliance
 * with US laws, GDPR, and Google guidelines using XAI
 */
export class ComplianceMonitoringProcess {
  private runningFlag: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private intervalMs: number = 15 * 60 * 1000; // 15 minutes by default
  
  /**
   * Starts the compliance monitoring background process
   * @param intervalMinutes Minutes between compliance checks
   */
  start(intervalMinutes: number = 15) {
    if (this.runningFlag) {
      console.log('Compliance monitoring is already running.');
      return;
    }
    
    this.intervalMs = intervalMinutes * 60 * 1000;
    this.runningFlag = true;
    
    // Run immediately
    this.runComplianceChecks().catch(err => {
      console.error('Error in initial compliance check:', err);
    });
    
    // Schedule regular checks
    this.checkInterval = setInterval(() => {
      if (this.runningFlag) {
        this.runComplianceChecks().catch(err => {
          console.error('Error in scheduled compliance check:', err);
        });
      }
    }, this.intervalMs);
    
    console.log(`Compliance monitoring started. Checking every ${intervalMinutes} minutes.`);
  }
  
  /**
   * Stops the compliance monitoring background process
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    this.runningFlag = false;
    console.log('Compliance monitoring stopped.');
  }
  
  /**
   * Updates the interval between compliance checks
   * @param intervalMinutes New interval in minutes between checks
   */
  updateInterval(intervalMinutes: number) {
    this.intervalMs = intervalMinutes * 60 * 1000;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      
      this.checkInterval = setInterval(() => {
        if (this.runningFlag) {
          this.runComplianceChecks().catch(err => {
            console.error('Error in scheduled compliance check:', err);
          });
        }
      }, this.intervalMs);
    }
    
    console.log(`Compliance check interval updated to ${intervalMinutes} minutes.`);
  }
  
  /**
   * Main function to run compliance checks on content
   */
  private async runComplianceChecks() {
    try {
      if (!this.runningFlag) {
        return;
      }
      
      // Check blog posts
      await this.checkBlogPosts();
      
      // Check marketplace items
      await this.checkMarketplaceItems();
      
      console.log('Compliance check cycle completed');
    } catch (error) {
      console.error('Error in compliance check cycle:', error);
    }
  }
  
  /**
   * Checks blog posts for compliance
   */
  private async checkBlogPosts() {
    try {
      // Get blog posts that haven't been checked in the last 7 days
      // or have never been checked
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      const postsToCheck = await db
        .select({
          id: posts.id,
          title: posts.title,
          content: posts.content
        })
        .from(posts)
        .where(
          or(
            // Either never been checked
            sql`NOT EXISTS (
              SELECT 1 FROM content_compliance_scans 
              WHERE content_id = ${posts.id}::text AND content_type = 'blog'
            )`,
            // Or checked more than 7 days ago
            sql`EXISTS (
              SELECT 1 FROM content_compliance_scans 
              WHERE content_id = ${posts.id}::text AND content_type = 'blog'
              AND scan_started_at < ${lastWeek}
              ORDER BY scan_started_at DESC
              LIMIT 1
            )`
          )
        )
        .limit(5); // Check only 5 posts at a time to avoid overwhelming the system
      
      console.log(`Found ${postsToCheck.length} blog posts to check for compliance`);
      
      // Check each blog post
      for (const post of postsToCheck) {
        try {
          await complianceMonitor.checkCompliance(
            post.id.toString(),
            'blog',
            post.title,
            post.content || ''
          );
        } catch (error) {
          console.error(`Error checking blog post ${post.id} for compliance:`, error);
        }
      }
    } catch (error) {
      console.error('Error checking blog posts for compliance:', error);
    }
  }
  
  /**
   * Checks marketplace items for compliance
   */
  private async checkMarketplaceItems() {
    try {
      // Get marketplace items that haven't been checked in the last 7 days
      // or have never been checked
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      const itemsToCheck = await db
        .select({
          id: marketplaceItems.id,
          title: marketplaceItems.title,
          description: marketplaceItems.description
        })
        .from(marketplaceItems)
        .where(
          or(
            // Either never been checked
            sql`NOT EXISTS (
              SELECT 1 FROM content_compliance_scans 
              WHERE content_id = ${marketplaceItems.id}::text AND content_type = 'marketplace'
            )`,
            // Or checked more than 7 days ago
            sql`EXISTS (
              SELECT 1 FROM content_compliance_scans 
              WHERE content_id = ${marketplaceItems.id}::text AND content_type = 'marketplace'
              AND scan_started_at < ${lastWeek}
              ORDER BY scan_started_at DESC
              LIMIT 1
            )`
          )
        )
        .limit(5); // Check only 5 items at a time
      
      console.log(`Found ${itemsToCheck.length} marketplace items to check for compliance`);
      
      // Check each marketplace item
      for (const item of itemsToCheck) {
        try {
          await complianceMonitor.checkCompliance(
            item.id.toString(),
            'marketplace',
            item.title,
            item.description || ''
          );
        } catch (error) {
          console.error(`Error checking marketplace item ${item.id} for compliance:`, error);
        }
      }
    } catch (error) {
      console.error('Error checking marketplace items for compliance:', error);
    }
  }
}

export const complianceMonitoringProcess = new ComplianceMonitoringProcess();