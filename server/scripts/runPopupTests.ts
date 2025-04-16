/**
 * Popup Routes Testing Script
 * This script tests all popup routes and diagnoses any 404 errors
 */

import { tester } from '../utils/comprehensiveTester';

async function main() {
  console.log('Starting popup routes test...');
  
  // Run the comprehensive tester with focus on popup routes
  const testResults = await tester.runAllTests();
  
  // Extract popup route test results
  const popupResults = testResults.testResults.filter(test => test.category === 'popup-routes');
  
  console.log(`
Popup Routes Test Results
------------------------
Total popup routes tested: ${popupResults.length}
Passed: ${popupResults.filter(r => r.success).length}
Failed: ${popupResults.filter(r => !r.success).length}
  `);
  
  // Check for 404 errors specifically
  const notFoundRoutes = popupResults.filter(test => 
    !test.success && (test as any).status === 404
  );
  
  if (notFoundRoutes.length > 0) {
    console.log(`Found ${notFoundRoutes.length} routes with 404 errors:`);
    notFoundRoutes.forEach((route, index) => {
      console.log(`${index + 1}. ${(route as any).route}`);
      if (route.fixDetails) {
        console.log(`   Fix suggestion: ${route.fixDetails}`);
      }
    });
    
    console.log(`
RECOMMENDATION:
1. Check that all popup routes are properly defined in App.tsx
2. Ensure popup components exist in the client/src/components/popups/ directory
3. Check that the PopupContext is correctly handling popup state
4. Verify that popup links use proper routing instead of direct URL changes
    `);
  } else {
    console.log('All popup routes are working correctly!');
  }
  
  // Schedule daily scan if requested
  if (process.argv.includes('--schedule')) {
    tester.scheduleDailyTests();
  }
}

// Run the script
main().catch(error => {
  console.error('Error running popup tests:', error);
  process.exit(1);
});