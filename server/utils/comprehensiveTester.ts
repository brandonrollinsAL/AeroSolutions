/**
 * Comprehensive Testing Utility for Elevion Platform
 * This utility uses Grok AI to scan logs, test routes, and automatically fix minor issues
 */

import fs from 'fs';
import path from 'path';
import { db } from '../db';
import { generateJson, generateText, analyzeImage } from './xaiClient';
import { bug_reports } from '@shared/schema';
import { eq } from 'drizzle-orm';
import axios from 'axios';

// Types for test results
interface TestResult {
  success: boolean;
  message: string;
  details?: any;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location?: string;
  fixApplied?: boolean;
  fixDetails?: string;
}

interface RouteTestResult extends TestResult {
  route: string;
  status: number;
  responseTime: number;
}

interface TestSuiteResult {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  criticalIssues: number;
  testResults: TestResult[];
  fixedIssues: number;
  totalFixAttempts: number;
}

// Main class for comprehensive testing
export class ComprehensiveTester {
  private baseUrl: string;
  private logFilePath: string;
  private testResults: TestResult[] = [];
  private fixedIssues: number = 0;
  private fixAttempts: number = 0;
  private startTime: number = Date.now();

  constructor(baseUrl: string = 'http://localhost:5000', logPath: string = 'bug-report.log') {
    this.baseUrl = baseUrl;
    this.logFilePath = logPath;
  }

  /**
   * Run all tests and generate a comprehensive report
   */
  async runAllTests(): Promise<TestSuiteResult> {
    console.log('Starting comprehensive platform testing...');
    this.startTime = Date.now();
    
    try {
      // Test popup routes
      await this.testPopupRoutes();
      
      // Test login functionality
      await this.testLoginFunctionality();
      
      // Test client input sheet
      await this.testClientInputSheets();
      
      // Test landing page
      await this.testLandingPage();
      
      // Test portfolio page
      await this.testPortfolioPage();
      
      // Scan logs for errors
      await this.scanLogsForErrors();

      // Apply automated fixes for non-critical issues
      await this.applyAutomatedFixes();

      // Generate and return the test report
      return this.generateTestReport();
    } catch (error) {
      console.error('Error running comprehensive tests:', error);
      
      // Log the error to bug report
      await this.logBugReport('ComprehensiveTester', 
        'Error running tests', 
        {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }, 
        'critical'
      );
      
      // Return partial results if available
      return this.generateTestReport();
    }
  }

  /**
   * Schedule daily Grok scan for automated testing
   */
  scheduleDailyTests() {
    console.log('Scheduling daily comprehensive tests...');
    
    // Calculate time until next scheduled run (2 AM)
    const now = new Date();
    const targetHour = 2; // 2 AM
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(targetHour, 0, 0, 0);
    
    const timeUntilNextRun = tomorrow.getTime() - now.getTime();
    
    // Schedule the first run
    setTimeout(() => {
      // Run the tests
      this.runAllTests().then(result => {
        console.log(`Scheduled tests completed: ${result.passedTests}/${result.totalTests} passed`);
        if (result.criticalIssues > 0) {
          console.error(`⚠️ ${result.criticalIssues} critical issues found during scheduled scan!`);
        }
        
        // Set up a daily interval thereafter
        setInterval(() => {
          this.runAllTests().then(dailyResult => {
            console.log(`Daily tests completed: ${dailyResult.passedTests}/${dailyResult.totalTests} passed`);
            if (dailyResult.criticalIssues > 0) {
              console.error(`⚠️ ${dailyResult.criticalIssues} critical issues found during daily scan!`);
            }
          });
        }, 24 * 60 * 60 * 1000); // 24 hours
      });
    }, timeUntilNextRun);
    
    console.log(`Daily tests scheduled to run at ${targetHour}:00 AM (in ${Math.round(timeUntilNextRun/1000/60/60)} hours)`);
  }
  
