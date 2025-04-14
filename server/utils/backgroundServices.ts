import { analyzeErrorLogs, analyzeUserFeedback, generateBugSummaryReport } from './bugMonitoringService';
import { monitorBrandConsistency } from './brandConsistencyService';
import { Logger } from '../middlewares/logger';

const logger = new Logger('BackgroundServices');

// Configuration for service intervals (in milliseconds)
const INTERVALS = {
  bugDetection: 15 * 60 * 1000, // 15 minutes
  userFeedbackAnalysis: 30 * 60 * 1000, // 30 minutes
  bugSummaryReport: 24 * 60 * 60 * 1000, // 24 hours
  brandConsistencyCheck: 60 * 60 * 1000, // 1 hour
};

// Track interval IDs so we can clear them if needed
const intervalIds: Record<string, NodeJS.Timeout> = {};

/**
 * Starts all background monitoring services
 */
export function startBackgroundServices() {
  logger.info('Starting background monitoring services');
  
  // Start the bug detection service
  startBugDetectionService();
  
  // Start the user feedback analysis service
  startUserFeedbackAnalysisService();
  
  // Start the brand consistency monitoring service
  startBrandConsistencyMonitoringService();
  
  // Start the bug summary report generation service
  startBugSummaryReportService();
  
  logger.info('All background monitoring services started');
}

/**
 * Stops all background monitoring services
 */
export function stopBackgroundServices() {
  logger.info('Stopping background monitoring services');
  
  // Clear all interval timers
  Object.values(intervalIds).forEach(intervalId => {
    clearInterval(intervalId);
  });
  
  logger.info('All background monitoring services stopped');
}

/**
 * Starts the automated bug detection service
 */
function startBugDetectionService() {
  // Run immediately on startup
  runBugDetection();
  
  // Schedule regular runs
  intervalIds.bugDetection = setInterval(runBugDetection, INTERVALS.bugDetection);
  
  logger.info(`Bug detection service started. Will run every ${INTERVALS.bugDetection / 60000} minutes`);
}

/**
 * Executes a single bug detection cycle
 */
async function runBugDetection() {
  try {
    logger.info('Running bug detection cycle');
    
    // Analyze error logs for bugs
    const bugAnalyses = await analyzeErrorLogs('last_day');
    
    logger.info(`Bug detection cycle completed. Found ${bugAnalyses.length} potential bugs`);
    
    // Detailed log for each bug found
    bugAnalyses.forEach(bug => {
      logger.info(`Detected bug: ${bug.description} (${bug.severity}) - ${bug.canAutoFix ? 'Can auto-fix' : 'Manual fix required'}`);
    });
  } catch (error) {
    logger.error('Error in bug detection cycle', { error });
  }
}

/**
 * Starts the user feedback analysis service
 */
function startUserFeedbackAnalysisService() {
  // Run immediately on startup
  runUserFeedbackAnalysis();
  
  // Schedule regular runs
  intervalIds.userFeedbackAnalysis = setInterval(runUserFeedbackAnalysis, INTERVALS.userFeedbackAnalysis);
  
  logger.info(`User feedback analysis service started. Will run every ${INTERVALS.userFeedbackAnalysis / 60000} minutes`);
}

/**
 * Executes a single user feedback analysis cycle
 */
async function runUserFeedbackAnalysis() {
  try {
    logger.info('Running user feedback analysis cycle');
    
    // Analyze user feedback for potential bugs
    const feedbackAnalyses = await analyzeUserFeedback();
    
    // Filter for bug reports
    const bugReports = feedbackAnalyses.filter(analysis => analysis.isBugReport);
    
    logger.info(`User feedback analysis cycle completed. Found ${bugReports.length} potential bug reports`);
    
    // Detailed log for each bug report found
    bugReports.forEach(report => {
      logger.info(`User reported issue: ${report.description} (${report.priority}) - Category: ${report.category}`);
    });
  } catch (error) {
    logger.error('Error in user feedback analysis cycle', { error });
  }
}

/**
 * Starts the bug summary report generation service
 */
function startBugSummaryReportService() {
  // Run immediately on startup
  runBugSummaryReport();
  
  // Schedule regular runs
  intervalIds.bugSummaryReport = setInterval(runBugSummaryReport, INTERVALS.bugSummaryReport);
  
  logger.info(`Bug summary report service started. Will run every ${INTERVALS.bugSummaryReport / 3600000} hours`);
}

/**
 * Executes a single bug summary report generation cycle
 */
async function runBugSummaryReport() {
  try {
    logger.info('Generating bug summary report');
    
    // Generate a summary report
    const report = await generateBugSummaryReport();
    
    // Here you could email this report to stakeholders
    // or store it in the database for later access
    
    logger.info('Bug summary report generated successfully');
  } catch (error) {
    logger.error('Error generating bug summary report', { error });
  }
}

/**
 * Starts the brand consistency monitoring service
 */
function startBrandConsistencyMonitoringService() {
  // Run immediately on startup
  runBrandConsistencyCheck();
  
  // Schedule regular runs
  intervalIds.brandConsistencyCheck = setInterval(runBrandConsistencyCheck, INTERVALS.brandConsistencyCheck);
  
  logger.info(`Brand consistency monitoring service started. Will run every ${INTERVALS.brandConsistencyCheck / 60000} minutes`);
}

/**
 * Executes a single brand consistency check cycle
 */
async function runBrandConsistencyCheck() {
  try {
    logger.info('Running brand consistency check');
    
    // Check for brand consistency issues
    const consistencyIssues = await monitorBrandConsistency();
    
    logger.info(`Brand consistency check completed. Found ${consistencyIssues.length} issues`);
    
    // Detailed log for each brand consistency issue found
    consistencyIssues.forEach(issue => {
      logger.info(`Brand consistency issue: ${issue.description} (${issue.severity}) - Location: ${issue.location}`);
    });
  } catch (error) {
    logger.error('Error in brand consistency check', { error });
  }
}