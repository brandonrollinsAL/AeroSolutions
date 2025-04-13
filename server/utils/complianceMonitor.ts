import { db } from '../db';
import { callXAI, generateJson } from './xaiClient';
import { 
  contentComplianceScans, 
  contentComplianceAlerts,
  InsertContentComplianceScan,
  InsertContentComplianceAlert
} from '@shared/schema';
import { eq } from 'drizzle-orm';

interface ComplianceCheckResult {
  passedCheck: boolean;
  score: number;
  summary: string;
  issues: ComplianceIssue[];
  scanId: number;
}

interface ComplianceIssue {
  category: string;
  severity: string;
  description: string;
  suggestedAction: string;
  relatedRegulation: string | null;
  excerpt: string | null;
}

/**
 * Utility class for compliance monitoring and checking content against regulatory requirements
 */
class ComplianceMonitor {
  /**
   * Check content for compliance with US laws, GDPR, Google guidelines
   * @param contentId Unique identifier for the content
   * @param contentType Type of content (blog, product, etc.)
   * @param contentTitle Title of the content
   * @param content The content text to check
   * @returns Check result with issues found
   */
  async checkCompliance(
    contentId: string,
    contentType: string,
    contentTitle: string,
    content: string
  ): Promise<ComplianceCheckResult> {
    try {
      console.log(`Checking ${contentType} "${contentTitle}" (ID: ${contentId}) for compliance`);
      
      // Create a scan record
      const [scanRecord] = await db
        .insert(contentComplianceScans)
        .values({
          contentId,
          contentType,
          contentTitle,
          scanStartedAt: new Date(),
          status: 'running',
          categories: 'us_law,gdpr,google_guidelines'
        })
        .returning();

      if (!scanRecord) {
        throw new Error('Failed to create compliance scan record');
      }

      // We're using the more capable grok-3 model for compliance 
      // checking rather than grok-3-mini since it has better regulatory knowledge
      const result = await this.performComplianceCheck(contentId, contentType, contentTitle, content);
      
      // Update scan record
      await db
        .update(contentComplianceScans)
        .set({
          scanCompletedAt: new Date(),
          status: 'completed',
          passedCheck: result.passedCheck,
          score: result.score,
          issueCount: result.issues.length
        })
        .where(eq(contentComplianceScans.id, scanRecord.id));

      // Create compliance alerts for each issue
      if (result.issues.length > 0) {
        console.log(`Found ${result.issues.length} compliance issues in ${contentType} "${contentTitle}"`);
        
        await Promise.all(
          result.issues.map(issue => 
            db.insert(contentComplianceAlerts)
              .values({
                scanId: scanRecord.id,
                contentId,
                contentType,
                contentTitle,
                category: issue.category,
                severity: issue.severity,
                description: issue.description,
                suggestedAction: issue.suggestedAction,
                relatedRegulation: issue.relatedRegulation,
                excerpt: issue.excerpt,
                status: 'open'
              })
          )
        );
      } else {
        console.log(`No compliance issues found in ${contentType} "${contentTitle}"`);
      }

      return {
        ...result,
        scanId: scanRecord.id
      };
    } catch (error) {
      console.error('Error during compliance check:', error);
      throw error;
    }
  }

  /**
   * Perform the actual compliance check using XAI
   * This is the core function that evaluates content against regulations
   */
  private async performComplianceCheck(
    contentId: string,
    contentType: string,
    contentTitle: string,
    content: string
  ): Promise<Omit<ComplianceCheckResult, 'scanId'>> {
    try {
      const truncatedContent = content.slice(0, 15000); // Limit content length to avoid token limits
      
      const prompt = `
You are a legal compliance expert specializing in digital content regulations. 
Analyze the following ${contentType} content for compliance with:
- US laws (including FTC regulations, CAN-SPAM, and intellectual property laws)
- GDPR regulations (if relevant)
- Google business guidelines

Content Title: ${contentTitle}
Content ID: ${contentId}
Content Type: ${contentType}

CONTENT TO ANALYZE:
'''
${truncatedContent}
'''

Perform a thorough analysis and identify ANY potential compliance issues, policy violations, or legal risks.

Return a JSON response with the following structure:
{
  "passedCheck": boolean, // true if no issues found, false if issues exist
  "score": number, // 0-100 compliance score
  "summary": string, // Brief summary of findings
  "issues": [ // Array of compliance issues, empty if no issues found
    {
      "category": string, // one of: "us_law", "gdpr", "google_guidelines", "content_policy", "advertising_standards", "privacy", "security", "intellectual_property", "data_protection", "accessibility"
      "severity": string, // one of: "critical", "violation", "warning", "info"
      "description": string, // Clear description of the issue
      "suggestedAction": string, // How to fix the issue
      "relatedRegulation": string | null, // Specific regulation or law reference if applicable
      "excerpt": string | null // The problematic content excerpt if applicable
    }
  ]
}

Be thorough but avoid false positives. Only flag genuine compliance issues.
`;

      const result = await generateJson(prompt, 'grok-3');
      
      // Ensure result has expected structure and defaults
      const validatedResult = {
        passedCheck: result.passedCheck ?? true,
        score: result.score ?? 100,
        summary: result.summary ?? 'No compliance issues detected.',
        issues: Array.isArray(result.issues) ? result.issues : []
      };
      
      // Post-process issues to validate properties
      const processedIssues = validatedResult.issues.map(issue => ({
        category: this.validateCategory(issue.category || 'content_policy'),
        severity: this.validateSeverity(issue.severity || 'info'),
        description: issue.description || 'Unspecified compliance issue.',
        suggestedAction: issue.suggestedAction || 'Review content for compliance.',
        relatedRegulation: issue.relatedRegulation || null,
        excerpt: issue.excerpt || null
      }));
      
      return {
        passedCheck: processedIssues.length === 0,
        score: processedIssues.length === 0 ? 100 : Math.max(0, 100 - (processedIssues.length * 10)),
        summary: validatedResult.summary,
        issues: processedIssues
      };
    } catch (error) {
      console.error('Error in performComplianceCheck:', error);
      
      // Return safe default in case of error
      return {
        passedCheck: false,
        score: 0,
        summary: 'Error performing compliance check.',
        issues: [{
          category: 'system',
          severity: 'info',
          description: 'Unable to complete compliance check due to a system error.',
          suggestedAction: 'Please try again later or contact support.',
          relatedRegulation: null,
          excerpt: null
        }]
      };
    }
  }
  
  /**
   * Validate and normalize category values
   */
  private validateCategory(category: string): string {
    const validCategories = [
      'us_law', 
      'gdpr', 
      'google_guidelines', 
      'content_policy', 
      'advertising_standards', 
      'privacy', 
      'security', 
      'intellectual_property', 
      'data_protection', 
      'accessibility'
    ];
    
    const normalizedCategory = category.toLowerCase().replace(/[^a-z_]/g, '_');
    
    if (validCategories.includes(normalizedCategory)) {
      return normalizedCategory;
    }
    
    return 'content_policy'; // Default category
  }
  
  /**
   * Validate and normalize severity values
   */
  private validateSeverity(severity: string): string {
    const validSeverities = ['critical', 'violation', 'warning', 'info'];
    
    const normalizedSeverity = severity.toLowerCase().replace(/[^a-z]/g, '');
    
    if (validSeverities.includes(normalizedSeverity)) {
      return normalizedSeverity;
    }
    
    return 'info'; // Default severity
  }
}

export const complianceMonitor = new ComplianceMonitor();