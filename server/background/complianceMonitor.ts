import { db } from '../db';
import { ComplianceMonitor, ComplianceContentType } from '../utils/complianceMonitor';
import { posts, marketplaceItems } from '@shared/schema';
import { eq, lt, and } from 'drizzle-orm';
import NodeCache from 'node-cache';

// Cache to track recently checked content to avoid duplicate processing
const checkedContentCache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

/**
 * Background process to monitor content for compliance
 * Runs periodically to check content against regulatory requirements
 */
export class ComplianceMonitoringProcess {
  private runningFlag: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private intervalMs: number = 15 * 60 * 1000; // 15 minutes by default
  
  /**
   * Starts the compliance monitoring background process
   * @param intervalMinutes Optional interval in minutes between checks
   */
  start(intervalMinutes: number = 15) {
    if (this.runningFlag) {
      console.log('Compliance monitoring process already running');
      return;
    }
    
    this.intervalMs = intervalMinutes * 60 * 1000;
    console.log(`Starting compliance monitoring process to run every ${intervalMinutes} minutes`);
    
    // Run immediately on start
    this.runComplianceChecks();
    
    // Set up interval for future runs
    this.checkInterval = setInterval(() => {
      this.runComplianceChecks();
    }, this.intervalMs);
    
    this.runningFlag = true;
  }
  
  /**
   * Stops the compliance monitoring background process
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      this.runningFlag = false;
      console.log('Compliance monitoring process stopped');
    }
  }
  
  /**
   * Updates the interval between compliance checks
   * @param intervalMinutes New interval in minutes between checks
   */
  updateInterval(intervalMinutes: number) {
    if (intervalMinutes < 1) {
      console.warn('Interval too short, using 1 minute minimum');
      intervalMinutes = 1;
    }
    
    this.stop();
    this.start(intervalMinutes);
  }
  
  /**
   * Main function to run compliance checks on content
   */
  private async runComplianceChecks() {
    try {
      console.log('Running compliance checks...');
      
      // Process blog posts
      await this.checkBlogPosts();
      
      // Process marketplace items
      await this.checkMarketplaceItems();
      
      // Additional content types can be added here
      
      console.log('Compliance check cycle completed');
    } catch (error) {
      console.error('Error during compliance check cycle:', error);
    }
  }
  
  /**
   * Checks blog posts for compliance
   */
  private async checkBlogPosts() {
    try {
      // Get published blog posts ordered by newest first
      const blogPosts = await db.select()
        .from(posts)
        .where(eq(posts.status, 'published'))
        .orderBy(posts.createdAt);
      
      console.log(`Found ${blogPosts.length} blog posts to check for compliance`);
      
      for (const post of blogPosts) {
        const cacheKey = `blog_post_${post.id}`;
        
        // Skip if recently checked
        if (checkedContentCache.has(cacheKey)) {
          continue;
        }
        
        // Check content for compliance
        console.log(`Checking blog post "${post.title}" (ID: ${post.id}) for compliance`);
        
        await ComplianceMonitor.checkCompliance({
          contentId: post.id,
          contentType: ComplianceContentType.BLOG_POST,
          contentTitle: post.title,
          content: post.content,
          metadata: {
            author: post.authorId,
            category: post.category,
            tags: post.tags,
          }
        });
        
        // Cache this post as checked
        checkedContentCache.set(cacheKey, true);
        
        // Add a small delay to avoid overwhelming the AI service
        await new Promise(resolve => setTimeout(resolve, 1000));
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
      // Get available marketplace items
      const items = await db.select()
        .from(marketplaceItems)
        .where(eq(marketplaceItems.isAvailable, true))
        .orderBy(marketplaceItems.createdAt);
      
      console.log(`Found ${items.length} marketplace items to check for compliance`);
      
      for (const item of items) {
        const cacheKey = `marketplace_item_${item.id}`;
        
        // Skip if recently checked
        if (checkedContentCache.has(cacheKey)) {
          continue;
        }
        
        // Check content for compliance
        console.log(`Checking marketplace item "${item.name}" (ID: ${item.id}) for compliance`);
        
        await ComplianceMonitor.checkCompliance({
          contentId: item.id,
          contentType: ComplianceContentType.MARKETPLACE_ITEM,
          contentTitle: item.name,
          content: item.description,
          metadata: {
            seller: item.sellerId,
            category: item.category,
            tags: item.tags,
            price: item.price
          }
        });
        
        // Cache this item as checked
        checkedContentCache.set(cacheKey, true);
        
        // Add a small delay to avoid overwhelming the AI service
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('Error checking marketplace items for compliance:', error);
    }
  }
}

// Create a singleton instance
export const complianceMonitoringProcess = new ComplianceMonitoringProcess();