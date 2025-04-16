import { generateJson, generateText } from './xaiClient';

/**
 * Analyzes user interaction data to identify UI/UX improvement opportunities
 * across different platforms (web, iOS, Android)
 */
export async function analyzeUserInteractions(data: any) {
  const systemPrompt = `You are a UX expert specializing in cross-platform web application optimization.
  Analyze the provided user interaction data and identify specific UI/UX improvements
  that would enhance the user experience across web, iOS, and Android platforms.
  Focus on button placement, form interactions, navigation flow, and visual hierarchy.
  Return a JSON object with actionable recommendations.`;

  const prompt = `
  User interaction data:
  ${JSON.stringify(data, null, 2)}
  
  Analyze this data to identify:
  1. Areas where users are experiencing friction or confusion
  2. Differences in interaction patterns across platforms
  3. Opportunities to improve button placement and accessibility
  4. Form validation or error handling issues
  5. Navigation flow improvements
  6. Loading state and transition animation recommendations
  
  For each recommendation, include:
  - The specific UI element or interaction pattern
  - The platform(s) affected (web, iOS, Android)
  - The issue identified
  - A clear, actionable solution
  - Priority level (high, medium, low)
  `;

  interface AnalysisResult {
    recommendations: Array<{
      element: string;
      platforms: string[];
      issue: string;
      solution: string;
      priority: 'high' | 'medium' | 'low';
    }>;
    highPriorityItems: string[];
    crossPlatformIssues: string[];
    topImprovementArea: string;
  }

  try {
    return await generateJson<AnalysisResult>(prompt, {
      model: 'grok-3',
      systemPrompt,
      temperature: 0.3,
      fallbackResponse: {
        recommendations: [
          {
            element: 'Popup dialogs',
            platforms: ['iOS', 'Android'],
            issue: 'Popups render inconsistently on mobile devices',
            solution: 'Implement responsive design with device-specific adjustments',
            priority: 'high'
          },
          {
            element: 'Login form',
            platforms: ['web', 'iOS', 'Android'],
            issue: 'Form validation feedback is delayed',
            solution: 'Add immediate inline validation with Framer Motion animations',
            priority: 'medium'
          },
          {
            element: 'Portfolio items',
            platforms: ['web', 'iOS', 'Android'],
            issue: 'Slow loading of portfolio items causes layout shifts',
            solution: 'Implement skeleton loading states with smooth transitions',
            priority: 'medium'
          }
        ],
        highPriorityItems: [
          'Fix popup rendering on mobile devices',
          'Improve loading animations across all platforms'
        ],
        crossPlatformIssues: [
          'Inconsistent animation timing',
          'Layout shifts during content loading'
        ],
        topImprovementArea: 'Motion and animation consistency'
      }
    });
  } catch (error) {
    console.error('Error analyzing user interactions:', error);
    throw error;
  }
}

/**
 * Analyzes error logs to identify cross-platform compatibility issues
 */
