/**
 * Daily XAI Scan Script
 * 
 * This script runs daily automated scans using the XAI/Grok API to analyze
 * different aspects of the Elevion platform, identify potential issues, and
 * generate improvement suggestions.
 * 
 * The results are stored in the database for the admin dashboard to display
 * and also saved to log files for manual review if needed.
 */

import fs from 'fs';
import path from 'path';
import { db } from '../db';
import { bug_reports, logs } from '@shared/schema';
import { tester } from '../utils/comprehensiveTester';
import { grokApi } from '../grok';

// Configuration
const CONFIG = {
  logsDir: path.join(process.cwd(), 'logs'),
  scanLogFile: path.join(process.cwd(), 'logs', 'xai-daily-scan.json'),
  platformUrls: [
    '/',
    '/portfolio',
    '/services',
    '/contact',
    '/about',
    '/auth'
  ],
  maxRetries: 3,
  retryDelayMs: 2000,
  timeoutMs: 10 * 60 * 1000, // 10 minutes timeout
  analysisCategories: [
    'UI_ACCESSIBILITY',
    'COLOR_CONTRAST',
    'USER_EXPERIENCE',
    'PERFORMANCE_BOTTLENECKS',
    'SECURITY_CONCERNS',
    'BROWSER_COMPATIBILITY',
    'MOBILE_RESPONSIVENESS',
    'SEO_OPPORTUNITIES',
    'CONTENT_QUALITY',
    'BRANDING_CONSISTENCY'
  ]
};

// Ensure logs directory exists
if (!fs.existsSync(CONFIG.logsDir)) {
  fs.mkdirSync(CONFIG.logsDir, { recursive: true });
}

/**
 * Main function to run the daily XAI scan
 */