  /**
   * Test all popup routes
   */
  private async testPopupRoutes(): Promise<void> {
    console.log('Testing popup routes...');
    
    const popupRoutes = [
      '/popup/client-input',
      '/popup/preview',
      '/popup/dialog',
      '/popup/lightbox'
    ];
    
    for (const route of popupRoutes) {
      try {
        const startTime = Date.now();
        const response = await axios.get(`${this.baseUrl}${route}`, {
          headers: { 'Accept': 'text/html' },
          validateStatus: () => true // Don't throw on non-2xx status codes
        });
        const responseTime = Date.now() - startTime;
        
        const result: RouteTestResult = {
          success: response.status >= 200 && response.status < 400,
          message: response.status >= 200 && response.status < 400 
            ? `Route ${route} responded successfully` 
            : `Route ${route} failed with status ${response.status}`,
          route,
          status: response.status,
          responseTime,
          category: 'popup-routes',
          severity: response.status === 404 ? 'high' : (response.status >= 500 ? 'critical' : 'medium'),
          location: route
        };
        
        this.testResults.push(result);
        
        // Log failures to bug report
        if (!result.success) {
          await this.logBugReport('PopupRouteTest', 
            `Popup route ${route} failed`, 
            { status: response.status, responseTime, data: response.data.substring(0, 500) }, 
            result.severity as any
          );
        }
      } catch (error) {
        // Handle any unexpected errors
        this.testResults.push({
          success: false,
          message: `Error testing route ${route}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          category: 'popup-routes',
          severity: 'high',
          location: route,
          route,
          status: 0,
          responseTime: 0
        });
        
        await this.logBugReport('PopupRouteTest', 
          `Error testing popup route ${route}`, 
          { error: error instanceof Error ? error.message : 'Unknown error' }, 
          'high'
        );
      }
    }
  }
  
  /**
   * Test login functionality
   */
  private async testLoginFunctionality(): Promise<void> {
    console.log('Testing login functionality...');
    
    try {
      // Test admin login endpoint
      const adminLoginResponse = await axios.post(`${this.baseUrl}/api/auth/admin-login`, {
        email: 'admin@elevion.dev',
        password: 'test1234' // Using test password, not the real one
      }, {
        validateStatus: () => true // Don't throw on non-2xx status codes
      });
      
      this.testResults.push({
        success: adminLoginResponse.status === 401, // Should fail with fake credentials
        message: adminLoginResponse.status === 401 
          ? 'Admin login correctly rejected bad credentials' 
          : 'Admin login security issue: did not properly reject bad credentials',
        category: 'login',
        severity: adminLoginResponse.status === 401 ? 'low' : 'critical',
        location: '/api/auth/admin-login'
      });
      
      // Test regular user login endpoint
      const userLoginResponse = await axios.post(`${this.baseUrl}/api/auth/login`, {
        username: 'testuser',
        password: 'wrongpassword'
      }, {
        validateStatus: () => true // Don't throw on non-2xx status codes
      });
      
      this.testResults.push({
        success: userLoginResponse.status === 401, // Should fail with fake credentials
        message: userLoginResponse.status === 401 
          ? 'User login correctly rejected bad credentials' 
          : 'User login security issue: did not properly reject bad credentials',
        category: 'login',
        severity: userLoginResponse.status === 401 ? 'low' : 'critical',
        location: '/api/auth/login'
      });
      
      // Test login page rendering
      const loginPageResponse = await axios.get(`${this.baseUrl}/login`, {
        headers: { 'Accept': 'text/html' },
        validateStatus: () => true
      });
      
      this.testResults.push({
        success: loginPageResponse.status === 200,
        message: loginPageResponse.status === 200 
          ? 'Login page renders correctly' 
          : `Login page failed to render with status ${loginPageResponse.status}`,
        category: 'login',
        severity: loginPageResponse.status === 200 ? 'low' : 'high',
        location: '/login'
      });
      
    } catch (error) {
      // Log any unexpected errors
      this.testResults.push({
        success: false,
        message: `Unexpected error testing login functionality: ${error instanceof Error ? error.message : 'Unknown error'}`,
        category: 'login',
        severity: 'high',
        location: '/api/auth'
      });
      
      await this.logBugReport('LoginTest', 
        'Error testing login functionality', 
        { error: error instanceof Error ? error.message : 'Unknown error' }, 
        'high'
      );
    }
  }
  
  /**
   * Test client input sheets
   */
  private async testClientInputSheets(): Promise<void> {
    console.log('Testing client input sheets...');
    
    try {
      // Test client input form endpoint
      const formResponse = await axios.get(`${this.baseUrl}/api/client-input/form-schema`, {
        validateStatus: () => true
      });
      
      this.testResults.push({
        success: formResponse.status === 200,
        message: formResponse.status === 200 
          ? 'Client input form schema loads correctly' 
          : `Client input form schema failed with status ${formResponse.status}`,
        category: 'client-input',
        severity: formResponse.status === 200 ? 'low' : 'medium',
        location: '/api/client-input/form-schema'
      });
      
      // Test client input submission
      const testData = {
        businessName: 'Test Business',
        industry: 'Technology',
        designPreferences: {
          style: 'Modern',
          colorScheme: 'Blue'
        },
        projectDescription: 'This is a test project',
        contactEmail: 'test@example.com'
      };
      
      const submissionResponse = await axios.post(`${this.baseUrl}/api/client-input/submit`, testData, {
        validateStatus: () => true
      });
      
      this.testResults.push({
        success: submissionResponse.status >= 200 && submissionResponse.status < 300,
        message: submissionResponse.status >= 200 && submissionResponse.status < 300
          ? 'Client input submission works correctly' 
          : `Client input submission failed with status ${submissionResponse.status}`,
        category: 'client-input',
        severity: submissionResponse.status >= 200 && submissionResponse.status < 300 ? 'low' : 'high',
        location: '/api/client-input/submit'
      });
      
    } catch (error) {
      // Log any unexpected errors
      this.testResults.push({
        success: false,
        message: `Unexpected error testing client input sheets: ${error instanceof Error ? error.message : 'Unknown error'}`,
        category: 'client-input',
        severity: 'high',
        location: '/api/client-input'
      });
      
      await this.logBugReport('ClientInputTest', 
        'Error testing client input functionality', 
        { error: error instanceof Error ? error.message : 'Unknown error' }, 
        'high'
      );
    }
  }
  
  /**
   * Test landing page
   */
  private async testLandingPage(): Promise<void> {
    console.log('Testing landing page...');
    
    try {
      // Get the landing page HTML
      const landingResponse = await axios.get(`${this.baseUrl}/`, {
        headers: { 'Accept': 'text/html' },
        validateStatus: () => true
      });
      
      this.testResults.push({
        success: landingResponse.status === 200,
        message: landingResponse.status === 200 
          ? 'Landing page renders correctly' 
          : `Landing page failed with status ${landingResponse.status}`,
        category: 'landing-page',
        severity: landingResponse.status === 200 ? 'low' : 'critical',
        location: '/'
      });
      
      // Check for common elements in landing page
      if (landingResponse.status === 200) {
        const html = landingResponse.data;
        const hasHeader = html.includes('header') || html.includes('nav');
        const hasFooter = html.includes('footer');
        const hasCallToAction = html.includes('button') || html.includes('input type="submit"');
        
        this.testResults.push({
          success: hasHeader && hasFooter && hasCallToAction,
          message: hasHeader && hasFooter && hasCallToAction
            ? 'Landing page has all required elements'
            : 'Landing page is missing key elements',
          category: 'landing-page',
          severity: hasHeader && hasFooter && hasCallToAction ? 'low' : 'medium',
          location: '/',
          details: { hasHeader, hasFooter, hasCallToAction }
        });
      }
      
    } catch (error) {
      // Log any unexpected errors
      this.testResults.push({
        success: false,
        message: `Unexpected error testing landing page: ${error instanceof Error ? error.message : 'Unknown error'}`,
        category: 'landing-page',
        severity: 'high',
        location: '/'
      });
      
      await this.logBugReport('LandingPageTest', 
        'Error testing landing page', 
        { error: error instanceof Error ? error.message : 'Unknown error' }, 
        'high'
      );
    }
  }
  
  /**
   * Test portfolio page
   */
  private async testPortfolioPage(): Promise<void> {
    console.log('Testing portfolio page...');
    
    try {
      // Get the portfolio page HTML
      const portfolioResponse = await axios.get(`${this.baseUrl}/portfolio`, {
        headers: { 'Accept': 'text/html' },
        validateStatus: () => true
      });
      
      this.testResults.push({
        success: portfolioResponse.status === 200,
        message: portfolioResponse.status === 200 
          ? 'Portfolio page renders correctly' 
          : `Portfolio page failed with status ${portfolioResponse.status}`,
        category: 'portfolio',
        severity: portfolioResponse.status === 200 ? 'low' : 'high',
        location: '/portfolio'
      });
      
      // Test API endpoint for portfolio items
      const portfolioApiResponse = await axios.get(`${this.baseUrl}/api/portfolio`, {
        validateStatus: () => true
      });
      
      this.testResults.push({
        success: portfolioApiResponse.status === 200,
        message: portfolioApiResponse.status === 200 
          ? 'Portfolio API endpoint works correctly' 
          : `Portfolio API endpoint failed with status ${portfolioApiResponse.status}`,
        category: 'portfolio',
        severity: portfolioApiResponse.status === 200 ? 'low' : 'high',
        location: '/api/portfolio'
      });
      
      // Check if portfolio items are properly structured JSON
      if (portfolioApiResponse.status === 200) {
        try {
          // If we didn't get an array or the expected structure, consider it a failed test
          if (!Array.isArray(portfolioApiResponse.data) && 
              (!portfolioApiResponse.data.items || !Array.isArray(portfolioApiResponse.data.items))) {
            throw new Error('Unexpected response format');
          }
          
          const items = Array.isArray(portfolioApiResponse.data) 
            ? portfolioApiResponse.data 
            : portfolioApiResponse.data.items;
          
          // Check if any items have required fields
          const hasValidItems = items.length === 0 || items.some(item => 
            item.id && (item.title || item.name) && (item.description || item.summary)
          );
          
          this.testResults.push({
            success: hasValidItems,
            message: hasValidItems 
              ? 'Portfolio items have valid structure' 
              : 'Portfolio items have invalid structure',
            category: 'portfolio',
            severity: hasValidItems ? 'low' : 'medium',
            location: '/api/portfolio',
            details: { itemCount: items.length }
          });
        } catch (error) {
          this.testResults.push({
            success: false,
            message: `Portfolio API returned invalid data: ${error instanceof Error ? error.message : 'Unknown error'}`,
            category: 'portfolio',
            severity: 'medium',
            location: '/api/portfolio'
          });
        }
      }
      
    } catch (error) {
      // Log any unexpected errors
      this.testResults.push({
        success: false,
        message: `Unexpected error testing portfolio page: ${error instanceof Error ? error.message : 'Unknown error'}`,
        category: 'portfolio',
        severity: 'high',
        location: '/portfolio'
      });
      
      await this.logBugReport('PortfolioTest', 
        'Error testing portfolio functionality', 
        { error: error instanceof Error ? error.message : 'Unknown error' }, 
        'high'
      );
    }
  }
  
  /**
   * Scan server logs for errors and analyze them
   */
  private async scanLogsForErrors(): Promise<void> {
    console.log('Scanning logs for errors...');
    
    try {
      // Get the most recent logs from the database
      const recentLogs = await db.query.logs.findMany({
        orderBy: (logs, { desc }) => [desc(logs.timestamp)],
        limit: 100,
      });
      
      if (recentLogs.length === 0) {
        this.testResults.push({
          success: true,
          message: 'No recent logs found to analyze',
          category: 'logs',
          severity: 'low'
        });
        return;
      }
      
      // Find error logs
      const errorLogs = recentLogs.filter(log => 
        log.level === 'error' || 
        log.message.toLowerCase().includes('error') || 
        log.message.toLowerCase().includes('exception')
      );
      
      if (errorLogs.length === 0) {
        this.testResults.push({
          success: true,
          message: 'No errors found in recent logs',
          category: 'logs',
          severity: 'low'
        });
        return;
      }
      
      // Analyze error logs with XAI
      const logText = errorLogs.map(log => 
        `[${new Date(log.timestamp).toISOString()}] ${log.level.toUpperCase()}: ${log.message}\nSource: ${log.source || 'unknown'}`
      ).join('\n\n');
      
      const analysisPrompt = `
      Analyze the following ${errorLogs.length} error logs from the Elevion platform and determine:
      
      1. What are the most critical issues that need immediate attention?
      2. Are there any patterns or recurring issues?
      3. Which components or modules seem to be experiencing the most problems?
      4. What might be causing these errors and how could they be fixed?
      5. Categorize issues by severity (low, medium, high, critical)
      
      Here are the logs:
      
      ${logText}
      `;
      
      const analysis = await generateJson<{
        criticalIssues: Array<{
          description: string;
          component: string;
          possibleCause: string;
          recommendedFix: string;
          severity: 'low' | 'medium' | 'high' | 'critical';
          canAutoFix: boolean;
          autoFixDetails?: string;
        }>;
        patterns: Array<{
          pattern: string;
          frequency: number;
          impact: string;
        }>;
        problematicComponents: Array<{
          name: string;
          issueCount: number;
          mainIssue: string;
        }>;
      }>(analysisPrompt, {
        model: 'grok-3', // Using the more powerful model for complex analysis
        temperature: 0.3,
        fallbackResponse: {
          criticalIssues: errorLogs.slice(0, 3).map(log => ({
            description: log.message,
            component: log.source || 'unknown',
            possibleCause: 'Error in application code',
            recommendedFix: 'Investigate the source file and fix the error',
            severity: 'high',
            canAutoFix: false
          })),
          patterns: [{
            pattern: 'API errors',
            frequency: errorLogs.filter(log => log.message.includes('API')).length,
            impact: 'Affects data retrieval functionality'
          }],
          problematicComponents: [{
            name: 'API',
            issueCount: errorLogs.filter(log => log.message.includes('API')).length,
            mainIssue: 'Failed API calls'
          }]
        }
      });
      
      // Process the critical issues
      if (analysis.criticalIssues && analysis.criticalIssues.length > 0) {
        for (const issue of analysis.criticalIssues) {
          // Add the issue to test results
          this.testResults.push({
            success: false,
            message: issue.description,
            category: 'logs',
            severity: issue.severity,
            location: issue.component,
            details: {
              possibleCause: issue.possibleCause,
              recommendedFix: issue.recommendedFix,
              canAutoFix: issue.canAutoFix,
              autoFixDetails: issue.autoFixDetails
            }
          });
          
          // Log the issue to the bug report if it's high or critical severity
          if (issue.severity === 'high' || issue.severity === 'critical') {
            await this.logBugReport('LogScan', 
              issue.description, 
              { 
                component: issue.component,
                possibleCause: issue.possibleCause,
                recommendedFix: issue.recommendedFix
              },
              issue.severity
            );
          }
        }
      }
      
    } catch (error) {
      // Log any unexpected errors
      this.testResults.push({
        success: false,
        message: `Error scanning logs: ${error instanceof Error ? error.message : 'Unknown error'}`,
        category: 'logs',
        severity: 'medium'
      });
      
      await this.logBugReport('LogScanTest', 
        'Error scanning logs for issues', 
        { error: error instanceof Error ? error.message : 'Unknown error' }, 
        'medium'
      );
    }
  }
  
  /**
   * Apply automated fixes for non-critical issues
   */
  private async applyAutomatedFixes(): Promise<void> {
    console.log('Applying automated fixes for non-critical issues...');
    
    // Get all the issues that can potentially be fixed automatically
    const fixableIssues = this.testResults.filter(result => 
      !result.success && 
      result.severity !== 'critical' && 
      !result.fixApplied
    );
    
    if (fixableIssues.length === 0) {
      console.log('No fixable issues found');
      return;
    }
    
    for (const issue of fixableIssues) {
      try {
        let fixed = false;
        this.fixAttempts++;
        
        // Based on the issue category, try to apply appropriate fixes
        switch (issue.category) {
          case 'popup-routes':
            fixed = await this.fixPopupRouteIssue(issue);
            break;
            
          case 'logs':
            fixed = await this.fixLoggedIssue(issue);
            break;
            
          case 'client-input':
          case 'portfolio':
          case 'landing-page':
            fixed = await this.fixContentIssue(issue);
            break;
        }
        
        // Update the issue status
        if (fixed) {
          issue.fixApplied = true;
          this.fixedIssues++;
          
          // Log the successful fix
          console.log(`✅ Fixed issue: ${issue.message}`);
        }
      } catch (error) {
        console.error(`Error attempting to fix issue: ${issue.message}`, error);
      }
    }
    
    console.log(`Applied ${this.fixedIssues} automated fixes (${this.fixAttempts} attempts)`);
  }
  
  /**
   * Fix popup route issue
   */
  private async fixPopupRouteIssue(issue: TestResult): Promise<boolean> {
    // For popup route issues, we can suggest fixes to the routing configuration
    // In a real implementation, we might modify App.tsx to fix routing issues
    
    // For demonstration, we'll just log suggestions
    const routeIssue = issue as RouteTestResult;
    
    if (routeIssue.status === 404) {
      const fixPrompt = `
      Analyze this 404 error for a popup route and suggest a specific fix:
      
      Route: ${routeIssue.route}
      Status: ${routeIssue.status}
      Message: ${routeIssue.message}
      
      Suggest a fix that addresses potential issues in React routing for this popup. 
      Provide the exact code that needs to be added to App.tsx to fix this missing route.
      
      Response should be valid and properly formatted code for a route definition in the Wouter router.
      `;
      
      const fixSuggestion = await generateText(fixPrompt, {
        model: 'grok-3-mini',
        temperature: 0.2
      });
      
      // Update the issue with the fix suggestion
      issue.fixDetails = fixSuggestion;
      
      // Log the suggestion to bug report
      await this.logBugReport('RouterFix', 
        `Fix suggestion for ${routeIssue.route}`, 
        { suggestion: fixSuggestion }, 
        'medium',
        true // This is a fix recommendation
      );
      
      // We're not actually applying the fix automatically here, just suggesting it
      return false;
    }
    
    return false;
  }
  
  /**
   * Fix issues identified from logs
   */
  private async fixLoggedIssue(issue: TestResult): Promise<boolean> {
    // For log-based issues, we can suggest fixes but can't apply them automatically in most cases
    
    if (!issue.details) return false;
    
    // Check if it's a simple issue that we can handle
    const isApiError = issue.message.includes('API') || 
                      (issue.details.possibleCause && issue.details.possibleCause.includes('API'));
    
    const isCssIssue = issue.message.includes('CSS') || issue.message.includes('style') || 
                      (issue.details.possibleCause && issue.details.possibleCause.includes('CSS'));
    
    if (isCssIssue) {
      // For CSS issues, we could potentially generate a fix and add it to a css override file
      issue.fixDetails = "CSS issue identified. Consider adding a CSS override in the theme configuration.";
      
      // Log as a fix recommendation
      await this.logBugReport('CSSFix', 
        `CSS issue: ${issue.message}`, 
        { recommendation: issue.details.recommendedFix || 'Review CSS and apply appropriate fixes' }, 
        'low',
        true // This is a fix recommendation
      );
      
      // We're not actually applying the fix automatically, just suggesting it
      return false;
    }
    
    if (isApiError) {
      issue.fixDetails = "API error identified. Check API endpoints and credentials.";
      
      // Log as a fix recommendation
      await this.logBugReport('APIFix', 
        `API issue: ${issue.message}`, 
        { recommendation: issue.details.recommendedFix || 'Verify API configuration and error handling' }, 
        'medium',
        true // This is a fix recommendation
      );
      
      return false;
    }
    
    return false;
  }
  
  /**
   * Fix content-related issues
   */
  private async fixContentIssue(issue: TestResult): Promise<boolean> {
    // For content issues, we can suggest improvements 
    
    if (issue.category === 'portfolio' && issue.message.includes('invalid structure')) {
      issue.fixDetails = "Portfolio data structure issues detected. Ensure each portfolio item has id, title, and description fields.";
      
      // Log as a fix recommendation
      await this.logBugReport('DataStructureFix', 
        `Portfolio data structure issue`, 
        { recommendation: 'Update portfolio item schema to include required fields' }, 
        'medium',
        true // This is a fix recommendation
      );
      
      return false;
    }
    
    if (issue.category === 'landing-page' && issue.message.includes('missing key elements')) {
      issue.fixDetails = "Landing page is missing key elements. Ensure the page has a header, footer, and call-to-action buttons.";
      
      // Log as a fix recommendation
      await this.logBugReport('LandingPageFix', 
        `Landing page missing elements`, 
        { recommendation: 'Add missing UI components to the landing page' }, 
        'medium',
        true // This is a fix recommendation
      );
      
      return false;
    }
    
    return false;
  }
  
  /**
   * Log a bug report to the database and the log file
   */
  private async logBugReport(
    source: string, 
    title: string, 
    details: any, 
    severity: 'low' | 'medium' | 'high' | 'critical',
    isFix: boolean = false
  ): Promise<void> {
    try {
      // First log to the database
      await db.insert(bug_reports).values({
        source,
        title,
        description: typeof details === 'string' ? details : JSON.stringify(details, null, 2),
        severity,
        status: isFix ? 'fix_suggested' : 'open',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Then append to the log file
      const logEntry = `
[${new Date().toISOString()}] ${severity.toUpperCase()}: ${title}
Source: ${source}
${isFix ? '[FIX SUGGESTION]' : ''}
Details: ${typeof details === 'string' ? details : JSON.stringify(details, null, 2)}
-------------------
`;
      
      fs.appendFileSync(this.logFilePath, logEntry);
    } catch (error) {
      console.error('Error logging bug report:', error);
    }
  }
  
  /**
   * Generate a test report from the results
   */
  private generateTestReport(): TestSuiteResult {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    const passedTests = this.testResults.filter(result => result.success).length;
    const failedTests = this.testResults.length - passedTests;
    const criticalIssues = this.testResults.filter(result => !result.success && result.severity === 'critical').length;
    
    const report: TestSuiteResult = {
      timestamp: new Date().toISOString(),
      totalTests: this.testResults.length,
      passedTests,
      failedTests,
      criticalIssues,
      testResults: this.testResults,
      fixedIssues: this.fixedIssues,
      totalFixAttempts: this.fixAttempts
    };
    
    // Log a summary to the console
    console.log(`
Test Suite Completed in ${(duration / 1000).toFixed(2)} seconds
-----------------------------------------------------
Total Tests:     ${report.totalTests}
Passed:          ${report.passedTests}
Failed:          ${report.failedTests}
Critical Issues: ${report.criticalIssues}
Fixed Issues:    ${report.fixedIssues}/${report.totalFixAttempts} attempts
`);
    
    // Also save the full report to a file
    const reportPath = `test-report-${new Date().toISOString().replace(/:/g, '-')}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Full test report saved to: ${reportPath}`);
    
    return report;
  }
}

// Export a singleton instance for convenience
export const tester = new ComprehensiveTester();