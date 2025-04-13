import { generateJson, generateText } from './xaiClient';
import { db } from '../db';
import { bug_reports, logs } from '@shared/schema';
import { eq, and, desc, gt } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { storage } from '../storage';

// Interfaces
interface BugAnalysisResult {
  isBug: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestedFix: string;
  affectedComponent: string;
  canAutoFix: boolean;
  autoFixCode?: string;
}

interface UserFeedbackAnalysis {
  isBugReport: boolean;
  sentiment: 'negative' | 'neutral' | 'positive';
  priority: 'low' | 'medium' | 'high';
  category: string;
  description: string;
  suggestedAction: string;
}

interface LogEntry {
  id: number;
  timestamp: Date;
  level: string;
  message: string;
  context: any;
  source: string;
}

/**
 * Analyzes error logs using XAI to detect bugs
 */
export async function analyzeErrorLogs(
  timeframe: 'last_hour' | 'last_day' | 'last_week' = 'last_hour'
): Promise<BugAnalysisResult[]> {
  try {
    // Get the timestamp for the timeframe
    const startTime = new Date();
    switch (timeframe) {
      case 'last_hour':
        startTime.setHours(startTime.getHours() - 1);
        break;
      case 'last_day':
        startTime.setDate(startTime.getDate() - 1);
        break;
      case 'last_week':
        startTime.setDate(startTime.getDate() - 7);
        break;
    }

    // Fetch error logs from the database
    const recentLogs = await db
      .select()
      .from(logs)
      .where(
        and(
          eq(logs.level, 'error'),
          gt(logs.timestamp, startTime)
        )
      )
      .orderBy(desc(logs.timestamp))
      .limit(50);

    if (recentLogs.length === 0) {
      return [];
    }

    // Transform logs for analysis
    const logsForAnalysis = recentLogs.map(log => ({
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      message: log.message,
      context: log.context ? JSON.stringify(log.context) : '',
      source: log.source || 'unknown'
    }));

    // Group logs by common patterns
    const groupedLogs = groupLogsByPatterns(logsForAnalysis);
    
    // For each group, analyze with XAI
    const bugAnalysisPromises = Object.entries(groupedLogs).map(
      async ([pattern, logs]) => {
        // Only analyze groups with more than one occurrence to focus on patterns
        if (logs.length < 2) return null;
        
        return await analyzeBugPattern(pattern, logs);
      }
    );

    const bugAnalysisResults = await Promise.all(bugAnalysisPromises);
    return bugAnalysisResults.filter((result): result is BugAnalysisResult => result !== null);
  } catch (error) {
    console.error('Error analyzing error logs:', error);
    return [];
  }
}

/**
 * Groups logs by common patterns to identify recurring issues
 */