export async function analyzeErrorLogs(logs: any) {
  const systemPrompt = `You are a technical expert specializing in cross-platform web application debugging.
  Analyze the provided error logs and identify specific issues that affect different platforms.
  Focus on browser compatibility issues, mobile-specific errors, and responsive design problems.
  Return a JSON object with actionable fixes categorized by platform.`;

  const prompt = `
  Error logs:
  ${JSON.stringify(logs, null, 2)}
  
  Analyze these logs to identify:
  1. Browser-specific compatibility issues
  2. Mobile device rendering problems
  3. Touch interaction errors on mobile platforms
  4. Responsive design breakpoints causing issues
  5. Animation and transition errors
  6. Platform-specific performance issues
  
  For each issue, provide:
  - The error description
  - The affected platforms/browsers
  - The root cause analysis
  - A specific code fix recommendation
  `;

  interface AnalysisResult {
    issues: Array<{
      description: string;
      platforms: string[];
      rootCause: string;
      fixRecommendation: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      codeExample?: string;
    }>;
    browserSpecificFixes: Record<string, string[]>;
    mobileOptimizations: string[];
    performanceImprovements: string[];
  }

  try {
    return await generateJson<AnalysisResult>(prompt, {
      model: 'grok-3',
      systemPrompt,
      temperature: 0.3,
      fallbackResponse: {
        issues: [
          {
            description: 'Popup routing fails on Safari mobile',
            platforms: ['iOS Safari'],
            rootCause: 'History API implementation differences',
            fixRecommendation: 'Use direct state management instead of history.back()',
            priority: 'critical',
            codeExample: 'const closePopup = () => { setIsOpen(false); setLocation("/"); };'
          },
          {
            description: 'Animations not working on older Android browsers',
            platforms: ['Android < 10'],
            rootCause: 'Missing transform fallbacks',
            fixRecommendation: 'Add polyfills for older browsers',
            priority: 'medium'
          }
        ],
        browserSpecificFixes: {
          'Safari': [
            'Use webkit prefixes for certain CSS properties',
            'Handle touch events differently from click events'
          ],
          'Firefox': [
            'Add specific handling for form validation styles'
          ]
        },
        mobileOptimizations: [
          'Optimize touch targets to be at least 44x44 pixels',
          'Implement swipe gestures for navigation'
        ],
        performanceImprovements: [
          'Reduce animation complexity on mobile devices',
          'Optimize image loading for different screen sizes'
        ]
      }
    });
  } catch (error) {
    console.error('Error analyzing error logs:', error);
    throw error;
  }
}

/**
 * Analyzes the UI layout for different screen sizes and suggests improvements
 */
export async function analyzeUILayout(layoutData: any) {
  const systemPrompt = `You are a UI/UX expert specializing in responsive design and cross-platform compatibility.
  Analyze the provided layout data and suggest improvements for different screen sizes and devices.
  Focus on visual hierarchy, component spacing, and touch interactions.
  Return a JSON object with specific layout recommendations.`;

  const prompt = `
  Layout data:
  ${JSON.stringify(layoutData, null, 2)}
  
  Analyze this layout data to identify:
  1. Components that need responsive adjustments
  2. Element sizing and spacing issues across different devices
  3. Touch target size problems on mobile
  4. Visual hierarchy inconsistencies
  5. Opportunities for improved animations and transitions
  
  For each recommendation, include:
  - The specific component or layout area
  - The screen sizes/devices affected
  - The current issue
  - A clear solution with specific CSS/styling recommendations
  `;

  interface AnalysisResult {
    layoutRecommendations: Array<{
      component: string;
      screenSizes: string[];
      issue: string;
      solution: string;
      cssExample?: string;
    }>;
    responsiveBreakpoints: Record<string, string[]>;
    animationSuggestions: string[];
    accessibilityImprovements: string[];
  }

  try {
    return await generateJson<AnalysisResult>(prompt, {
      model: 'grok-3',
      systemPrompt,
      temperature: 0.3,
      fallbackResponse: {
        layoutRecommendations: [
          {
            component: 'ElevateBot chat window',
            screenSizes: ['mobile', 'tablet'],
            issue: 'Takes up too much screen space on smaller devices',
            solution: 'Implement a more compact version for mobile that expands when active',
            cssExample: '.chat-window { max-height: 80vh; width: 100%; bottom: 0; left: 0; }'
          },
          {
            component: 'Portfolio grid',
            screenSizes: ['mobile'],
            issue: 'Grid layout breaks on narrow screens',
            solution: 'Change to a single column with larger items on mobile',
            cssExample: '@media (max-width: 640px) { .portfolio-grid { grid-template-columns: 1fr; } }'
          }
        ],
        responsiveBreakpoints: {
          'mobile': [
            'Max width of 640px',
            'Single column layouts',
            'Larger touch targets'
          ],
          'tablet': [
            'Width between 641px and 1024px',
            'Two column layouts',
            'Simplified navigation'
          ]
        },
        animationSuggestions: [
          'Add subtle fade-in animations for content loading',
          'Use scale transitions for buttons on hover/focus',
          'Implement slide transitions for menu items'
        ],
        accessibilityImprovements: [
          'Increase contrast ratios for text elements',
          'Ensure all interactive elements have proper focus states',
          'Add aria-labels to all interactive elements'
        ]
      }
    });
  } catch (error) {
    console.error('Error analyzing UI layout:', error);
    throw error;
  }
}