/**
 * Daily XAI Scan
 * 
 * This script performs a comprehensive analysis of the Elevion platform using XAI
 * to identify and fix issues automatically.
 */

import { generateJson, generateText } from '../utils/xaiClient';
import fs from 'fs';
import path from 'path';
import { db } from '../db';
import { bug_reports, logs } from '@shared/schema';
import { eq, desc, lte, gte } from 'drizzle-orm';
import { tester } from '../utils/comprehensiveTester';

// Track the scan execution
let scanStartTime = Date.now();
let issuesFound = 0;
let issuesFixed = 0;
let recommendationsGenerated = 0;

async function main() {
  try {
    console.log(`
┌─────────────────────────────────────────────┐
│                                             │
│    Elevion Platform - Daily XAI Scan        │
│                                             │
└─────────────────────────────────────────────┘
`);
    
    scanStartTime = Date.now();
    
    console.log('Starting comprehensive platform scan...');
    
    // 1. Run the comprehensive tester
    console.log('\n📋 Running comprehensive tests...');
    const testResults = await tester.runAllTests();
    
    issuesFound += testResults.failedTests;
    issuesFixed += testResults.fixedIssues;
    
    // 2. Analyze logs for patterns
    console.log('\n📊 Analyzing logs for patterns...');
    await analyzeLogs();
    
    // 3. Generate optimization recommendations
    console.log('\n💡 Generating optimization recommendations...');
    await generateOptimizationRecommendations();
    
    // 4. Schedule the next scan (if not already scheduled)
    if (process.argv.includes('--schedule')) {
      console.log('\n🔄 Scheduling next daily scan...');
      tester.scheduleDailyTests();
    }
    
    // 5. Print summary report
    const scanDuration = (Date.now() - scanStartTime) / 1000;
    console.log(`
┌─────────────────────────────────────────────┐
│             XAI Scan Summary                │
├─────────────────────────────────────────────┤
│ Duration:            ${scanDuration.toFixed(2)} seconds      │
│ Tests run:           ${testResults.totalTests}                │
│ Issues found:        ${issuesFound}                │
│ Issues fixed:        ${issuesFixed}                │
│ Recommendations:     ${recommendationsGenerated}                │
│ Critical issues:     ${testResults.criticalIssues}                │
└─────────────────────────────────────────────┘

Daily XAI scan complete! Results saved to 'xai-scan-report.log'
`);
    
    // Save the scan report
    await saveScanReport({
      timestamp: new Date().toISOString(),
      duration: scanDuration,
      testsRun: testResults.totalTests,
      issuesFound,
      issuesFixed,
      recommendationsGenerated,
      criticalIssues: testResults.criticalIssues
    });
    
  } catch (error) {
    console.error('Error during XAI scan:', error);
    
    // Log the error
    await db.insert(bug_reports).values({
      source: 'XAIScan',
      title: 'Error running daily XAI scan',
      description: error instanceof Error ? error.message : 'Unknown error',
      severity: 'high',
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
}

/**
 * Analyze logs for patterns and issues
 */
async function analyzeLogs() {
  try {
    // Get logs from the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentLogs = await db.select().from(logs)
      .where(gte(logs.timestamp, yesterday))
      .orderBy(desc(logs.timestamp))
      .limit(200);
    
    if (recentLogs.length === 0) {
      console.log('  No recent logs found to analyze');
      return;
    }
    
    // Prepare logs for analysis
    const logText = recentLogs.map(log => 
      `[${new Date(log.timestamp).toISOString()}] ${log.level.toUpperCase()}: ${log.message}\nSource: ${log.source || 'unknown'}`
    ).join('\n\n');
    
    console.log(`  Analyzing ${recentLogs.length} log entries from the last 24 hours...`);
    
    // Analyze logs with XAI
    const analysisPrompt = `
    Analyze the following ${recentLogs.length} logs from the Elevion platform to identify:
    
    1. Error patterns and recurring issues
    2. Performance bottlenecks or slow operations
    3. Security concerns or suspicious activities
    4. API or external service failures
    5. User experience issues
    
    Focus on actionable insights that could help improve the platform's reliability.
    
    Here are the logs:
    
    ${logText}
    `;
    
    const analysis = await generateJson<{
      errorPatterns: Array<{
        pattern: string;
        occurrences: number;
        severity: 'low' | 'medium' | 'high' | 'critical';
        recommendation: string;
      }>;
      performanceIssues: Array<{
        description: string;
        impact: string;
        recommendation: string;
      }>;
      securityConcerns: Array<{
        description: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        recommendation: string;
      }>;
      apiIssues: Array<{
        service: string;
        issue: string;
        recommendation: string;
      }>;
      userExperienceIssues: Array<{
        description: string;
        impact: string;
        recommendation: string;
      }>;
    }>(analysisPrompt, {
      model: 'grok-3',
      temperature: 0.3
    });
    
    if (!analysis) {
      console.log('  Analysis failed to return results');
      return;
    }
    
    // Process the results
    let totalIssues = 0;
    
    if (analysis.errorPatterns?.length) {
      totalIssues += analysis.errorPatterns.length;
      console.log(`  Found ${analysis.errorPatterns.length} error patterns`);
      
      // Log high severity issues
      const highSeverityIssues = analysis.errorPatterns.filter(
        p => p.severity === 'high' || p.severity === 'critical'
      );
      
      for (const issue of highSeverityIssues) {
        await db.insert(bug_reports).values({
          source: 'LogAnalysis',
          title: `Error pattern: ${issue.pattern}`,
          description: `Occurrences: ${issue.occurrences}\nRecommendation: ${issue.recommendation}`,
          severity: issue.severity,
          status: 'open',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    
    if (analysis.performanceIssues?.length) {
      totalIssues += analysis.performanceIssues.length;
      console.log(`  Found ${analysis.performanceIssues.length} performance issues`);
    }
    
    if (analysis.securityConcerns?.length) {
      totalIssues += analysis.securityConcerns.length;
      console.log(`  Found ${analysis.securityConcerns.length} security concerns`);
      
      // Log all security concerns - they're important
      for (const issue of analysis.securityConcerns) {
        await db.insert(bug_reports).values({
          source: 'SecurityScan',
          title: issue.description,
          description: `Recommendation: ${issue.recommendation}`,
          severity: issue.severity,
          status: 'open',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    
    if (analysis.apiIssues?.length) {
      totalIssues += analysis.apiIssues.length;
      console.log(`  Found ${analysis.apiIssues.length} API issues`);
    }
    
    if (analysis.userExperienceIssues?.length) {
      totalIssues += analysis.userExperienceIssues.length;
      console.log(`  Found ${analysis.userExperienceIssues.length} user experience issues`);
    }
    
    issuesFound += totalIssues;
    
  } catch (error) {
    console.error('  Error analyzing logs:', error);
  }
}

/**
 * Generate optimization recommendations
 */
async function generateOptimizationRecommendations() {
  try {
    // Get current code structure
    const codeStructurePrompt = `
    Generate optimization recommendations for the Elevion web platform based on:
    
    1. Performance optimizations (API calls, rendering, etc.)
    2. User experience improvements
    3. Security enhancements
    4. Code quality and maintainability
    5. Automated testing strategies
    
    The platform has the following structure:
    - React.js with TypeScript frontend
    - Express.js backend
    - PostgreSQL database with Drizzle ORM
    - Authentication using JWT tokens
    - Integration with XAI/Grok API for AI features
    - Portfolio feature with CRUD operations
    
    Current issues:
    - Some popup routes may return 404 errors
    - AbortController timeouts in API calls
    - CSS layout inconsistencies on mobile devices
    
    Return JSON with specific, actionable recommendations.
    `;
    
    const recommendations = await generateJson<{
      performance: Array<{
        title: string;
        description: string;
        implementation: string;
        priority: 'low' | 'medium' | 'high';
      }>;
      userExperience: Array<{
        title: string;
        description: string;
        implementation: string;
        priority: 'low' | 'medium' | 'high';
      }>;
      security: Array<{
        title: string;
        description: string;
        implementation: string;
        priority: 'low' | 'medium' | 'high';
      }>;
      codeQuality: Array<{
        title: string;
        description: string;
        implementation: string;
        priority: 'low' | 'medium' | 'high';
      }>;
      testing: Array<{
        title: string;
        description: string;
        implementation: string;
        priority: 'low' | 'medium' | 'high';
      }>;
    }>(codeStructurePrompt, {
      model: 'grok-3',
      temperature: 0.4
    });
    
    if (!recommendations) {
      console.log('  Failed to generate optimization recommendations');
      return;
    }
    
    // Count total recommendations
    const totalRecommendations = (
      (recommendations.performance?.length || 0) +
      (recommendations.userExperience?.length || 0) +
      (recommendations.security?.length || 0) +
      (recommendations.codeQuality?.length || 0) +
      (recommendations.testing?.length || 0)
    );
    
    recommendationsGenerated = totalRecommendations;
    console.log(`  Generated ${totalRecommendations} optimization recommendations`);
    
    // Save high priority recommendations to the bug report
    const highPriorityRecs = [
      ...(recommendations.performance || []),
      ...(recommendations.userExperience || []),
      ...(recommendations.security || []),
      ...(recommendations.codeQuality || []),
      ...(recommendations.testing || [])
    ].filter(rec => rec.priority === 'high');
    
    for (const rec of highPriorityRecs) {
      await db.insert(bug_reports).values({
        source: 'Optimization',
        title: rec.title,
        description: `${rec.description}\n\nImplementation: ${rec.implementation}`,
        severity: 'medium',
        status: 'improvement',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Save all recommendations to a file
    fs.writeFileSync(
      'optimization-recommendations.json', 
      JSON.stringify(recommendations, null, 2)
    );
    
  } catch (error) {
    console.error('  Error generating recommendations:', error);
  }
}

/**
 * Save the scan report to a log file
 */
async function saveScanReport(report: any) {
  try {
    const reportText = `
XAI SCAN REPORT - ${report.timestamp}
==================================================
Duration:        ${report.duration.toFixed(2)} seconds
Tests run:       ${report.testsRun}
Issues found:    ${report.issuesFound}
Issues fixed:    ${report.issuesFixed}
Recommendations: ${report.recommendationsGenerated}
Critical issues: ${report.criticalIssues}
==================================================
`;
    
    fs.appendFileSync('xai-scan-report.log', reportText);
    
  } catch (error) {
    console.error('Error saving scan report:', error);
  }
}

// Export the main function as default
export default main;

// Run the script if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error in XAI scan:', error);
    process.exit(1);
  });
}