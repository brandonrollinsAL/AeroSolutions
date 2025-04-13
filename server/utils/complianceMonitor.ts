import { grokApi } from '../grok';
import { db } from '../db';
import { contentComplianceAlerts, contentComplianceScans } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * Types of content that can be checked for compliance
 */
export enum ComplianceContentType {
  BLOG_POST = 'blog_post',
  MARKETPLACE_ITEM = 'marketplace_item',
  USER_PROFILE = 'user_profile',
  COMMENT = 'comment',
  FEEDBACK = 'feedback',
  MARKETING_COPY = 'marketing_copy',
  MOCKUP = 'mockup',
  WEBSITE_DESIGN = 'website_design',
  EMAIL_CAMPAIGN = 'email_campaign',
  SOCIAL_POST = 'social_post',
  AI_GENERATED_CONTENT = 'ai_generated_content'
}

/**
 * Compliance check categories
 */
export enum ComplianceCategory {
  US_LAW = 'us_law',
  GDPR = 'gdpr',
  GOOGLE_GUIDELINES = 'google_guidelines',
  CONTENT_POLICY = 'content_policy',
  ADVERTISING_STANDARDS = 'advertising_standards',
  ACCESSIBILITY = 'accessibility',
  PRIVACY = 'privacy',
  SECURITY = 'security',
  INTELLECTUAL_PROPERTY = 'intellectual_property',
  DATA_PROTECTION = 'data_protection'
}

/**
 * Severity levels for compliance issues
 */
export enum ComplianceSeverity {
  INFO = 'info',
  WARNING = 'warning',
  VIOLATION = 'violation',
  CRITICAL = 'critical'
}

/**
 * Interface for compliance check options
 */
interface ComplianceCheckOptions {
  contentId: string | number;
  contentType: ComplianceContentType;
  contentTitle?: string;
  content: string;
  metadata?: Record<string, any>;
  categories?: ComplianceCategory[];
}

/**
 * Interface for compliance check result
 */
