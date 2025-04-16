/**
 * All Tests Runner
 * 
 * This script runs all available test suites and generates a consolidated report.
 * It's designed to be run manually or scheduled through the SchedulerService.
 * 
 * Usage:
 * - Run manually: npm run test:all
 * - Automated through scheduler
 */

import fs from 'fs';
import path from 'path';
import { db } from '../db';
import { bug_reports } from '@shared/schema';
import runComprehensiveTests from './runComprehensiveTests';
import testPopupRoutes from './testPopupRoutes';
import { tester } from '../utils/comprehensiveTester';

// Configuration
const CONFIG = {
  logsDir: path.join(process.cwd(), 'logs'),
  reportFile: path.join(process.cwd(), 'logs', 'all-tests-report.json'),
  timeoutMs: 5 * 60 * 1000 // 5 minutes timeout for all tests
};

// Ensure logs directory exists
if (!fs.existsSync(CONFIG.logsDir)) {
  fs.mkdirSync(CONFIG.logsDir, { recursive: true });
}

/**
 * Main function to run all test suites
 */
async function runAllTests() {
  console.log('Starting all test suites...');
  
  const startTime = Date.now();
  
  // Set up timeout to prevent hanging
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Test execution timed out after ${CONFIG.timeoutMs / 1000} seconds`));
    }, CONFIG.timeoutMs);
  });
  
  // Results object
  const results = {
    timestamp: new Date().toISOString(),
    duration: 0,
    suites: {
      comprehensive: { status: 'pending' as string, results: null as any },
      popupRoutes: { status: 'pending' as string, results: null as any },
      platformCompatibility: { status: 'pending' as string, results: null as any }
    },
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      criticalIssues: 0,
      highPriorityIssues: 0
    }
  };
  
  try {
    // Run the tests with timeout protection
    await Promise.race([
      runTestSuites(results),
      timeoutPromise
    ]);
    
    // Calculate overall duration
    results.duration = Date.now() - startTime;
    
    // Generate summary
    results.summary = generateSummary(results);
    
    // Save consolidated report
    fs.writeFileSync(
      CONFIG.reportFile,
      JSON.stringify(results, null, 2)
    );
    
    // Log results to console
    console.log('\n========= CONSOLIDATED TEST RESULTS =========');
    console.log(`Total Tests: ${results.summary.totalTests}`);
    console.log(`Passed: ${results.summary.passedTests} (${Math.round(results.summary.passedTests/results.summary.totalTests*100)}%)`);
    console.log(`Failed: ${results.summary.failedTests}`);
    console.log(`Critical Issues: ${results.summary.criticalIssues}`);
    console.log(`High Priority Issues: ${results.summary.highPriorityIssues}`);
    console.log(`Total Duration: ${(results.duration / 1000).toFixed(1)} seconds`);
    
    // Create a bug report for critical issues if there are any
    if (results.summary.criticalIssues > 0) {
      await createCriticalIssueReport(results);
    }
    
    return results;
  } catch (error) {
    console.error('Error running all tests:', error);
    
    // Log the error to the database
    await db.insert(bug_reports).values({
      title: 'Test Suite Execution Error',
      description: `The test suite runner encountered an error: ${error instanceof Error ? error.message : String(error)}`,
      severity: 'high',
      status: 'open',
      source: 'all-tests-runner',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    throw error;
  }
}

/**
 * Run all test suites in sequence
 */
async function runTestSuites(results: any) {
  try {
    // Run comprehensive tests
    console.log('\n=== Running Comprehensive Tests ===');
    try {
      results.suites.comprehensive.results = await runComprehensiveTests();
      results.suites.comprehensive.status = 'completed';
    } catch (error) {
      console.error('Comprehensive tests failed:', error);
      results.suites.comprehensive.status = 'failed';
      results.suites.comprehensive.error = error instanceof Error ? error.message : String(error);
    }
    
    // Run popup routes tests
    console.log('\n=== Running Popup Routes Tests ===');
    try {
      results.suites.popupRoutes.results = await testPopupRoutes();
      results.suites.popupRoutes.status = 'completed';
    } catch (error) {
      console.error('Popup routes tests failed:', error);
      results.suites.popupRoutes.status = 'failed';
      results.suites.popupRoutes.error = error instanceof Error ? error.message : String(error);
    }
    
    // Run platform compatibility tests
    console.log('\n=== Running Platform Compatibility Tests ===');
    try {
      // Using the tester's capability to run specific test categories
      results.suites.platformCompatibility.results = await tester.runAllTests();
      results.suites.platformCompatibility.status = 'completed';
    } catch (error) {
      console.error('Platform compatibility tests failed:', error);
      results.suites.platformCompatibility.status = 'failed';
      results.suites.platformCompatibility.error = error instanceof Error ? error.message : String(error);
    }
    
  } catch (error) {
    console.error('Error in test suite execution:', error);
    throw error;
  }
}

/**
 * Generate a summary of all test results
 */
function generateSummary(results: any) {
  const summary = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    criticalIssues: 0,
    highPriorityIssues: 0
  };
  
  // Compile data from comprehensive tests
  if (results.suites.comprehensive.status === 'completed' && results.suites.comprehensive.results) {
    const comprehensiveResults = results.suites.comprehensive.results;
    summary.totalTests += comprehensiveResults.totalTests || 0;
    summary.passedTests += comprehensiveResults.passedTests || 0;
    summary.failedTests += comprehensiveResults.failedTests || 0;
    summary.criticalIssues += comprehensiveResults.criticalIssues || 0;
  }
  
  // Compile data from popup routes tests
  if (results.suites.popupRoutes.status === 'completed' && results.suites.popupRoutes.results) {
    const popupResults = results.suites.popupRoutes.results;
    summary.totalTests += popupResults.total || 0;
    summary.passedTests += popupResults.passed || 0;
    summary.failedTests += popupResults.failed || 0;
    
    // Count popup failures as high priority issues
    summary.highPriorityIssues += popupResults.failed || 0;
    
    // If more than 50% of popups fail, count it as a critical issue
    if (popupResults.total > 0 && (popupResults.failed / popupResults.total) > 0.5) {
      summary.criticalIssues += 1;
    }
  }
  
  // Compile data from platform compatibility tests
  if (results.suites.platformCompatibility.status === 'completed' && results.suites.platformCompatibility.results) {
    const platformResults = results.suites.platformCompatibility.results;
    
    // These might already be counted in comprehensive tests, so we don't add to totalTests
    // But we do count critical issues separately
    if (platformResults.testResults && Array.isArray(platformResults.testResults)) {
      const criticalCompatIssues = platformResults.testResults.filter(
        (result: any) => !result.success && result.severity === 'critical'
      );
      
      const highPriorityCompatIssues = platformResults.testResults.filter(
        (result: any) => !result.success && result.severity === 'high'
      );
      
      summary.criticalIssues += criticalCompatIssues.length;
      summary.highPriorityIssues += highPriorityCompatIssues.length;
    }
  }
  
  return summary;
}

/**
 * Create a bug report for critical issues
 */
async function createCriticalIssueReport(results: any) {
  try {
    // Compile critical issues from all test suites
    const criticalIssues: any[] = [];
    
    // From comprehensive tests
    if (results.suites.comprehensive.status === 'completed' && 
        results.suites.comprehensive.results &&
        results.suites.comprehensive.results.testResults) {
      
      const comprehensiveIssues = results.suites.comprehensive.results.testResults
        .filter((result: any) => !result.success && result.severity === 'critical')
        .map((issue: any) => ({
          suite: 'Comprehensive',
          category: issue.category,
          message: issue.message,
          location: issue.location || 'N/A'
        }));
      
      criticalIssues.push(...comprehensiveIssues);
    }
    
    // From popup tests (if over 50% failure)
    if (results.suites.popupRoutes.status === 'completed' && 
        results.suites.popupRoutes.results) {
      
      const popupResults = results.suites.popupRoutes.results;
      if (popupResults.total > 0 && (popupResults.failed / popupResults.total) > 0.5) {
        criticalIssues.push({
          suite: 'Popup Routes',
          category: 'Router',
          message: `${popupResults.failed}/${popupResults.total} popup routes are failing (${Math.round((popupResults.failed / popupResults.total) * 100)}% failure rate)`,
          location: 'client/src/App.tsx (router configuration)'
        });
      }
    }
    
    // From platform compatibility tests
    if (results.suites.platformCompatibility.status === 'completed' && 
        results.suites.platformCompatibility.results &&
        results.suites.platformCompatibility.results.testResults) {
      
      const platformIssues = results.suites.platformCompatibility.results.testResults
        .filter((result: any) => !result.success && result.severity === 'critical')
        .map((issue: any) => ({
          suite: 'Platform Compatibility',
          category: issue.category,
          message: issue.message,
          location: issue.location || 'N/A'
        }));
      
      criticalIssues.push(...platformIssues);
    }
    
    // Format the issues for the bug report
    const issuesSummary = criticalIssues.map((issue, index) => 
      `${index + 1}. [${issue.suite} - ${issue.category}] ${issue.message}\n   Location: ${issue.location}`
    ).join('\n\n');
    
    // Create a bug report entry
    await db.insert(bug_reports).values({
      title: `${criticalIssues.length} critical issues found across test suites`,
      description: `Consolidated Test Report:

Total Tests: ${results.summary.totalTests}
Passed: ${results.summary.passedTests} (${Math.round(results.summary.passedTests/results.summary.totalTests*100)}%)
Failed: ${results.summary.failedTests}
Critical Issues: ${results.summary.criticalIssues}
High Priority Issues: ${results.summary.highPriorityIssues}

Critical Issues Details:
${issuesSummary}

These issues require immediate attention as they affect core functionality of the platform.`,
      severity: 'critical',
      status: 'open',
      source: 'all-tests-runner',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
  } catch (error) {
    console.error('Error creating critical issue report:', error);
  }
}

// Run main function when this module is the entry point
runAllTests()
  .then(() => {
    console.log('All tests completed successfully');
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });

// Export for use in other scripts
export default runAllTests;