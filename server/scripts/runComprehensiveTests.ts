/**
 * Comprehensive Testing Script for Elevion Platform
 * 
 * This script runs a full suite of tests on the Elevion platform using
 * the ComprehensiveTester utility to identify and report issues.
 * 
 * Usage:
 * - Run manually: npm run test:comprehensive
 * - This script is also integrated with the scheduler for automated testing
 */

import { tester } from '../utils/comprehensiveTester';
import { db } from '../db';
import { bug_reports } from '@shared/schema';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Set up configuration
const CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:5000',
  logsDir: path.join(process.cwd(), 'logs'),
  reportFile: path.join(process.cwd(), 'logs', 'test-report.json'),
  testEndpoints: [
    // Static content endpoints
    { path: '/', method: 'GET', name: 'Home Page' },
    { path: '/portfolio', method: 'GET', name: 'Portfolio Page' },
    { path: '/services', method: 'GET', name: 'Services Page' },
    { path: '/about', method: 'GET', name: 'About Page' },
    { path: '/contact', method: 'GET', name: 'Contact Page' },
    { path: '/login', method: 'GET', name: 'Login Page' },
    
    // API endpoints
    { path: '/api/test-xai', method: 'GET', name: 'XAI API Test' },
    { path: '/api/stripe/config', method: 'GET', name: 'Stripe Config' },
    
    // Popup endpoints
    { path: '/popup/project-brief', method: 'GET', name: 'Project Brief Popup' },
    { path: '/popup/mockup-preview', method: 'GET', name: 'Mockup Preview Popup' },
    { path: '/popup/quote-generator', method: 'GET', name: 'Quote Generator Popup' }
  ],
  // Test accounts for auth testing
  testAccounts: {
    admin: {
      username: 'admin@elevion.dev',
      password: '*Rosie2010' 
    },
    user: {
      username: 'test@example.com',
      password: 'Password123!'
    }
  }
};

// Ensure logs directory exists
if (!fs.existsSync(CONFIG.logsDir)) {
  fs.mkdirSync(CONFIG.logsDir, { recursive: true });
}

/**
 * Main test execution function
 */
async function runTests() {
  console.log('Starting comprehensive test suite...');
  
  try {
    // Run the test suite using the ComprehensiveTester
    const results = await tester.runAllTests();
    
    // Save results to file
    fs.writeFileSync(
      CONFIG.reportFile, 
      JSON.stringify(results, null, 2)
    );
    
    // Log results to console
    console.log('\n===== TEST RESULTS =====');
    console.log(`Total Tests: ${results.totalTests}`);
    console.log(`Passed: ${results.passedTests} (${Math.round(results.passedTests/results.totalTests*100)}%)`);
    console.log(`Failed: ${results.failedTests}`);
    console.log(`Critical Issues: ${results.criticalIssues}`);
    console.log(`Issues Fixed: ${results.fixedIssues}/${results.totalFixAttempts} fix attempts`);
    
    // Log any critical issues to the database
    if (results.criticalIssues > 0) {
      await logCriticalIssues(results);
    }
    
    // Manual endpoint testing
    await testEndpoints();
    
    return results;
  } catch (error) {
    console.error('Error running tests:', error);
    
    // Log the error to the database
    await db.insert(bug_reports).values({
      title: 'Comprehensive Test Failure',
      description: `The comprehensive test suite failed to run: ${error instanceof Error ? error.message : String(error)}`,
      severity: 'critical',
      status: 'open',
      source: 'manual-test-run',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    throw error;
  }
}

/**
 * Log critical issues to the database
 */
async function logCriticalIssues(results: any) {
  try {
    const criticalIssues = results.testResults.filter(
      (result: any) => !result.success && result.severity === 'critical'
    );
    
    // Format the issues for the bug report
    const issuesSummary = criticalIssues.map((issue: any, index: number) => 
      `${index + 1}. [${issue.category}] ${issue.message}\n   Location: ${issue.location || 'N/A'}`
    ).join('\n');
    
    // Create a bug report entry
    await db.insert(bug_reports).values({
      source: 'ComprehensiveTest',
      title: `${criticalIssues.length} critical issues found in comprehensive tests`,
      description: `Test Summary:\n\nTotal Tests: ${results.totalTests}\nPassed: ${results.passedTests}\nFailed: ${results.failedTests}\n\nCritical Issues:\n${issuesSummary}`,
      severity: 'critical',
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
  } catch (error) {
    console.error('Error logging critical issues:', error);
  }
}

/**
 * Test specific endpoints
 */
async function testEndpoints() {
  console.log('\n===== TESTING ENDPOINTS =====');
  
  const results = {
    total: CONFIG.testEndpoints.length,
    passed: 0,
    failed: 0,
    details: [] as any[]
  };
  
  for (const endpoint of CONFIG.testEndpoints) {
    try {
      console.log(`Testing ${endpoint.name}: ${endpoint.method} ${endpoint.path}`);
      
      const start = Date.now();
      const response = await axios({
        method: endpoint.method.toLowerCase(),
        url: `${CONFIG.baseUrl}${endpoint.path}`,
        validateStatus: () => true // Don't throw on non-2xx status
      });
      const duration = Date.now() - start;
      
      const isSuccess = response.status >= 200 && response.status < 300;
      
      if (isSuccess) {
        results.passed++;
        console.log(`✅ ${endpoint.name}: ${response.status} (${duration}ms)`);
      } else {
        results.failed++;
        console.error(`❌ ${endpoint.name}: ${response.status} (${duration}ms)`);
        
        // Log errors to database
        await db.insert(bug_reports).values({
          title: `Endpoint failure: ${endpoint.name}`,
          description: `Endpoint ${endpoint.method} ${endpoint.path} returned status ${response.status}.\nResponse: ${JSON.stringify(response.data)}`,
          severity: response.status >= 500 ? 'high' : 'medium',
          status: 'open',
          source: 'endpoint-test',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      results.details.push({
        name: endpoint.name,
        path: endpoint.path,
        method: endpoint.method,
        status: response.status,
        duration,
        success: isSuccess
      });
      
    } catch (error) {
      results.failed++;
      console.error(`❌ ${endpoint.name}: Failed - ${error instanceof Error ? error.message : String(error)}`);
      
      // Log errors to database
      await db.insert(bug_reports).values({
        title: `Endpoint error: ${endpoint.name}`,
        description: `Failed to connect to endpoint ${endpoint.method} ${endpoint.path}: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'high',
        status: 'open',
        source: 'endpoint-test',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      results.details.push({
        name: endpoint.name,
        path: endpoint.path,
        method: endpoint.method,
        error: error instanceof Error ? error.message : String(error),
        success: false
      });
    }
  }
  
  // Log summary
  console.log('\n===== ENDPOINT TEST RESULTS =====');
  console.log(`Total: ${results.total}`);
  console.log(`Passed: ${results.passed} (${Math.round(results.passed/results.total*100)}%)`);
  console.log(`Failed: ${results.failed}`);
  
  // Save endpoint test results
  fs.writeFileSync(
    path.join(CONFIG.logsDir, 'endpoint-test-results.json'),
    JSON.stringify(results, null, 2)
  );
  
  return results;
}

// Run the tests if this script is executed directly
if (require.main === module) {
  runTests()
    .then(() => {
      console.log('Comprehensive tests completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

// Export for use in other scripts
export default runTests;