export interface ComplianceCheckResult {
  passed: boolean;
  score: number; // 0-100
  issues: ComplianceIssue[];
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Interface for individual compliance issues
 */
export interface ComplianceIssue {
  category: ComplianceCategory;
  severity: ComplianceSeverity;
  description: string;
  suggestedAction: string;
  relatedRegulation?: string;
  location?: {
    startIndex?: number;
    endIndex?: number;
    excerpt?: string;
  };
}

/**
 * Main compliance monitoring utility class
 */
export class ComplianceMonitor {
  /**
   * Checks content for compliance with regulatory requirements
   * 
   * @param options Options for the compliance check
   * @returns Compliance check result
   */
  static async checkCompliance(options: ComplianceCheckOptions): Promise<ComplianceCheckResult> {
    try {
      const { contentId, contentType, contentTitle, content, metadata, categories } = options;
      
      // Define categories to check if not specified
      const complianceCategories = categories || [
        ComplianceCategory.US_LAW,
        ComplianceCategory.GDPR,
        ComplianceCategory.GOOGLE_GUIDELINES,
        ComplianceCategory.CONTENT_POLICY
      ];
      
      // Store scan record
      const [scanRecord] = await db.insert(contentComplianceScans).values({
        contentId: contentId.toString(),
        contentType,
        contentTitle: contentTitle || 'Untitled Content',
        scanStartedAt: new Date(),
        status: 'in_progress',
        categories: complianceCategories.join(',')
      }).returning();
      
      // Create a prompt for Grok to analyze compliance
      const prompt = `
        As a legal compliance expert, analyze the following content for compliance with ${complianceCategories.join(', ')} regulations. 
        Check for any potential violations, issues, or concerns related to:
        
        1. US Laws and regulations
        2. GDPR (General Data Protection Regulation) requirements
        3. Google business guidelines and policies
        4. Content policies for digital platforms
        5. Advertising standards and regulations
        6. Intellectual property rights
        7. Privacy regulations
        8. Security requirements
        9. Accessibility standards
        
        Content Type: ${contentType}
        ${contentTitle ? `Content Title: ${contentTitle}` : ''}
        ${metadata ? `Additional Context: ${JSON.stringify(metadata)}` : ''}
        
        Content to analyze:
        """
        ${content}
        """
        
        Provide a detailed analysis in JSON format with the following structure:
        {
          "passed": boolean,
          "score": number (0-100),
          "issues": [
            {
              "category": string (one of: us_law, gdpr, google_guidelines, content_policy, advertising_standards, accessibility, privacy, security, intellectual_property, data_protection),
              "severity": string (one of: info, warning, violation, critical),
              "description": string,
              "suggestedAction": string,
              "relatedRegulation": string,
              "location": {
                "excerpt": string
              }
            }
          ],
          "summary": string
        }
        
        If there are no issues, return an empty array for "issues". Be thorough but fair in your assessment.
      `;
      
      // Call Grok API for compliance analysis
      const result = await grokApi.generateJson<ComplianceCheckResult>(prompt);
      
      // Add timestamp
      const completedResult = {
        ...result,
        timestamp: new Date()
      };
      
      // Update scan record with results
      await db.update(contentComplianceScans)
        .set({
          status: 'completed',
          score: completedResult.score,
          passedCheck: completedResult.passed,
          scanCompletedAt: new Date(),
          issueCount: completedResult.issues.length
        })
        .where(eq(contentComplianceScans.id, scanRecord.id));
      
      // If there are violations, create alerts
      const violations = completedResult.issues.filter(
        issue => issue.severity === ComplianceSeverity.VIOLATION || 
                 issue.severity === ComplianceSeverity.CRITICAL
      );
      
      if (violations.length > 0) {
        // Insert alerts for violations
        await db.insert(contentComplianceAlerts).values(
          violations.map(issue => ({
            scanId: scanRecord.id,
            contentId: contentId.toString(),
            contentType,
            contentTitle: contentTitle || 'Untitled Content',
            category: issue.category,
            severity: issue.severity,
            description: issue.description,
            suggestedAction: issue.suggestedAction,
            relatedRegulation: issue.relatedRegulation || null,
            excerpt: issue.location?.excerpt || null,
            status: 'open',
            createdAt: new Date()
          }))
        );
      }
      
      return completedResult;
    } catch (error) {
      console.error('Error during compliance check:', error);
      
      // Return a default response in case of error
      return {
        passed: false,
        score: 0,
        issues: [{
          category: ComplianceCategory.CONTENT_POLICY,
          severity: ComplianceSeverity.WARNING,
          description: 'Unable to complete compliance check due to technical error',
          suggestedAction: 'Please review content manually or try again later',
        }],
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Gets recent compliance alerts
   * 
   * @param limit Maximum number of alerts to return
   * @returns Recent compliance alerts
   */
  static async getRecentAlerts(limit = 20) {
    return db.select()
      .from(contentComplianceAlerts)
      .orderBy(desc(contentComplianceAlerts.createdAt))
      .limit(limit);
  }
  
  /**
   * Gets alerts for a specific piece of content
   * 
   * @param contentId ID of the content
   * @param contentType Type of content
   * @returns Compliance alerts for the content
   */
  static async getContentAlerts(contentId: string | number, contentType: ComplianceContentType) {
    return db.select()
      .from(contentComplianceAlerts)
      .where(eq(contentComplianceAlerts.contentId, contentId.toString()))
      .where(eq(contentComplianceAlerts.contentType, contentType))
      .orderBy(desc(contentComplianceAlerts.createdAt));
  }
  
  /**
   * Updates an alert status
   * 
   * @param alertId ID of the alert
   * @param status New status (resolved, acknowledged, or false_positive)
   * @param resolution Optional resolution notes
   */
  static async updateAlertStatus(alertId: number, status: 'resolved' | 'acknowledged' | 'false_positive', resolution?: string) {
    return db.update(contentComplianceAlerts)
      .set({ 
        status, 
        resolvedAt: status === 'resolved' ? new Date() : null,
        resolutionNotes: resolution || null
      })
      .where(eq(contentComplianceAlerts.id, alertId));
  }
}