/**
 * Popup Routes Testing Script
 * 
 * This script specifically tests popup routes which have been problematic
 * with 404 errors, especially with the Wouter router. It validates each popup
 * route for accessibility and proper rendering.
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { db } from '../db';
import { bug_reports } from '@shared/schema';

// Configuration
const CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:5000',
  logsDir: path.join(process.cwd(), 'logs'),
  reportFile: path.join(process.cwd(), 'logs', 'popup-routes-test.json'),
  // List of all expected popup routes
  popupRoutes: [
    // Client onboarding popups
    { path: '/popup/client-onboarding', name: 'Client Onboarding' },
    { path: '/popup/project-brief', name: 'Project Brief' },
    { path: '/popup/mockup-preview', name: 'Mockup Preview' },
    
    // Service popups
    { path: '/popup/service-details', name: 'Service Details' },
    { path: '/popup/pricing-calculator', name: 'Pricing Calculator' },
    { path: '/popup/quote-generator', name: 'Quote Generator' },
    
    // Marketing popups
    { path: '/popup/newsletter-signup', name: 'Newsletter Signup' },
    { path: '/popup/special-offer', name: 'Special Offer' },
    { path: '/popup/feedback-form', name: 'Feedback Form' },
    
    // Tool popups
    { path: '/popup/seo-analyzer', name: 'SEO Analyzer' },
    { path: '/popup/color-palette', name: 'Color Palette Generator' },
    { path: '/popup/content-ideas', name: 'Content Ideas Generator' },
    
    // Admin popups
    { path: '/popup/user-management', name: 'User Management' },
    { path: '/popup/analytics-dashboard', name: 'Analytics Dashboard' },
    { path: '/popup/system-settings', name: 'System Settings' },
  ]
};

// Ensure logs directory exists
if (!fs.existsSync(CONFIG.logsDir)) {
  fs.mkdirSync(CONFIG.logsDir, { recursive: true });
}

/**
 * Main function to test all popup routes
 */
