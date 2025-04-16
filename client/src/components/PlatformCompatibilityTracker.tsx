import { useEffect, useRef } from 'react';
import { usePlatformAnalytics } from '@/hooks/usePlatformAnalytics';
import { useToast } from '@/hooks/use-toast';

// This component doesn't render anything visible
// It only attaches event listeners and tracks platform compatibility issues
export function PlatformCompatibilityTracker() {
  const { 
    currentPlatform, 
    trackError, 
    trackButtonClick, 
    trackFormSubmission,
    analyzeLayout
  } = usePlatformAnalytics();
  
  const { toast } = useToast();
  const errorsTracked = useRef<Set<string>>(new Set());
  
  // One-time collection of layout data
  useEffect(() => {
    const collectLayoutData = () => {
      // Get all important UI components
      const components: Record<string, Record<string, string>> = {};
      
      // Get navigation elements
      const navElements = document.querySelectorAll('nav, header');
      navElements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        components[`navigation-${index}`] = {
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          position: window.getComputedStyle(element).position,
          display: window.getComputedStyle(element).display
        };
      });
      
      // Get form layouts
      const forms = document.querySelectorAll('form');
      forms.forEach((form, index) => {
        const formId = form.id || `form-${index}`;
        components[formId] = {
          inputs: `${form.querySelectorAll('input, select, textarea').length}`,
          width: `${form.getBoundingClientRect().width}px`,
          layout: window.getComputedStyle(form).display
        };
      });
      
      // Get grid and flex layouts
      const grids = document.querySelectorAll('[class*="grid"], [style*="display: grid"]');
      grids.forEach((grid, index) => {
        const id = grid.id || `grid-${index}`;
        components[id] = {
          columns: window.getComputedStyle(grid).gridTemplateColumns,
          gap: window.getComputedStyle(grid).gap
        };
      });
      
      // Collect interaction patterns
      const interactionPatterns: Record<string, Record<string, string>> = {
        touchTargets: {
          buttonMinHeight: document.querySelectorAll('button').length > 0 
            ? window.getComputedStyle(document.querySelector('button')!).height 
            : 'not found',
          inputMinHeight: document.querySelectorAll('input').length > 0
            ? window.getComputedStyle(document.querySelector('input')!).height
            : 'not found'
        },
        animations: {
          transitionProperties: document.querySelectorAll('[style*="transition"]').length.toString(),
          animationCount: document.querySelectorAll('[style*="animation"]').length.toString()
        },
        popups: {
          count: document.querySelectorAll('[role="dialog"], .modal, .popup, [class*="modal"], [class*="popup"]').length.toString()
        }
      };

      // Submit the layout data for analysis
      analyzeLayout({
        components,
        interactionPatterns,
        screenSize: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        platform: currentPlatform,
        userAgent: navigator.userAgent
      });
    };

    // Wait for the page to fully render
    const timer = setTimeout(collectLayoutData, 2000);
    
    return () => clearTimeout(timer);
  }, [currentPlatform, analyzeLayout]);

  // Track JavaScript errors
  useEffect(() => {
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    const handleGlobalError = (event: ErrorEvent) => {
      const errorKey = `${event.message}:${event.filename}:${event.lineno}`;
      // Only track unique errors to avoid flooding
      if (!errorsTracked.current.has(errorKey)) {
        errorsTracked.current.add(errorKey);
        trackError('uncaught', event.message, event.filename);
      }
    };

    // Override console.error to track errors
    console.error = (...args: any[]) => {
      const errorMessage = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      const errorKey = `console-error:${errorMessage}`;
      if (!errorsTracked.current.has(errorKey)) {
        errorsTracked.current.add(errorKey);
        trackError('console', errorMessage);
      }
      
      originalConsoleError.apply(console, args);
    };
    
    // Override console.warn to track warnings
    console.warn = (...args: any[]) => {
      const warningMessage = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      // Only track React-related warnings
      if (warningMessage.includes('React') || warningMessage.includes('Warning:')) {
        const warningKey = `console-warn:${warningMessage}`;
        if (!errorsTracked.current.has(warningKey)) {
          errorsTracked.current.add(warningKey);
          trackError('react-warning', warningMessage);
        }
      }
      
      originalConsoleWarn.apply(console, args);
    };
    
    // Listen for unhandled errors
    window.addEventListener('error', handleGlobalError);
    
    // Track layout shift issues
    let layoutShiftIssues = 0;
    const layoutShiftObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // @ts-ignore - Layout shift API might not be fully typed
        if (entry.hadRecentInput) continue;
        
        // @ts-ignore
        if (entry.value > 0.05) { // Only track significant shifts
          layoutShiftIssues++;
          if (layoutShiftIssues <= 3) { // Limit to avoid excessive tracking
            trackError('layout-shift', `Layout shift detected with value ${entry.value}`);
          }
        }
      }
    });
    
    try {
      layoutShiftObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      console.log('Layout Shift API not supported');
    }
    
    // Track when people submit forms
    const handleFormSubmit = (e: Event) => {
      const form = e.target as HTMLFormElement;
      const formId = form.id || 'unknown-form';
      
      // Check if form has validation errors
      const isValid = form.checkValidity();
      trackFormSubmission(formId, isValid);
      
      if (!isValid) {
        const invalidInputs = form.querySelectorAll(':invalid');
        if (invalidInputs.length > 0) {
          trackError('form-validation', `Form ${formId} has ${invalidInputs.length} invalid inputs`);
        }
      }
    };
    
    // Track form submissions
    document.addEventListener('submit', handleFormSubmit);
    
    // Track button clicks
    const handleButtonClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest('button') || target.closest('[role="button"]');
      
      if (button) {
        const buttonId = button.id || 
                        button.getAttribute('aria-label') || 
                        button.textContent?.trim() || 
                        'unknown-button';
        
        trackButtonClick(buttonId);
      }
    };
    
    document.addEventListener('click', handleButtonClick);
    
    // Clean up event listeners and restore console methods
    return () => {
      window.removeEventListener('error', handleGlobalError);
      document.removeEventListener('submit', handleFormSubmit);
      document.removeEventListener('click', handleButtonClick);
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      
      try {
        layoutShiftObserver.disconnect();
      } catch (e) {
        // Ignore errors when disconnecting
      }
    };
  }, [trackError, trackButtonClick, trackFormSubmission]);

  // This component doesn't render anything
  return null;
}