function groupLogsByPatterns(logs: LogEntry[]): Record<string, LogEntry[]> {
  const patterns: Record<string, LogEntry[]> = {};
  
  for (const log of logs) {
    // Remove specific identifiers like IDs, timestamps from the message to find patterns
    const normalizedMessage = log.message
      .replace(/\b[0-9a-f]{8,}\b/g, '[ID]') // Replace UUIDs/IDs
      .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, '[TIMESTAMP]') // Replace ISO timestamps
      .replace(/\b\d+\b/g, '[NUMBER]') // Replace numbers
      .replace(/(['"])(?:(?=(\\?))\2.)*?\1/g, '[STRING]'); // Replace string literals
      
    // Use the normalized message as the pattern key
    if (!patterns[normalizedMessage]) {
      patterns[normalizedMessage] = [];
    }
    
    patterns[normalizedMessage].push(log);
  }
  
  return patterns;
}

/**
 * Analyzes a group of similar logs to detect bugs
 */
async function analyzeBugPattern(
  pattern: string,
  logs: LogEntry[]
): Promise<BugAnalysisResult | null> {
  try {
    const systemPrompt = `You are an expert software debugging AI. Your task is to analyze error logs and identify bugs.
    Analyze the pattern and suggest a fix. Be precise in your diagnosis and recommendations.
    For the canAutoFix field, only return true if the fix is simple, isolated, and has no side effects.
    If canAutoFix is true, provide specific code in the autoFixCode field that could be applied to fix the issue automatically.`;

    const prompt = `
    I need you to analyze this group of ${logs.length} similar error logs to identify if they represent a bug.
    
    Error pattern: ${pattern}
    
    Sample log entries (${Math.min(logs.length, 5)} out of ${logs.length}):
    ${logs.slice(0, 5).map(log => 
      `ID: ${log.id}
      Timestamp: ${log.timestamp}
      Source: ${log.source}
      Message: ${log.message}
      Context: ${log.context || 'N/A'}`
    ).join('\n\n')}
    
    Based on these logs, determine:
    1. Is this a bug or expected behavior?
    2. How severe is this issue (low, medium, high, critical)?
    3. What's happening and what component is affected?
    4. Can this be automatically fixed with a simple code change?
    5. If auto-fixable, provide the exact code change needed
    
    Return your analysis as a JSON object with the following structure:
    {
      "isBug": boolean,
      "severity": "low" | "medium" | "high" | "critical",
      "description": "Clear description of the issue",
      "suggestedFix": "How to fix this issue",
      "affectedComponent": "The component or area affected",
      "canAutoFix": boolean,
      "autoFixCode": "Code that could be applied to fix the issue" (only if canAutoFix is true)
    }`;

    const analysis = await generateJson<BugAnalysisResult>(prompt, {
      systemPrompt,
      model: 'grok-3',
      temperature: 0.2,
      maxTokens: 1500
    });

    // If the analysis confirms it's a bug, store the report
    if (analysis.isBug) {
      await storeBugReport({
        source: 'automated-log-analysis',
        title: `Auto-detected: ${analysis.description.substring(0, 100)}`,
        description: analysis.description,
        severity: analysis.severity,
        status: 'open',
        affectedComponent: analysis.affectedComponent,
        suggestedFix: analysis.suggestedFix,
        canAutoFix: analysis.canAutoFix,
        autoFixCode: analysis.autoFixCode || null,
        logIds: logs.map(log => log.id),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // If it's auto-fixable and not critical (to be safe), apply the fix
      if (analysis.canAutoFix && analysis.severity !== 'critical') {
        await attemptAutoFix(analysis);
      }
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing bug pattern:', error);
    return null;
  }
}

/**
 * Analyzes user feedback to detect potential bugs
 */
export async function analyzeUserFeedback(): Promise<UserFeedbackAnalysis[]> {
  try {
    // Get recent user feedback from the analytics endpoint data
    const feedback = await storage.getRecentFeedback();
    
    if (!feedback || feedback.length === 0) {
      return [];
    }
    
    const feedbackAnalysisPromises = feedback.map(
      async (item) => {
        return await analyzeFeedbackItem(item);
      }
    );

    const analysisResults = await Promise.all(feedbackAnalysisPromises);
    return analysisResults.filter((result): result is UserFeedbackAnalysis => {
      return result !== null && result.isBugReport;
    });
  } catch (error) {
    console.error('Error analyzing user feedback:', error);
    return [];
  }
}

/**
 * Analyzes a single feedback item to determine if it's reporting a bug
 */
async function analyzeFeedbackItem(
  feedbackItem: any
): Promise<UserFeedbackAnalysis | null> {
  try {
    const systemPrompt = `You are an AI specialized in analyzing user feedback for software products.
    Your task is to determine if user feedback is reporting a bug or issue versus general feedback or feature requests.
    If it appears to be a bug report, extract relevant details that would help developers fix the issue.`;

    const prompt = `
    Please analyze this user feedback to determine if it's reporting a bug or issue:
    
    User ID: ${feedbackItem.userId || 'Anonymous'}
    Feedback Context: ${feedbackItem.context || 'General feedback'}
    Feedback Text: "${feedbackItem.message}"
    Submitted: ${feedbackItem.createdAt}
    
    Analyze this feedback and determine:
    1. Is this reporting a bug or technical issue? 
    2. What is the sentiment of this feedback?
    3. If it's a bug report, what priority should it have?
    4. What category does this feedback fall into?
    5. What specific issue is being described?
    6. What action should be taken in response?
    
    Return your analysis as a JSON object with this structure:
    {
      "isBugReport": boolean,
      "sentiment": "negative" | "neutral" | "positive",
      "priority": "low" | "medium" | "high",
      "category": "string describing category",
      "description": "concise description of the issue",
      "suggestedAction": "recommended action to take"
    }`;

    const analysis = await generateJson<UserFeedbackAnalysis>(prompt, {
      systemPrompt,
      model: 'grok-3-mini',
      temperature: 0.3
    });

    // If it's a bug report, store it
    if (analysis.isBugReport) {
      await storeBugReport({
        source: 'user-feedback',
        title: `User Reported: ${analysis.description.substring(0, 100)}`,
        description: analysis.description,
        severity: analysis.priority === 'high' ? 'high' : 
                 analysis.priority === 'medium' ? 'medium' : 'low',
        status: 'open',
        affectedComponent: analysis.category,
        suggestedFix: analysis.suggestedAction,
        canAutoFix: false,
        autoFixCode: null,
        feedbackId: feedbackItem.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing feedback item:', error);
    return null;
  }
}

/**
 * Attempts to automatically apply a fix for a bug
 */
async function attemptAutoFix(bugAnalysis: BugAnalysisResult): Promise<boolean> {
  try {
    if (!bugAnalysis.canAutoFix || !bugAnalysis.autoFixCode) {
      return false;
    }

    // Log the auto-fix attempt
    console.log(`Attempting to auto-fix bug: ${bugAnalysis.description}`);
    console.log(`Affected component: ${bugAnalysis.affectedComponent}`);
    
    // In a production system, we would have more sophisticated code to:
    // 1. Identify the file(s) that need to be modified
    // 2. Parse the bugAnalysis.autoFixCode to extract the changes
    // 3. Apply those changes with appropriate backups
    // 4. Run tests to verify the fix
    // 5. Revert if tests fail
    
    // For this implementation, we'll just log the suggested fix
    // and update the bug report to indicate the auto-fix was attempted
    
    // Update the bug report to show an auto-fix was attempted
    await db
      .update(bug_reports)
      .set({
        status: 'fix-attempted',
        updatedAt: new Date(),
        fixAttemptedAt: new Date(),
      })
      .where(
        and(
          eq(bug_reports.description, bugAnalysis.description),
          eq(bug_reports.status, 'open')
        )
      );
    
    // In a real implementation, apply the fix here
    // This would involve file manipulation based on the autoFixCode
    
    return true;
  } catch (error) {
    console.error('Error attempting auto fix:', error);
    return false;
  }
}

/**
 * Stores a bug report in the database
 */
async function storeBugReport(bugReport: any): Promise<void> {
  try {
    await db.insert(bug_reports).values(bugReport);
    console.log(`Bug report stored: ${bugReport.title}`);
  } catch (error) {
    console.error('Error storing bug report:', error);
  }
}

/**
 * Generates a summary report of recent bugs and fixes
 */
export async function generateBugSummaryReport(): Promise<string> {
  try {
    // Get recent bug reports
    const recentBugs = await db
      .select()
      .from(bug_reports)
      .orderBy(desc(bug_reports.createdAt))
      .limit(20);
    
    if (recentBugs.length === 0) {
      return "No bugs detected in the monitored period.";
    }
    
    const systemPrompt = `You are an AI assistant specialized in creating concise engineering reports.
    Summarize the bug information into a well-structured report for a development team.
    Be professional, clear, and actionable in your summary.`;

    const bugData = recentBugs.map(bug => ({
      title: bug.title,
      description: bug.description,
      severity: bug.severity,
      component: bug.affectedComponent,
      status: bug.status,
      suggestedFix: bug.suggestedFix,
      autoFixable: bug.canAutoFix,
      createdAt: bug.createdAt.toISOString()
    }));

    const prompt = `
    Generate a comprehensive bug summary report based on these ${recentBugs.length} recently detected issues:
    
    ${JSON.stringify(bugData, null, 2)}
    
    Please include:
    1. An executive summary of the bug situation
    2. Categorization of bugs by severity and affected components
    3. Key patterns or trends observed
    4. The most critical bugs that need immediate attention
    5. Bugs that were automatically fixed or could be fixed automatically
    6. Recommendations for the development team
    
    Format this as a professional report with clear sections and actionable insights.`;

    const report = await generateText(prompt, {
      systemPrompt,
      model: 'grok-3',
      temperature: 0.4,
      maxTokens: 2000
    });
    
    // Save the report to a file
    const reportDir = path.join(__dirname, '../../reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const filename = `bug-report-${new Date().toISOString().split('T')[0]}.md`;
    fs.writeFileSync(path.join(reportDir, filename), report);
    
    return report;
  } catch (error) {
    console.error('Error generating bug summary report:', error);
    return 'Error generating bug report. Please check the logs.';
  }
}

// Export methods for scheduling
export default {
  analyzeErrorLogs,
  analyzeUserFeedback,
  generateBugSummaryReport
};