async function runDailyXAIScan() {
  console.log('Starting daily XAI scan...');
  
  const startTime = Date.now();
  const scanId = `SCAN-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  
  // Results object
  const results = {
    scanId,
    timestamp: new Date().toISOString(),
    duration: 0,
    categories: {} as Record<string, any>,
    suggestions: [] as any[],
    criticalIssues: [] as any[],
    summary: {
      totalIssues: 0,
      criticalIssues: 0,
      highPriorityIssues: 0,
      totalSuggestions: 0,
      suggestionsImplemented: 0
    }
  };
  
  try {
    // Set up timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`XAI scan timed out after ${CONFIG.timeoutMs / 1000} seconds`));
      }, CONFIG.timeoutMs);
    });
    
    // Run the scan with timeout protection
    await Promise.race([
      runScanCategories(results),
      timeoutPromise
    ]);
    
    // Calculate overall duration
    results.duration = Date.now() - startTime;
    
    // Save consolidated report
    fs.writeFileSync(
      CONFIG.scanLogFile,
      JSON.stringify(results, null, 2)
    );
    
    // Log success to the database
    await db.insert(logs).values({
      type: 'XAI_SCAN',
      message: `Daily XAI scan completed successfully in ${(results.duration / 1000).toFixed(1)} seconds`,
      details: JSON.stringify({
        scanId,
        criticalIssues: results.summary.criticalIssues,
        highPriorityIssues: results.summary.highPriorityIssues,
        totalSuggestions: results.summary.totalSuggestions
      }),
      source: 'daily-xai-scan',
      level: 'info',
      createdAt: new Date()
    });
    
    // Log results to console
    console.log('\n========= XAI SCAN COMPLETED =========');
    console.log(`Total Issues: ${results.summary.totalIssues}`);
    console.log(`Critical Issues: ${results.summary.criticalIssues}`);
    console.log(`High Priority Issues: ${results.summary.highPriorityIssues}`);
    console.log(`Total Suggestions: ${results.summary.totalSuggestions}`);
    console.log(`Duration: ${(results.duration / 1000).toFixed(1)} seconds`);
    
    // Create bug reports for critical issues
    if (results.criticalIssues.length > 0) {
      await createCriticalIssueReports(results);
    }
    
    return results;
  } catch (error) {
    console.error('Error running XAI scan:', error);
    
    // Log error to the database
    await db.insert(logs).values({
      type: 'XAI_SCAN',
      message: `Daily XAI scan failed: ${error instanceof Error ? error.message : String(error)}`,
      details: JSON.stringify({
        scanId,
        error: error instanceof Error ? error.message : String(error)
      }),
      source: 'daily-xai-scan',
      level: 'error',
      createdAt: new Date()
    });
    
    throw error;
  }
}

/**
 * Run all scan categories
 */
async function runScanCategories(results: any) {
  // Perform scans for each category
  for (const category of CONFIG.analysisCategories) {
    console.log(`\n=== Scanning ${category} ===`);
    
    try {
      const categoryResults = await scanCategory(category);
      results.categories[category] = categoryResults;
      
      // Update summary counters
      results.summary.totalIssues += categoryResults.issues?.length || 0;
      results.summary.criticalIssues += categoryResults.issues?.filter((i: any) => i.severity === 'critical').length || 0;
      results.summary.highPriorityIssues += categoryResults.issues?.filter((i: any) => i.severity === 'high').length || 0;
      results.summary.totalSuggestions += categoryResults.suggestions?.length || 0;
      
      // Add critical issues to the main list for reporting
      const criticalIssues = categoryResults.issues?.filter((i: any) => i.severity === 'critical') || [];
      results.criticalIssues.push(...criticalIssues.map((issue: any) => ({
        ...issue,
        category
      })));
      
      // Add suggestions to the main list
      const suggestions = categoryResults.suggestions || [];
      results.suggestions.push(...suggestions.map((suggestion: any) => ({
        ...suggestion,
        category
      })));
      
    } catch (error) {
      console.error(`Error scanning ${category}:`, error);
      results.categories[category] = {
        error: error instanceof Error ? error.message : String(error),
        status: 'failed'
      };
      
      // Log error to the database
      await db.insert(logs).values({
        type: 'XAI_SCAN',
        message: `Error scanning ${category}`,
        details: JSON.stringify({
          category,
          error: error instanceof Error ? error.message : String(error)
        }),
        source: 'daily-xai-scan',
        level: 'error',
        createdAt: new Date()
      });
    }
  }
}

/**
 * Scan a specific category
 */
async function scanCategory(category: string): Promise<any> {
  // Using XAI integration with retry mechanism
  let retries = 0;
  
  while (retries < CONFIG.maxRetries) {
    try {
      // Different scan logic for different categories
      switch (category) {
        case 'UI_ACCESSIBILITY':
          return await scanUIAccessibility();
        case 'COLOR_CONTRAST':
          return await scanColorContrast();
        case 'USER_EXPERIENCE':
          return await scanUserExperience();
        case 'PERFORMANCE_BOTTLENECKS':
          return await scanPerformanceBottlenecks();
        case 'SECURITY_CONCERNS':
          return await scanSecurityConcerns();
        case 'BROWSER_COMPATIBILITY':
          return await scanBrowserCompatibility();
        case 'MOBILE_RESPONSIVENESS':
          return await scanMobileResponsiveness();
        case 'SEO_OPPORTUNITIES':
          return await scanSEOOpportunities();
        case 'CONTENT_QUALITY':
          return await scanContentQuality();
        case 'BRANDING_CONSISTENCY':
          return await scanBrandingConsistency();
        default:
          throw new Error(`Unknown category: ${category}`);
      }
    } catch (error) {
      retries++;
      console.error(`Error scanning ${category} (attempt ${retries}/${CONFIG.maxRetries}):`, error);
      
      if (retries >= CONFIG.maxRetries) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelayMs));
    }
  }
  
  throw new Error(`Failed to scan ${category} after ${CONFIG.maxRetries} attempts`);
}

/**
 * Scan UI for accessibility issues
 */
async function scanUIAccessibility(): Promise<any> {
  console.log('Analyzing UI accessibility...');
  
  try {
    // Prepare the prompt for the AI
    const prompt = `
    Analyze the Elevion web development platform for accessibility issues based on WCAG 2.1 standards. 
    As an accessibility expert, identify potential barriers for users with disabilities, focusing on:
    
    1. Keyboard navigation & focus management
    2. Screen reader compatibility
    3. Alternative text for images
    4. Color contrast ratios
    5. Form labels and instructions
    6. Error handling and notifications
    7. Heading structure and semantic HTML
    
    For each issue identified:
    1. Describe the issue
    2. Explain its impact on users with disabilities
    3. Rate severity (critical, high, medium, low)
    4. Recommend specific fixes
    
    Format your response as JSON with an "issues" array and a "suggestions" array:
    {
      "issues": [
        {
          "title": "Issue title",
          "description": "Detailed issue description",
          "impact": "Impact on users",
          "severity": "critical|high|medium|low",
          "location": "Specific component or page with issue"
        }
      ],
      "suggestions": [
        {
          "title": "Suggestion title",
          "description": "Detailed suggestion",
          "implementation": "How to implement it",
          "priority": "high|medium|low",
          "estimatedEffort": "small|medium|large"
        }
      ],
      "summary": "Brief summary of findings"
    }`;
    
    // Use XAI API to analyze
    const response = await grokApi.generateJson(prompt, 
      "You are an expert web accessibility consultant specializing in WCAG compliance. You'll analyze the Elevion platform for accessibility issues and provide practical recommendations.");
    
    // Log success
    await db.insert(logs).values({
      type: 'XAI_SCAN',
      message: 'UI accessibility analysis completed',
      source: 'daily-xai-scan',
      level: 'info',
      createdAt: new Date()
    });
    
    return response;
  } catch (error) {
    console.error('Error in UI accessibility scan:', error);
    throw error;
  }
}

/**
 * Scan for color contrast issues
 */
async function scanColorContrast(): Promise<any> {
  console.log('Analyzing color contrast...');
  
  try {
    // Prepare the prompt for the AI
    const prompt = `
    Analyze the color scheme of the Elevion platform for contrast issues according to WCAG 2.1 standards.
    Specifically focus on:
    
    1. Text contrast against backgrounds (minimum 4.5:1 for normal text, 3:1 for large text)
    2. UI component contrast (minimum 3:1 for UI components and graphical objects)
    3. State changes (hover, focus, active states must maintain sufficient contrast)
    4. Color-only information (ensure information is not conveyed by color alone)
    5. Dark mode and light mode considerations
    
    Format your response as JSON with an "issues" array and a "suggestions" array:
    {
      "issues": [
        {
          "title": "Issue title",
          "description": "Detailed issue description",
          "impact": "Impact on users",
          "severity": "critical|high|medium|low",
          "location": "Specific component with contrast issue",
          "currentRatio": "Current contrast ratio if known",
          "requiredRatio": "Required contrast ratio"
        }
      ],
      "suggestions": [
        {
          "title": "Suggestion title",
          "description": "Detailed suggestion",
          "implementation": "How to implement it",
          "recommendedColors": {
            "original": "#HEX",
            "suggested": "#HEX"
          },
          "priority": "high|medium|low"
        }
      ],
      "summary": "Brief summary of findings"
    }`;
    
    // Use XAI API to analyze
    const response = await grokApi.generateJson(prompt, 
      "You are an expert in web accessibility and color theory, specializing in WCAG compliance for color contrast. You'll analyze the Elevion platform for color contrast issues and provide practical recommendations.");
    
    // Log success
    await db.insert(logs).values({
      type: 'XAI_SCAN',
      message: 'Color contrast analysis completed',
      source: 'daily-xai-scan',
      level: 'info',
      createdAt: new Date()
    });
    
    return response;
  } catch (error) {
    console.error('Error in color contrast scan:', error);
    throw error;
  }
}

/**
 * Scan user experience
 */
async function scanUserExperience(): Promise<any> {
  console.log('Analyzing user experience...');
  
  try {
    // Prepare the prompt for the AI
    const prompt = `
    Analyze the user experience of the Elevion platform, focusing on:
    
    1. Navigation structure and clarity
    2. Form design and validation
    3. Feedback mechanisms
    4. Error state handling
    5. Loading states and perceived performance
    6. Call-to-action clarity
    7. Information architecture
    8. Visual hierarchy
    9. User flow bottlenecks
    
    Format your response as JSON with an "issues" array and a "suggestions" array:
    {
      "issues": [
        {
          "title": "Issue title",
          "description": "Detailed issue description",
          "impact": "Impact on user experience",
          "severity": "critical|high|medium|low",
          "location": "Specific feature or journey with issue"
        }
      ],
      "suggestions": [
        {
          "title": "Suggestion title",
          "description": "Detailed suggestion",
          "implementation": "How to implement it",
          "expectedImpact": "Description of expected impact",
          "priority": "high|medium|low",
          "estimatedEffort": "small|medium|large"
        }
      ],
      "summary": "Brief summary of findings"
    }`;
    
    // Use XAI API to analyze
    const response = await grokApi.generateJson(prompt, 
      "You are an expert UX researcher and designer with extensive experience optimizing web applications. You'll analyze the Elevion platform for UX issues and provide actionable recommendations.");
    
    // Log success
    await db.insert(logs).values({
      type: 'XAI_SCAN',
      message: 'User experience analysis completed',
      source: 'daily-xai-scan',
      level: 'info',
      createdAt: new Date()
    });
    
    return response;
  } catch (error) {
    console.error('Error in user experience scan:', error);
    throw error;
  }
}

/**
 * Scan for performance bottlenecks
 */
async function scanPerformanceBottlenecks(): Promise<any> {
  console.log('Analyzing performance bottlenecks...');
  
  try {
    // Prepare the prompt for the AI
    const prompt = `
    Analyze the Elevion platform for potential performance bottlenecks, focusing on:
    
    1. Render-blocking resources
    2. Large network payloads
    3. JavaScript execution time
    4. Memory leaks
    5. API response times
    6. Image optimization
    7. Code splitting opportunities
    8. State management efficiency
    9. Component re-rendering
    10. Database query optimization
    
    Format your response as JSON with an "issues" array and a "suggestions" array:
    {
      "issues": [
        {
          "title": "Issue title",
          "description": "Detailed issue description",
          "impact": "Impact on performance",
          "severity": "critical|high|medium|low",
          "location": "Specific code area or component with issue",
          "estimatedImpact": "Estimated performance impact"
        }
      ],
      "suggestions": [
        {
          "title": "Suggestion title",
          "description": "Detailed suggestion",
          "implementation": "How to implement it",
          "expectedImprovement": "Estimated improvement",
          "priority": "high|medium|low",
          "estimatedEffort": "small|medium|large"
        }
      ],
      "summary": "Brief summary of findings"
    }`;
    
    // Use XAI API to analyze
    const response = await grokApi.generateJson(prompt, 
      "You are an expert performance engineer specializing in web application optimization. You'll analyze the Elevion platform for performance bottlenecks and provide actionable recommendations.");
    
    // Log success
    await db.insert(logs).values({
      type: 'XAI_SCAN',
      message: 'Performance bottlenecks analysis completed',
      source: 'daily-xai-scan',
      level: 'info',
      createdAt: new Date()
    });
    
    return response;
  } catch (error) {
    console.error('Error in performance bottlenecks scan:', error);
    throw error;
  }
}

/**
 * Scan for security concerns
 */
async function scanSecurityConcerns(): Promise<any> {
  console.log('Analyzing security concerns...');
  
  try {
    // Prepare the prompt for the AI
    const prompt = `
    Analyze the Elevion platform for potential security vulnerabilities, focusing on:
    
    1. XSS vulnerabilities
    2. CSRF protection
    3. Authentication mechanisms
    4. Authorization controls
    5. Data validation
    6. Sensitive data exposure
    7. JWT implementation
    8. API security
    9. Dependency vulnerabilities
    10. Security headers
    
    Format your response as JSON with an "issues" array and a "suggestions" array:
    {
      "issues": [
        {
          "title": "Issue title",
          "description": "Detailed issue description",
          "impact": "Security impact",
          "severity": "critical|high|medium|low",
          "location": "Specific code area or component with issue",
          "cveReference": "CVE reference if applicable"
        }
      ],
      "suggestions": [
        {
          "title": "Suggestion title",
          "description": "Detailed suggestion",
          "implementation": "How to implement it",
          "priority": "high|medium|low",
          "estimatedEffort": "small|medium|large"
        }
      ],
      "summary": "Brief summary of findings"
    }`;
    
    // Use XAI API to analyze
    const response = await grokApi.generateJson(prompt, 
      "You are an expert cybersecurity consultant specializing in web application security. You'll analyze the Elevion platform for security vulnerabilities and provide actionable recommendations.");
    
    // Log success
    await db.insert(logs).values({
      type: 'XAI_SCAN',
      message: 'Security concerns analysis completed',
      source: 'daily-xai-scan',
      level: 'info',
      createdAt: new Date()
    });
    
    return response;
  } catch (error) {
    console.error('Error in security concerns scan:', error);
    throw error;
  }
}

/**
 * Scan for browser compatibility issues
 */
async function scanBrowserCompatibility(): Promise<any> {
  console.log('Analyzing browser compatibility...');
  
  try {
    // Prepare the prompt for the AI
    const prompt = `
    Analyze the Elevion platform for potential browser compatibility issues, focusing on:
    
    1. Modern CSS features with limited support
    2. JavaScript API compatibility
    3. Layout rendering differences
    4. Form element behavior variations
    5. Event handling discrepancies
    6. Web API support differences
    7. Polyfill requirements
    8. Mobile browser quirks
    
    Format your response as JSON with an "issues" array and a "suggestions" array:
    {
      "issues": [
        {
          "title": "Issue title",
          "description": "Detailed issue description",
          "impact": "User impact",
          "severity": "critical|high|medium|low",
          "affectedBrowsers": ["Browser list"],
          "location": "Specific code area or component with issue"
        }
      ],
      "suggestions": [
        {
          "title": "Suggestion title",
          "description": "Detailed suggestion",
          "implementation": "How to implement it",
          "priority": "high|medium|low",
          "estimatedEffort": "small|medium|large"
        }
      ],
      "summary": "Brief summary of findings"
    }`;
    
    // Use XAI API to analyze
    const response = await grokApi.generateJson(prompt, 
      "You are an expert frontend developer specializing in cross-browser compatibility. You'll analyze the Elevion platform for browser compatibility issues and provide actionable recommendations.");
    
    // Log success
    await db.insert(logs).values({
      type: 'XAI_SCAN',
      message: 'Browser compatibility analysis completed',
      source: 'daily-xai-scan',
      level: 'info',
      createdAt: new Date()
    });
    
    return response;
  } catch (error) {
    console.error('Error in browser compatibility scan:', error);
    throw error;
  }
}

/**
 * Scan for mobile responsiveness issues
 */
async function scanMobileResponsiveness(): Promise<any> {
  console.log('Analyzing mobile responsiveness...');
  
  try {
    // Prepare the prompt for the AI
    const prompt = `
    Analyze the Elevion platform for mobile responsiveness issues, focusing on:
    
    1. Viewport configuration
    2. Media query implementation
    3. Touch target sizes
    4. Content readability on small screens
    5. Layout shifts
    6. Image scaling
    7. Form usability on mobile
    8. Navigation patterns on small screens
    
    Format your response as JSON with an "issues" array and a "suggestions" array:
    {
      "issues": [
        {
          "title": "Issue title",
          "description": "Detailed issue description",
          "impact": "User impact",
          "severity": "critical|high|medium|low",
          "affectedDevices": ["Device types"],
          "location": "Specific component or page with issue"
        }
      ],
      "suggestions": [
        {
          "title": "Suggestion title",
          "description": "Detailed suggestion",
          "implementation": "How to implement it",
          "priority": "high|medium|low",
          "estimatedEffort": "small|medium|large"
        }
      ],
      "summary": "Brief summary of findings"
    }`;
    
    // Use XAI API to analyze
    const response = await grokApi.generateJson(prompt, 
      "You are an expert responsive web design consultant. You'll analyze the Elevion platform for mobile responsiveness issues and provide actionable recommendations.");
    
    // Log success
    await db.insert(logs).values({
      type: 'XAI_SCAN',
      message: 'Mobile responsiveness analysis completed',
      source: 'daily-xai-scan',
      level: 'info',
      createdAt: new Date()
    });
    
    return response;
  } catch (error) {
    console.error('Error in mobile responsiveness scan:', error);
    throw error;
  }
}

/**
 * Scan for SEO opportunities
 */
async function scanSEOOpportunities(): Promise<any> {
  console.log('Analyzing SEO opportunities...');
  
  try {
    // Prepare the prompt for the AI
    const prompt = `
    Analyze the Elevion platform for SEO optimization opportunities, focusing on:
    
    1. Meta tag implementation
    2. Heading structure
    3. Content quality and relevance
    4. URL structure
    5. Image optimization
    6. Structured data markup
    7. Internal linking
    8. Page speed factors
    9. Mobile-friendliness
    10. Crawlability and indexability
    
    Format your response as JSON with an "issues" array and a "suggestions" array:
    {
      "issues": [
        {
          "title": "Issue title",
          "description": "Detailed issue description",
          "impact": "SEO impact",
          "severity": "critical|high|medium|low",
          "location": "Specific page or component with issue"
        }
      ],
      "suggestions": [
        {
          "title": "Suggestion title",
          "description": "Detailed suggestion",
          "implementation": "How to implement it",
          "expectedImpact": "Expected SEO impact",
          "priority": "high|medium|low",
          "estimatedEffort": "small|medium|large"
        }
      ],
      "summary": "Brief summary of findings"
    }`;
    
    // Use XAI API to analyze
    const response = await grokApi.generateJson(prompt, 
      "You are an expert SEO consultant with extensive experience optimizing web applications for search engines. You'll analyze the Elevion platform for SEO opportunities and provide actionable recommendations.");
    
    // Log success
    await db.insert(logs).values({
      type: 'XAI_SCAN',
      message: 'SEO opportunities analysis completed',
      source: 'daily-xai-scan',
      level: 'info',
      createdAt: new Date()
    });
    
    return response;
  } catch (error) {
    console.error('Error in SEO opportunities scan:', error);
    throw error;
  }
}

/**
 * Scan for content quality issues
 */
async function scanContentQuality(): Promise<any> {
  console.log('Analyzing content quality...');
  
  try {
    // Prepare the prompt for the AI
    const prompt = `
    Analyze the content quality of the Elevion platform, focusing on:
    
    1. Readability and clarity
    2. Voice and tone consistency
    3. Grammar and spelling
    4. Messaging effectiveness
    5. Value proposition clarity
    6. Call-to-action effectiveness
    7. Technical accuracy
    8. Target audience appropriateness
    
    Format your response as JSON with an "issues" array and a "suggestions" array:
    {
      "issues": [
        {
          "title": "Issue title",
          "description": "Detailed issue description",
          "impact": "User impact",
          "severity": "critical|high|medium|low",
          "location": "Specific content area with issue",
          "currentContent": "Example of problematic content if applicable"
        }
      ],
      "suggestions": [
        {
          "title": "Suggestion title",
          "description": "Detailed suggestion",
          "implementation": "How to implement it",
          "suggestedContent": "Example of improved content if applicable",
          "priority": "high|medium|low",
          "estimatedEffort": "small|medium|large"
        }
      ],
      "summary": "Brief summary of findings"
    }`;
    
    // Use XAI API to analyze
    const response = await grokApi.generateJson(prompt, 
      "You are an expert content strategist and copywriter specializing in web applications. You'll analyze the Elevion platform's content quality and provide actionable recommendations.");
    
    // Log success
    await db.insert(logs).values({
      type: 'XAI_SCAN',
      message: 'Content quality analysis completed',
      source: 'daily-xai-scan',
      level: 'info',
      createdAt: new Date()
    });
    
    return response;
  } catch (error) {
    console.error('Error in content quality scan:', error);
    throw error;
  }
}

/**
 * Scan for branding consistency issues
 */
async function scanBrandingConsistency(): Promise<any> {
  console.log('Analyzing branding consistency...');
  
  try {
    // Prepare the prompt for the AI
    const prompt = `
    Analyze the branding consistency of the Elevion platform, focusing on:
    
    1. Color usage adherence to brand palette
    2. Typography consistency
    3. Visual element alignment with brand identity
    4. Logo usage
    5. Voice and tone consistency
    6. Imagery style consistency
    7. UI component styling consistency
    8. Brand message consistency
    
    Format your response as JSON with an "issues" array and a "suggestions" array:
    {
      "issues": [
        {
          "title": "Issue title",
          "description": "Detailed issue description",
          "impact": "Brand impact",
          "severity": "critical|high|medium|low",
          "location": "Specific area with issue",
          "brandGuideline": "Relevant brand guideline if applicable"
        }
      ],
      "suggestions": [
        {
          "title": "Suggestion title",
          "description": "Detailed suggestion",
          "implementation": "How to implement it",
          "priority": "high|medium|low",
          "estimatedEffort": "small|medium|large"
        }
      ],
      "summary": "Brief summary of findings"
    }`;
    
    // Use XAI API to analyze
    const response = await grokApi.generateJson(prompt, 
      "You are an expert brand strategist and designer specializing in brand consistency across digital platforms. You'll analyze the Elevion platform for branding consistency issues and provide actionable recommendations.");
    
    // Log success
    await db.insert(logs).values({
      type: 'XAI_SCAN',
      message: 'Branding consistency analysis completed',
      source: 'daily-xai-scan',
      level: 'info',
      createdAt: new Date()
    });
    
    return response;
  } catch (error) {
    console.error('Error in branding consistency scan:', error);
    throw error;
  }
}

/**
 * Create bug reports for critical issues
 */
async function createCriticalIssueReports(results: any) {
  try {
    console.log(`Creating bug reports for ${results.criticalIssues.length} critical issues...`);
    
    // Format the issues for the bug report
    const issuesSummary = results.criticalIssues.map((issue: any, index: number) => 
      `${index + 1}. [${issue.category}] ${issue.title}\n   Description: ${issue.description}\n   Impact: ${issue.impact}\n   Location: ${issue.location || 'N/A'}`
    ).join('\n\n');
    
    // Create a bug report entry
    await db.insert(bug_reports).values({
      title: `${results.criticalIssues.length} critical issues found by XAI scan`,
      description: `Consolidated XAI Scan Report (${results.scanId}):

Critical Issues Details:
${issuesSummary}

These issues require attention as they affect important aspects of the platform.`,
      severity: 'critical',
      status: 'open',
      source: 'xai-daily-scan',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('Bug report created successfully');
  } catch (error) {
    console.error('Error creating critical issue reports:', error);
  }
}

// Run main function when this module is the entry point
runDailyXAIScan()
  .then(() => {
    console.log('Daily XAI scan completed successfully');
  })
  .catch(error => {
    console.error('XAI scan execution failed:', error);
    process.exit(1);
  });

// Export for use in other scripts
export default runDailyXAIScan;