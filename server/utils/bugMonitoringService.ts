import { storage } from '../storage';
import { callXAI, generateJson, generateText } from './xaiClient';
import fs from 'fs';
import path from 'path';
import { Logger } from '../middlewares/logger';

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
  timeframe: 'last_hour' | 'last_day' | 'last_week' = 'last_day'
): Promise<BugAnalysisResult[]> {
  try {
    // Get logs from the specified timeframe
    const recentLogs = await storage.getRecentLogs('error', 100);
    
    if (recentLogs.length === 0) {
      console.log('No error logs found for analysis');
      return [];
    }
    
    // Group logs by patterns
    const logGroups = groupLogsByPatterns(recentLogs);
    
    // Analyze each log group for potential bugs
    const analysisPromises = Object.values(logGroups).map(logGroup => 
      analyzeBugPattern(logGroup)
    );
    
    // Wait for all analyses to complete
    const analysisResults = await Promise.all(analysisPromises);
    
    // Filter out null results and logs that aren't bugs
    const bugAnalyses = analysisResults
      .filter(result => result && result.isBug)
      .filter(Boolean) as BugAnalysisResult[];
    
    // Log the results
    console.log(`Bug analysis completed. Found ${bugAnalyses.length} potential bugs.`);
    
    // Store bug reports in the database
    await Promise.all(
      bugAnalyses.map(async (bugReport) => {
        await storage.createBugReport({
          source: 'log_analysis',
          status: 'open',
          description: bugReport.description,
          title: `[Auto-Detected] ${bugReport.affectedComponent} Issue`,
          severity: bugReport.severity,
          affectedComponent: bugReport.affectedComponent,
          suggestedFix: bugReport.suggestedFix,
          canAutoFix: bugReport.canAutoFix,
          autoFixCode: bugReport.autoFixCode,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      })
    );
    
    return bugAnalyses;
  } catch (error) {
    console.error('Error analyzing error logs:', error);
    return [];
  }
}

/**
 * Groups logs by common patterns to identify recurring issues
 */
function groupLogsByPatterns(logs: LogEntry[]): Record<string, LogEntry[]> {
  const errorPatterns: Record<string, LogEntry[]> = {};
  
  for (const log of logs) {
    // Strip out variable parts like timestamps, IDs, etc. to find the pattern
    const patternKey = extractErrorPattern(log.message);
    
    if (!errorPatterns[patternKey]) {
      errorPatterns[patternKey] = [];
    }
    
    errorPatterns[patternKey].push(log);
  }
  
  // Only keep patterns with multiple occurrences (likely to be actual bugs)
  return Object.fromEntries(
    Object.entries(errorPatterns)
      .filter(([_, logs]) => logs.length > 1)
  );
}

/**
 * Creates a normalized pattern from an error message
 */
function extractErrorPattern(message: string): string {
  // Replace specific values like IDs, dates, etc. with placeholders
  return message
    .replace(/\d+/g, '<NUM>') // Replace numbers
    .replace(/(['"])(?:(?=(\\?))\2.)*?\1/g, '<STR>') // Replace quoted strings
    .replace(/\/[\w\/\.-]+/g, '<PATH>') // Replace file paths
    .replace(/\w+@[\w\.-]+/g, '<EMAIL>') // Replace emails
    .trim();
}

/**
 * Analyzes a group of similar logs to detect bugs
 */
async function analyzeBugPattern(
  logs: LogEntry[]
): Promise<BugAnalysisResult | null> {
  try {
    // Select a sample of logs to analyze (to keep the prompt size reasonable)
    const logSample = logs.slice(0, 5);
    
    // Format logs for analysis prompt
    const logText = logSample.map(log => 
      `[${new Date(log.timestamp).toISOString()}] ${log.level.toUpperCase()}: ${log.message}\nContext: ${JSON.stringify(log.context)}\nSource: ${log.source}`
    ).join('\n\n');
    
    // Create the analysis prompt for XAI
    const prompt = `
    Analyze the following error logs and determine if they represent a bug in the system:
    
    ${logText}
    
    There are ${logs.length} total occurrences of this error pattern.
    
    Please analyze these logs and determine:
    1. Is this a bug in the system that needs to be fixed?
    2. What is the severity level (low, medium, high, critical)?
    3. What component is affected?
    4. What might be causing this issue?
    5. How would you suggest fixing it?
    6. Could this be automatically fixed with code changes? If so, provide a code snippet that could fix it.
    
    Respond in JSON format with the following structure:
    {
      "isBug": true/false,
      "severity": "low"/"medium"/"high"/"critical",
      "description": "Description of the issue",
      "affectedComponent": "The affected component or module",
      "suggestedFix": "How to fix the issue",
      "canAutoFix": true/false,
      "autoFixCode": "Code snippet that could automatically fix the issue (if applicable)"
    }
    
    If this is not a bug (e.g., it's an expected error, user error, or external system issue), set isBug to false.
    `;
    
    // Execute XAI analysis
    const result = await generateJson(prompt, {
      model: 'grok-3-mini',
      systemPrompt: "You are an expert software engineer with deep experience debugging complex systems. Your task is to analyze error logs to identify bugs, determine their severity, and suggest fixes. Be precise, concise, and practical.",
      temperature: 0.2,
      maxTokens: 1000
    });
    
    // Return the parsed analysis
    return result as BugAnalysisResult;
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
    // Get recent user feedback
    const recentFeedback = await storage.getRecentFeedback(20);
    
    if (recentFeedback.length === 0) {
      console.log('No user feedback found for analysis');
      return [];
    }
    
    // Analyze each feedback item
    const analysisPromises = recentFeedback.map(item => 
      analyzeFeedbackItem(item)
    );
    
    // Wait for all analyses to complete
    const analyses = await Promise.all(analysisPromises);
    
    // Filter out null results
    const validAnalyses = analyses.filter(Boolean) as UserFeedbackAnalysis[];
    
    // Store bug reports from feedback
    await Promise.all(
      validAnalyses
        .filter(analysis => analysis.isBugReport)
        .map(async (analysis) => {
          await storage.createBugReport({
            source: 'user_feedback',
            status: 'open',
            description: analysis.description,
            title: `[User Reported] ${analysis.category} Issue`,
            severity: mapPriorityToSeverity(analysis.priority),
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        })
    );
    
    return validAnalyses;
  } catch (error) {
    console.error('Error analyzing user feedback:', error);
    return [];
  }
}

/**
 * Analyzes a single feedback item to determine if it's reporting a bug
 */
async function analyzeFeedbackItem(
  item: any
): Promise<UserFeedbackAnalysis | null> {
  try {
    // Format the feedback for analysis
    const prompt = `
    Analyze the following user feedback to determine if it's reporting a bug or issue:
    
    Feedback: "${item.content}"
    Rating: ${item.rating}/5
    User ID: ${item.userId || 'Anonymous'}
    Page: ${item.page || 'Unknown'}
    
    Please analyze this feedback and determine:
    1. Is this reporting a bug or technical issue?
    2. What is the sentiment of the feedback?
    3. What category best describes this feedback?
    4. What is the priority level?
    5. What action should be taken?
    
    Respond in JSON format with the following structure:
    {
      "isBugReport": true/false,
      "sentiment": "negative"/"neutral"/"positive",
      "priority": "low"/"medium"/"high",
      "category": "category of the feedback (e.g., UI, performance, feature request)",
      "description": "Brief description of the issue or feedback",
      "suggestedAction": "Suggested action to address the feedback"
    }
    `;
    
    // Execute XAI analysis
    const result = await generateJson(prompt, {
      model: 'grok-3-mini',
      systemPrompt: "You are an expert in analyzing user feedback for software products. Your task is to determine if feedback indicates a bug, the sentiment, and appropriate actions. Be precise, concise, and practical.",
      temperature: 0.3,
      maxTokens: 800
    });
    
    // Return the parsed analysis
    return result as UserFeedbackAnalysis;
  } catch (error) {
    console.error('Error analyzing feedback item:', error);
    return null;
  }
}

/**
 * Attempts to automatically apply a fix for a bug
 */
async function attemptAutoFix(bugAnalysis: BugAnalysisResult): Promise<boolean> {
  // This is a placeholder - in a real implementation, you would:
  // 1. Parse the autoFixCode to understand what file(s) need to be modified
  // 2. Make a backup of the file(s)
  // 3. Apply the suggested changes
  // 4. Verify the changes (possibly by running tests)
  // 5. Return success/failure
  
  if (!bugAnalysis.canAutoFix || !bugAnalysis.autoFixCode) {
    return false;
  }
  
  try {
    // Log the attempted fix
    console.log(`Attempting to auto-fix bug: ${bugAnalysis.description}`);
    console.log(`Fix code: ${bugAnalysis.autoFixCode}`);
    
    // This is where you would implement the actual file modification logic
    
    // For safety, we'll always return false in this demo version
    // In a real implementation, you'd return true if the fix was successfully applied
    return false;
  } catch (error) {
    console.error('Error attempting to auto-fix bug:', error);
    return false;
  }
}

/**
 * Maps priority levels from feedback analysis to bug severity levels
 */
function mapPriorityToSeverity(priority: string): 'low' | 'medium' | 'high' | 'critical' {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'high';
    case 'medium':
      return 'medium';
    case 'low':
      return 'low';
    default:
      return 'medium';
  }
}

/**
 * Stores a bug report in the database
 */
async function storeBugReport(bugReport: any): Promise<void> {
  try {
    await storage.createBugReport(bugReport);
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
    const openBugs = await storage.getBugReports('open');
    const inProgressBugs = await storage.getBugReports('in-progress');
    const resolvedBugs = await storage.getBugReports('resolved', 10);
    
    // Get recent error logs for context
    const recentErrors = await storage.getRecentLogs('error', 20);
    
    // Build summary data for the prompt
    const summaryData = {
      openBugs: openBugs.length,
      inProgressBugs: inProgressBugs.length,
      resolvedBugs: resolvedBugs.length,
      recentErrors: recentErrors.length,
      openBugSamples: openBugs.slice(0, 5).map(bug => ({
        title: bug.title,
        severity: bug.severity,
        component: bug.affectedComponent || 'Unknown',
        created: new Date(bug.createdAt).toISOString()
      })),
      resolvedBugSamples: resolvedBugs.slice(0, 3).map(bug => ({
        title: bug.title,
        severity: bug.severity,
        component: bug.affectedComponent || 'Unknown',
        resolved: bug.resolvedAt ? new Date(bug.resolvedAt).toISOString() : 'Unknown'
      }))
    };
    
    // Create the report prompt for XAI
    const prompt = `
    Generate a concise executive summary of the current state of system bugs and maintenance.
    
    Current Bug Status:
    - Open Bugs: ${summaryData.openBugs}
    - In-Progress Bugs: ${summaryData.inProgressBugs}
    - Recently Resolved Bugs: ${summaryData.resolvedBugs}
    - Recent Error Log Entries: ${summaryData.recentErrors}
    
    Sample Open Bugs:
    ${summaryData.openBugSamples.map(bug => `- [${bug.severity.toUpperCase()}] ${bug.title} (${bug.component})`).join('\n')}
    
    Sample Recently Resolved Bugs:
    ${summaryData.resolvedBugSamples.map(bug => `- [${bug.severity.toUpperCase()}] ${bug.title} (${bug.component})`).join('\n')}
    
    Please provide:
    1. A brief executive summary of the system health (2-3 sentences)
    2. Key bug trends or patterns you observe
    3. Recommendations for immediate action items (if any)
    4. Maintenance priorities for the coming week
    
    The report should be concise, actionable, and appropriate for both technical and non-technical stakeholders.
    `;
    
    // Generate the report
    const report = await generateText(prompt, {
      model: 'grok-3-mini',
      systemPrompt: "You are an expert software engineering manager with a focus on system reliability and maintenance. Your task is to provide clear, concise reports on bug status that highlight key issues without causing unnecessary alarm. Focus on actionable insights and prioritization.",
      temperature: 0.3,
      maxTokens: 1000
    });
    
    return report;
  } catch (error) {
    console.error('Error generating bug summary report:', error);
    return 'Error generating bug summary report. Please try again later.';
  }
}

// Helper function to read source code files
function readSourceFile(filePath: string): string | null {
  try {
    const fullPath = path.resolve(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf8');
    }
    return null;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
}