async function testPopupRoutes() {
  console.log('Starting popup routes test...');
  
  const results = {
    timestamp: new Date().toISOString(),
    total: CONFIG.popupRoutes.length,
    passed: 0,
    failed: 0,
    routes: [] as any[]
  };
  
  for (const route of CONFIG.popupRoutes) {
    try {
      console.log(`Testing popup route: ${route.name} (${route.path})`);
      
      const start = Date.now();
      const response = await axios({
        method: 'GET',
        url: `${CONFIG.baseUrl}${route.path}`,
        validateStatus: () => true // Don't throw on non-2xx status
      });
      const duration = Date.now() - start;
      
      const success = response.status === 200;
      
      if (success) {
        results.passed++;
        console.log(`✅ ${route.name}: ${response.status} (${duration}ms)`);
      } else {
        results.failed++;
        console.error(`❌ ${route.name}: ${response.status} (${duration}ms)`);
        
        // Check if the response contains the typical 404 message from Wouter
        const isWouterIssue = 
          typeof response.data === 'string' && 
          response.data.includes('The page you were looking for does not exist');
        
        // Log error to database for tracking
        await logRouteError({
          routeName: route.name,
          routePath: route.path,
          status: response.status,
          isWouterIssue,
          responseData: typeof response.data === 'string' 
            ? response.data.substring(0, 1000) // Limit to prevent excessive storage
            : JSON.stringify(response.data).substring(0, 1000)
        });
      }
      
      results.routes.push({
        name: route.name,
        path: route.path,
        status: response.status,
        duration,
        success
      });
      
    } catch (error) {
      results.failed++;
      console.error(`❌ ${route.name}: Failed - ${error instanceof Error ? error.message : String(error)}`);
      
      // Log connection error to database
      await logRouteError({
        routeName: route.name,
        routePath: route.path,
        error: error instanceof Error ? error.message : String(error),
        isConnectionError: true
      });
      
      results.routes.push({
        name: route.name,
        path: route.path,
        error: error instanceof Error ? error.message : String(error),
        success: false
      });
    }
  }
  
  // Calculate success rate
  const successRate = Math.round((results.passed / results.total) * 100);
  
  // Log summary
  console.log('\n===== POPUP ROUTES TEST RESULTS =====');
  console.log(`Total Routes: ${results.total}`);
  console.log(`Passed: ${results.passed} (${successRate}%)`);
  console.log(`Failed: ${results.failed}`);
  
  // Save results to file
  fs.writeFileSync(
    CONFIG.reportFile,
    JSON.stringify(results, null, 2)
  );
  
  // If under 80% success rate, log a critical issue
  if (successRate < 80) {
    await db.insert(bug_reports).values({
      title: `Critical: ${results.failed} popup routes failing (${successRate}% success rate)`,
      description: `Popup routes test detected a high failure rate.
      
Passed: ${results.passed}/${results.total} (${successRate}%)
Failed: ${results.failed}/${results.total}

Failed Routes:
${results.routes.filter(r => !r.success).map(r => `- ${r.name} (${r.path}): ${r.status || r.error}`).join('\n')}

This is likely an issue with the Wouter router configuration or route handling.
Check the client-side route configuration and ensure that popup routes are properly registered.`,
      severity: 'critical',
      status: 'open',
      source: 'popup-routes-test',
      affectedComponent: 'router',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  return results;
}

/**
 * Log a route error to the database
 */
async function logRouteError({
  routeName,
  routePath,
  status,
  error,
  isWouterIssue = false,
  isConnectionError = false,
  responseData
}: {
  routeName: string;
  routePath: string;
  status?: number;
  error?: string;
  isWouterIssue?: boolean;
  isConnectionError?: boolean;
  responseData?: string;
}) {
  try {
    let title = `Popup route error: ${routeName}`;
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    
    if (isWouterIssue) {
      title = `Wouter router issue: ${routeName} popup`;
      severity = 'high';
    } else if (isConnectionError) {
      title = `Connection error: ${routeName} popup`;
      severity = 'high';
    } else if (status === 500) {
      title = `Server error on popup: ${routeName}`;
      severity = 'high';
    }
    
    await db.insert(bug_reports).values({
      title,
      description: `Error accessing popup route "${routeName}" at path "${routePath}".
${status ? `Status code: ${status}` : ''}
${error ? `Error: ${error}` : ''}
${responseData ? `Response: ${responseData}` : ''}

${isWouterIssue ? 'This appears to be an issue with the Wouter router configuration.' : ''}
${isConnectionError ? 'This appears to be a network connection issue.' : ''}

Possible solutions:
1. Check that the route is properly registered in the client's App.tsx
2. Ensure the component for this popup exists and is correctly exported
3. Verify that the route path format matches what Wouter expects
4. Consider adding a catch-all route handler for popups to prevent 404s`,
      severity,
      status: 'open',
      source: 'popup-routes-test',
      affectedComponent: 'router',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  } catch (dbError) {
    console.error('Failed to log route error to database:', dbError);
  }
}

// Generate suggested fixes for popup route issues
async function generateFixSuggestions() {
  console.log('Generating fix suggestions for popup routes...');
  
  // Basic template for Wouter router popup handling
  const popupRouterFix = `
// Add this to client/src/App.tsx

// Dynamic popup handler component
const PopupHandler = () => {
  const [location] = useLocation();
  
  // Extract popup name from path
  const popupMatch = /\\/popup\\/([\\w-]+)/.exec(location);
  const popupName = popupMatch ? popupMatch[1] : null;
  
  // If not a popup route, return null
  if (!popupName) return null;
  
  // Map of popup names to components
  const popupComponents: Record<string, React.ComponentType> = {
    'project-brief': ProjectBriefPopup,
    'mockup-preview': MockupPreviewPopup,
    'quote-generator': QuoteGeneratorPopup,
    // Add other popups here
  };
  
  // Get the component for this popup
  const PopupComponent = popupComponents[popupName];
  
  // If component exists, render it, otherwise show 404
  return PopupComponent ? (
    <div className="popup-overlay">
      <div className="popup-container">
        <PopupComponent />
      </div>
    </div>
  ) : (
    <div className="popup-overlay">
      <div className="popup-container">
        <h2>Popup Not Found</h2>
        <p>The requested popup "{popupName}" does not exist.</p>
      </div>
    </div>
  );
};

// Then in your routes:
<Route path="/popup/:name">
  <PopupHandler />
</Route>
`;

  // Write fix suggestions to file
  fs.writeFileSync(
    path.join(CONFIG.logsDir, 'popup-routes-fix.txt'),
    popupRouterFix
  );
  
  console.log('Fix suggestions written to logs/popup-routes-fix.txt');
}

// Run main function when this module is the entry point
testPopupRoutes()
  .then(results => {
    if (results.failed > 0) {
      generateFixSuggestions();
    }
    console.log('Popup routes test completed');
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });

// Export for use in other scripts
export default testPopupRoutes;