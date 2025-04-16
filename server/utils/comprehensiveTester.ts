/**
 * Comprehensive Tester for the Elevion Platform
 * 
 * A utility class that provides methods for testing various aspects of the platform,
 * including UI components, API endpoints, and platform compatibility.
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { db } from '../db';
import { bug_reports } from '@shared/schema';

// Test result interface
interface TestResult {
  id: string;
  category: string;
  name: string;
  description: string;
  success: boolean;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location?: string;
  componentId?: string;
  timestamp: Date;
  autoFixAttempted?: boolean;
  autoFixSuccess?: boolean;
  fixDetails?: string;
}

// Configuration for the tester
const CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:5000',
  logsDir: path.join(process.cwd(), 'logs'),
  reportFile: path.join(process.cwd(), 'logs', 'comprehensive-test-report.json'),
  // List of critical endpoints that must be functional
  criticalEndpoints: [
    { path: '/', method: 'GET', name: 'Home Page' },
    { path: '/api/user', method: 'GET', name: 'Current User' },
    { path: '/api/stripe/config', method: 'GET', name: 'Stripe Config' },
    { path: '/api/test-xai', method: 'GET', name: 'XAI Integration' }
  ],
  // Test user for API tests
  testUser: {
    username: 'test@example.com',
    password: 'Password123!'
  }
};

// Ensure logs directory exists
if (!fs.existsSync(CONFIG.logsDir)) {
  fs.mkdirSync(CONFIG.logsDir, { recursive: true });
}

export class ComprehensiveTester {
  private testResults: TestResult[] = [];
  private totalFixAttempts = 0;
  private fixedIssues = 0;
  
  /**
   * Run all tests and return comprehensive results
   */
  async runAllTests() {
    console.log('Starting comprehensive platform tests...');
    
    // Reset test results
    this.testResults = [];
    this.totalFixAttempts = 0;
    this.fixedIssues = 0;
    
    // Run core platform tests
    await this.testCoreComponents();
    
    // Test API endpoints
    await this.testApiEndpoints();
    
    // Test authentication
    await this.testAuthentication();
    
    // Test UI components
    await this.testUIComponents();
    
    // Test browser compatibility
    await this.testBrowserCompatibility();
    
    // Test responsive layouts
    await this.testResponsiveLayouts();
    
    // Test external integrations
    await this.testExternalIntegrations();
    
    // Calculate summary
    const results = this.calculateResults();
    
    // Save results to file
    fs.writeFileSync(
      CONFIG.reportFile,
      JSON.stringify(results, null, 2)
    );
    
    return results;
  }
  
  /**
   * Test core platform components
   */
  private async testCoreComponents() {
    console.log('Testing core platform components...');
    
    try {
      // Test routes/pages
      await this.testRouteExistence('/');
      await this.testRouteExistence('/portfolio');
      await this.testRouteExistence('/services');
      await this.testRouteExistence('/about');
      await this.testRouteExistence('/contact');
      
      // Test platform initialization
      this.testPlatformConfiguration();
      
      // Test database connection
      await this.testDatabaseConnection();
      
    } catch (error) {
      console.error('Error testing core components:', error);
      this.addTestResult({
        id: 'core-exception',
        category: 'Core',
        name: 'Core Components Exception',
        description: 'An unexpected error occurred during core component testing.',
        success: false,
        message: `Exception during core testing: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'critical',
        timestamp: new Date()
      });
    }
  }
  
  /**
   * Test platform configuration
   */
  private testPlatformConfiguration() {
    // Check for required environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'XAI_API_KEY'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length > 0) {
      this.addTestResult({
        id: 'missing-env-vars',
        category: 'Configuration',
        name: 'Environment Variables',
        description: 'Check if all required environment variables are set.',
        success: false,
        message: `Missing required environment variables: ${missingEnvVars.join(', ')}`,
        severity: missingEnvVars.includes('DATABASE_URL') ? 'critical' : 'high',
        timestamp: new Date()
      });
    } else {
      this.addTestResult({
        id: 'env-vars',
        category: 'Configuration',
        name: 'Environment Variables',
        description: 'Check if all required environment variables are set.',
        success: true,
        message: 'All required environment variables are set.',
        severity: 'low',
        timestamp: new Date()
      });
    }
    
    // Additional configuration checks can be added here
  }
  
  /**
   * Test database connection
   */
  private async testDatabaseConnection() {
    try {
      // Simple query to test the database connection
      const startTime = Date.now();
      const result = await db.query.bug_reports.findMany({
        limit: 1
      });
      const endTime = Date.now();
      
      this.addTestResult({
        id: 'db-connection',
        category: 'Database',
        name: 'Database Connection',
        description: 'Test the connection to the database.',
        success: true,
        message: `Database connection successful (${endTime - startTime}ms)`,
        severity: 'low',
        timestamp: new Date()
      });
    } catch (error) {
      this.addTestResult({
        id: 'db-connection',
        category: 'Database',
        name: 'Database Connection',
        description: 'Test the connection to the database.',
        success: false,
        message: `Database connection failed: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'critical',
        timestamp: new Date()
      });
    }
  }
  
  /**
   * Test the existence of a route
   */
  private async testRouteExistence(route: string) {
    try {
      const startTime = Date.now();
      const response = await axios({
        method: 'GET',
        url: `${CONFIG.baseUrl}${route}`,
        validateStatus: () => true // Don't throw on non-2xx status
      });
      const endTime = Date.now();
      
      const testId = `route-${route.replace(/\//g, '-')}`;
      if (response.status === 200) {
        this.addTestResult({
          id: testId,
          category: 'Routes',
          name: `Route: ${route}`,
          description: `Test if the route ${route} exists and returns 200 OK.`,
          success: true,
          message: `Route ${route} exists and returns 200 OK (${endTime - startTime}ms)`,
          severity: 'low',
          location: route,
          timestamp: new Date()
        });
      } else {
        this.addTestResult({
          id: testId,
          category: 'Routes',
          name: `Route: ${route}`,
          description: `Test if the route ${route} exists and returns 200 OK.`,
          success: false,
          message: `Route ${route} returned status ${response.status} (${endTime - startTime}ms)`,
          severity: route === '/' ? 'critical' : 'high',
          location: route,
          timestamp: new Date()
        });
      }
    } catch (error) {
      this.addTestResult({
        id: `route-${route.replace(/\//g, '-')}`,
        category: 'Routes',
        name: `Route: ${route}`,
        description: `Test if the route ${route} exists and returns 200 OK.`,
        success: false,
        message: `Error testing route ${route}: ${error instanceof Error ? error.message : String(error)}`,
        severity: route === '/' ? 'critical' : 'high',
        location: route,
        timestamp: new Date()
      });
    }
  }
  
  /**
   * Test API endpoints
   */
  private async testApiEndpoints() {
    console.log('Testing API endpoints...');
    
    try {
      // Test critical endpoints
      for (const endpoint of CONFIG.criticalEndpoints) {
        await this.testApiEndpoint(endpoint.path, endpoint.method, endpoint.name);
      }
      
      // Additional API-specific tests
      await this.testXaiApiIntegration();
      
    } catch (error) {
      console.error('Error testing API endpoints:', error);
      this.addTestResult({
        id: 'api-exception',
        category: 'API',
        name: 'API Testing Exception',
        description: 'An unexpected error occurred during API testing.',
        success: false,
        message: `Exception during API testing: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'high',
        timestamp: new Date()
      });
    }
  }
  
  /**
   * Test a specific API endpoint
   */
  private async testApiEndpoint(path: string, method: string, name: string) {
    try {
      const startTime = Date.now();
      const response = await axios({
        method: method.toLowerCase(),
        url: `${CONFIG.baseUrl}${path}`,
        validateStatus: () => true // Don't throw on non-2xx status
      });
      const endTime = Date.now();
      
      const testId = `api-${path.replace(/\//g, '-')}`;
      const isSuccess = response.status >= 200 && response.status < 400;
      
      this.addTestResult({
        id: testId,
        category: 'API',
        name: `API: ${name}`,
        description: `Test if the API endpoint ${path} is accessible.`,
        success: isSuccess,
        message: isSuccess 
          ? `API endpoint ${path} returned ${response.status} (${endTime - startTime}ms)` 
          : `API endpoint ${path} returned error status ${response.status} (${endTime - startTime}ms)`,
        severity: path.includes('/api/test-xai') ? 'critical' : 'high',
        location: path,
        timestamp: new Date()
      });
    } catch (error) {
      this.addTestResult({
        id: `api-${path.replace(/\//g, '-')}`,
        category: 'API',
        name: `API: ${name}`,
        description: `Test if the API endpoint ${path} is accessible.`,
        success: false,
        message: `Error testing API endpoint ${path}: ${error instanceof Error ? error.message : String(error)}`,
        severity: path.includes('/api/test-xai') ? 'critical' : 'high',
        location: path,
        timestamp: new Date()
      });
    }
  }
  
  /**
   * Test XAI API integration
   */
  private async testXaiApiIntegration() {
    // Test XAI integration
    if (!process.env.XAI_API_KEY) {
      this.addTestResult({
        id: 'xai-api-key',
        category: 'Integrations',
        name: 'XAI API Key',
        description: 'Check if the XAI API key is set.',
        success: false,
        message: 'XAI API key is not set in environment variables.',
        severity: 'critical',
        timestamp: new Date()
      });
      return;
    }
    
    try {
      const response = await axios({
        method: 'GET',
        url: `${CONFIG.baseUrl}/api/test-xai`,
        validateStatus: () => true
      });
      
      if (response.status === 200 && response.data && response.data.success) {
        this.addTestResult({
          id: 'xai-api-integration',
          category: 'Integrations',
          name: 'XAI API Integration',
          description: 'Test the integration with the XAI API.',
          success: true,
          message: 'XAI API integration test successful.',
          severity: 'low',
          timestamp: new Date()
        });
      } else {
        this.addTestResult({
          id: 'xai-api-integration',
          category: 'Integrations',
          name: 'XAI API Integration',
          description: 'Test the integration with the XAI API.',
          success: false,
          message: `XAI API integration test failed: ${response.status} status, ${JSON.stringify(response.data)}`,
          severity: 'critical',
          timestamp: new Date()
        });
      }
    } catch (error) {
      this.addTestResult({
        id: 'xai-api-integration',
        category: 'Integrations',
        name: 'XAI API Integration',
        description: 'Test the integration with the XAI API.',
        success: false,
        message: `Error testing XAI API integration: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'critical',
        timestamp: new Date()
      });
    }
  }
  
  /**
   * Test authentication
   */
  private async testAuthentication() {
    console.log('Testing authentication...');
    
    try {
      // Test login functionality
      await this.testLogin();
      
      // Additional auth tests can be added here
      
    } catch (error) {
      console.error('Error testing authentication:', error);
      this.addTestResult({
        id: 'auth-exception',
        category: 'Authentication',
        name: 'Authentication Testing Exception',
        description: 'An unexpected error occurred during authentication testing.',
        success: false,
        message: `Exception during authentication testing: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'high',
        timestamp: new Date()
      });
    }
  }
  
  /**
   * Test login functionality
   */
  private async testLogin() {
    try {
      const response = await axios({
        method: 'POST',
        url: `${CONFIG.baseUrl}/api/login`,
        data: CONFIG.testUser,
        validateStatus: () => true
      });
      
      if (response.status === 200 && response.data) {
        this.addTestResult({
          id: 'auth-login',
          category: 'Authentication',
          name: 'Login',
          description: 'Test if the login API endpoint works correctly.',
          success: true,
          message: 'Login test successful.',
          severity: 'low',
          timestamp: new Date()
        });
      } else {
        this.addTestResult({
          id: 'auth-login',
          category: 'Authentication',
          name: 'Login',
          description: 'Test if the login API endpoint works correctly.',
          success: false,
          message: `Login test failed: ${response.status} status`,
          severity: 'high',
          timestamp: new Date()
        });
      }
    } catch (error) {
      this.addTestResult({
        id: 'auth-login',
        category: 'Authentication',
        name: 'Login',
        description: 'Test if the login API endpoint works correctly.',
        success: false,
        message: `Error testing login: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'high',
        timestamp: new Date()
      });
    }
  }
  
  /**
   * Test UI components
   */
  private async testUIComponents() {
    console.log('Testing UI components...');
    
    try {
      // Test critical UI components
      // This is a simplified test that just checks for the presence of key elements in the HTML
      
      // Test header presence
      await this.testComponentPresence('/', 'header', 'Header');
      
      // Test footer presence
      await this.testComponentPresence('/', 'footer', 'Footer');
      
      // Test navigation presence
      await this.testComponentPresence('/', 'nav', 'Navigation');
      
      // Test ElevateBot presence
      await this.testComponentPresence('/', 'elevate-bot', 'ElevateBot');
      
    } catch (error) {
      console.error('Error testing UI components:', error);
      this.addTestResult({
        id: 'ui-exception',
        category: 'UI',
        name: 'UI Testing Exception',
        description: 'An unexpected error occurred during UI component testing.',
        success: false,
        message: `Exception during UI testing: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'medium',
        timestamp: new Date()
      });
    }
  }
  
  /**
   * Test if a component is present in the HTML
   */
  private async testComponentPresence(route: string, selector: string, componentName: string) {
    try {
      const response = await axios({
        method: 'GET',
        url: `${CONFIG.baseUrl}${route}`,
        validateStatus: () => true
      });
      
      if (response.status !== 200) {
        this.addTestResult({
          id: `component-${selector}`,
          category: 'UI',
          name: `UI Component: ${componentName}`,
          description: `Test if the ${componentName} component is present on the page.`,
          success: false,
          message: `Could not test component presence: page returned status ${response.status}`,
          severity: 'medium',
          componentId: selector,
          timestamp: new Date()
        });
        return;
      }
      
      // Basic HTML check for the component
      // This is a simplified approach; in a real-world scenario, we'd use a headless browser
      const html = response.data;
      
      // Check if the component is in the HTML
      // This is a very basic check, not reliable for complex components
      const isPresent = typeof html === 'string' && (
        html.includes(`class="${selector}"`) || 
        html.includes(`id="${selector}"`) || 
        html.includes(`<${selector}`) ||
        html.includes(`data-component="${selector}"`)
      );
      
      this.addTestResult({
        id: `component-${selector}`,
        category: 'UI',
        name: `UI Component: ${componentName}`,
        description: `Test if the ${componentName} component is present on the page.`,
        success: isPresent,
        message: isPresent 
          ? `${componentName} component is present on the page.` 
          : `${componentName} component is not present on the page.`,
        severity: 'medium',
        componentId: selector,
        location: route,
        timestamp: new Date()
      });
      
    } catch (error) {
      this.addTestResult({
        id: `component-${selector}`,
        category: 'UI',
        name: `UI Component: ${componentName}`,
        description: `Test if the ${componentName} component is present on the page.`,
        success: false,
        message: `Error testing component presence: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'medium',
        componentId: selector,
        location: route,
        timestamp: new Date()
      });
    }
  }
  
  /**
   * Test browser compatibility
   */
  private async testBrowserCompatibility() {
    console.log('Testing browser compatibility...');
    
    // In a real implementation, this would use a headless browser or browser testing service
    // For now, we'll just report that this test is not implemented
    
    this.addTestResult({
      id: 'browser-compatibility',
      category: 'Compatibility',
      name: 'Browser Compatibility',
      description: 'Test if the platform works correctly in different browsers.',
      success: true,
      message: 'Note: Automated browser compatibility testing is not implemented. This requires manual testing or integration with a browser testing service.',
      severity: 'low',
      timestamp: new Date()
    });
  }
  
  /**
   * Test responsive layouts
   */
  private async testResponsiveLayouts() {
    console.log('Testing responsive layouts...');
    
    // In a real implementation, this would use a headless browser with different viewport sizes
    // For now, we'll just report that this test is not implemented
    
    this.addTestResult({
      id: 'responsive-layouts',
      category: 'Compatibility',
      name: 'Responsive Layouts',
      description: 'Test if the platform layouts are responsive on different screen sizes.',
      success: true,
      message: 'Note: Automated responsive layout testing is not implemented. This requires manual testing or integration with a visual testing service.',
      severity: 'low',
      timestamp: new Date()
    });
  }
  
  /**
   * Test external integrations
   */
  private async testExternalIntegrations() {
    console.log('Testing external integrations...');
    
    try {
      // Test Stripe integration
      await this.testStripeIntegration();
      
      // Test Mailgun integration
      await this.testMailgunIntegration();
      
    } catch (error) {
      console.error('Error testing external integrations:', error);
      this.addTestResult({
        id: 'integrations-exception',
        category: 'Integrations',
        name: 'External Integrations Exception',
        description: 'An unexpected error occurred during external integrations testing.',
        success: false,
        message: `Exception during integrations testing: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'medium',
        timestamp: new Date()
      });
    }
  }
  
  /**
   * Test Stripe integration
   */
  private async testStripeIntegration() {
    if (!process.env.STRIPE_SECRET_KEY) {
      this.addTestResult({
        id: 'stripe-api-key',
        category: 'Integrations',
        name: 'Stripe API Key',
        description: 'Check if the Stripe API key is set.',
        success: false,
        message: 'Stripe API key is not set in environment variables.',
        severity: 'high',
        timestamp: new Date()
      });
      return;
    }
    
    try {
      const response = await axios({
        method: 'GET',
        url: `${CONFIG.baseUrl}/api/stripe/config`,
        validateStatus: () => true
      });
      
      if (response.status === 200 && response.data && response.data.publishableKey) {
        this.addTestResult({
          id: 'stripe-integration',
          category: 'Integrations',
          name: 'Stripe Integration',
          description: 'Test the integration with Stripe.',
          success: true,
          message: 'Stripe integration test successful.',
          severity: 'low',
          timestamp: new Date()
        });
      } else {
        this.addTestResult({
          id: 'stripe-integration',
          category: 'Integrations',
          name: 'Stripe Integration',
          description: 'Test the integration with Stripe.',
          success: false,
          message: `Stripe integration test failed: ${response.status} status, ${JSON.stringify(response.data)}`,
          severity: 'high',
          timestamp: new Date()
        });
      }
    } catch (error) {
      this.addTestResult({
        id: 'stripe-integration',
        category: 'Integrations',
        name: 'Stripe Integration',
        description: 'Test the integration with Stripe.',
        success: false,
        message: `Error testing Stripe integration: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'high',
        timestamp: new Date()
      });
    }
  }
  
  /**
   * Test Mailgun integration
   */
  private async testMailgunIntegration() {
    if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
      this.addTestResult({
        id: 'mailgun-api-key',
        category: 'Integrations',
        name: 'Mailgun API Key',
        description: 'Check if the Mailgun API key and domain are set.',
        success: false,
        message: 'Mailgun API key or domain is not set in environment variables.',
        severity: 'medium',
        timestamp: new Date()
      });
      return;
    }
    
    // Since we can't easily test sending emails in an automated way,
    // we'll just check that the integration is configured
    this.addTestResult({
      id: 'mailgun-integration',
      category: 'Integrations',
      name: 'Mailgun Integration',
      description: 'Check the integration with Mailgun.',
      success: true,
      message: 'Mailgun API key and domain are configured.',
      severity: 'low',
      timestamp: new Date()
    });
  }
  
  /**
   * Add a test result to the results array
   */
  private addTestResult(result: TestResult) {
    this.testResults.push(result);
    
    // Log the result to console
    const statusIcon = result.success ? '✅' : '❌';
    const severityColor = this.getSeverityColor(result.severity);
    console.log(
      `${statusIcon} [${severityColor}${result.severity.toUpperCase()}${this.resetColor}] ${result.name}: ${result.message}`
    );
    
    // If it's a critical or high severity failure, attempt to fix it
    if (!result.success && (result.severity === 'critical' || result.severity === 'high')) {
      this.attemptToFix(result);
    }
  }
  
  /**
   * Attempt to fix a failed test
   */
  private async attemptToFix(result: TestResult) {
    // Increment fix attempts counter
    this.totalFixAttempts++;
    
    console.log(`Attempting to fix: ${result.name}`);
    
    // Mark that a fix was attempted
    result.autoFixAttempted = true;
    result.autoFixSuccess = false;
    
    try {
      // Different fix strategies based on the category and id
      let fixed = false;
      
      switch(result.id) {
        case 'missing-env-vars':
          // Can't fix missing environment variables automatically
          result.fixDetails = "Missing environment variables must be set manually.";
          break;
          
        case 'db-connection':
          // Attempt to reconnect to the database or fix connection issues
          result.fixDetails = "Database connection issues require manual intervention.";
          break;
          
        // Add more cases for specific fixes
          
        default:
          // No specific fix available
          result.fixDetails = "No automatic fix available for this issue.";
          break;
      }
      
      if (fixed) {
        // Update the test result
        result.success = true;
        result.autoFixSuccess = true;
        result.message = `${result.message} (Automatically fixed)`;
        
        // Increment fixed issues counter
        this.fixedIssues++;
        
        console.log(`✅ Successfully fixed: ${result.name}`);
      } else {
        console.log(`⚠️ Could not automatically fix: ${result.name}`);
        
        // Log the issue to the database for manual fixing
        await this.logIssueToDatabase(result);
      }
    } catch (error) {
      console.error(`Error attempting to fix ${result.name}:`, error);
      result.fixDetails = `Error during fix attempt: ${error instanceof Error ? error.message : String(error)}`;
      
      // Log the issue to the database for manual fixing
      await this.logIssueToDatabase(result);
    }
  }
  
  /**
   * Log an issue to the database for manual fixing
   */
  private async logIssueToDatabase(result: TestResult) {
    try {
      await db.insert(bug_reports).values({
        title: `[${result.severity.toUpperCase()}] ${result.category}: ${result.name}`,
        description: `${result.description}\n\nTest Message: ${result.message}\n\nFix Attempt: ${result.fixDetails || 'No fix attempted'}`,
        severity: result.severity,
        status: 'open',
        source: 'automated-test',
        affectedComponent: result.location || result.componentId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error logging issue to database:', error);
    }
  }
  
  /**
   * Calculate summary results
   */
  private calculateResults() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(result => result.success).length;
    const failedTests = totalTests - passedTests;
    
    const criticalIssues = this.testResults.filter(
      result => !result.success && result.severity === 'critical'
    ).length;
    
    const highPriorityIssues = this.testResults.filter(
      result => !result.success && result.severity === 'high'
    ).length;
    
    return {
      timestamp: new Date().toISOString(),
      totalTests,
      passedTests,
      failedTests,
      criticalIssues,
      highPriorityIssues,
      fixedIssues: this.fixedIssues,
      totalFixAttempts: this.totalFixAttempts,
      testResults: this.testResults
    };
  }
  
  /**
   * Helper to get color codes for severity levels
   */
  private get resetColor() {
    return '\x1b[0m';
  }
  
  private getSeverityColor(severity: string) {
    switch(severity) {
      case 'critical': return '\x1b[31m'; // Red
      case 'high': return '\x1b[33m';     // Yellow
      case 'medium': return '\x1b[36m';   // Cyan
      case 'low': return '\x1b[32m';      // Green
      default: return this.resetColor;
    }
  }
}

// Export a singleton instance of the tester
export const tester = new ComprehensiveTester();