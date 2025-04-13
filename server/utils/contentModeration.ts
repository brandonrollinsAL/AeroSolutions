import { db } from '../db';
import { callXAI, generateJson } from './xaiClient';
import { Request, Response, NextFunction } from 'express';
import { insertContentComplianceAlertSchema } from '@shared/schema';
import { contentComplianceAlerts, contentComplianceScans } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface ModerationResult {
  isAllowed: boolean;
  score: number;
  category: string | null;
  reason: string | null;
}

/**
 * Content moderation service using XAI to analyze user-generated content
 * Monitors for illegal content, hate speech, or other policy violations
 */
export class ContentModerationService {
  /**
   * Analyzes a piece of content to determine if it violates policies
   * 
   * @param content The text content to moderate
   * @param contentType The type of content (e.g., 'comment', 'listing', 'post')
   * @returns Moderation result indicating if content is allowed
   */
  async analyzeContent(content: string, contentType: string): Promise<ModerationResult> {
    try {
      // Truncate long content to comply with token limits
      const truncatedContent = content.slice(0, 12000);
      
      // Use XAI to analyze the content
      const prompt = `
You are a content moderation AI trained to detect harmful, illegal, or policy-violating content.

Analyze the following ${contentType} for violations of US laws or platform policies, including:
- Hate speech or discrimination based on protected characteristics
- Threats of violence or harm
- Illegal activity solicitation (drugs, weapons, human trafficking, etc.)
- Child exploitation or endangerment
- Explicit pornographic content
- Significant copyright infringement
- Personal information sharing (doxxing)
- Extreme harassment or bullying
- Terrorist content or violent extremism promotion

CONTENT TO ANALYZE:
'''
${truncatedContent}
'''

Based on an objective analysis, determine if this content should be blocked or allowed.
Return a JSON response with the following structure:
{
  "isAllowed": boolean, // false if the content violates policies, true if it's acceptable
  "score": number, // 0-100 severity score, higher means more concerning
  "category": string | null, // If not allowed, the category of violation (hate_speech, illegal_activity, violence, etc.)
  "reason": string | null // Brief explanation of why content was rejected, or null if allowed
}

Only flag content that clearly violates policies. Be careful not to over-moderate legitimate content.
`;

      // Use more capable Grok-3 model for accurate content moderation
      const result = await generateJson(prompt, 'grok-3');
      
      // Ensure result has the expected structure
      const validatedResult: ModerationResult = {
        isAllowed: result.isAllowed ?? true,
        score: result.score ?? 0,
        category: result.category || null,
        reason: result.reason || null
      };
      
      return validatedResult;
    } catch (error) {
      console.error('Error in content moderation analysis:', error);
      
      // Default to allowing content if the moderation system fails
      // This prevents accidental censorship while logging the error
      return {
        isAllowed: true,
        score: 0,
        category: null,
        reason: null
      };
    }
  }
  
  /**
   * Records a moderation violation in the database for admin review
   */
  async recordViolation(
    contentId: string,
    contentType: string,
    contentTitle: string,
    violationCategory: string,
    violationReason: string,
    excerpt: string
  ): Promise<void> {
    try {
      // Create a scan record first
      const [scanRecord] = await db
        .insert(contentComplianceScans)
        .values({
          contentId,
          contentType,
          contentTitle,
          scanStartedAt: new Date(),
          scanCompletedAt: new Date(),
          status: 'completed',
          passedCheck: false,
          score: 0,
          issueCount: 1,
          categories: 'content_moderation'
        })
        .returning();
      
      if (!scanRecord) {
        throw new Error('Failed to create moderation scan record');
      }
      
      // Create an alert for the violation
      await db.insert(contentComplianceAlerts)
        .values({
          scanId: scanRecord.id,
          contentId,
          contentType,
          contentTitle,
          category: 'content_policy',
          severity: 'violation',
          description: `Content moderation violation: ${violationCategory}`,
          suggestedAction: 'Review and take appropriate action on flagged content',
          relatedRegulation: null,
          excerpt: excerpt,
          status: 'open'
        });
        
      console.log(`Content moderation violation recorded: ${violationCategory} in ${contentType} ${contentId}`);
    } catch (error) {
      console.error('Error recording content moderation violation:', error);
    }
  }
}

export const contentModerationService = new ContentModerationService();

/**
 * Middleware to moderate content for API routes
 * 
 * @param contentField The field in the request body containing the content to moderate
 * @param contentTypeField The field specifying the content type (optional)
 * @param titleField The field containing the content title (optional)
 * @param idField The field containing the content ID (optional)
 */
export const moderateContent = (
  contentField: string,
  contentTypeField: string = 'type',
  titleField: string = 'title',
  idField: string = 'id'
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip moderation if no content provided
      if (!req.body || !req.body[contentField]) {
        return next();
      }
      
      const content = req.body[contentField];
      const contentType = req.body[contentTypeField] || 'content';
      const contentTitle = req.body[titleField] || 'Untitled Content';
      const contentId = req.body[idField]?.toString() || `temp-${Date.now()}`;
      
      console.log(`Moderating ${contentType}: "${contentTitle.substring(0, 30)}${contentTitle.length > 30 ? '...' : ''}"`);
      
      // Perform content moderation
      const moderationResult = await contentModerationService.analyzeContent(content, contentType);
      
      // Allow the content if it passes moderation
      if (moderationResult.isAllowed) {
        console.log(`Content passed moderation: ${contentType} "${contentTitle.substring(0, 30)}${contentTitle.length > 30 ? '...' : ''}"`);
        return next();
      }
      
      // Record the violation for admin review
      await contentModerationService.recordViolation(
        contentId,
        contentType,
        contentTitle,
        moderationResult.category || 'policy_violation',
        moderationResult.reason || 'Content violates platform policies',
        content.substring(0, 500) // Store excerpt of violating content
      );
      
      // Reject the content submission
      return res.status(403).json({
        success: false,
        message: 'Content violates platform policies and cannot be published',
        reason: moderationResult.reason || 'The submitted content violates our community guidelines'
      });
    } catch (error) {
      console.error('Error in content moderation middleware:', error);
      // Continue to next middleware if moderation fails
      // This prevents the moderation system from blocking legitimate content
      return next();
    }
  };
};