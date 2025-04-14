import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/queryClient';

type ABTestVariant = {
  id: string;
  changes: Record<string, any>;
};

type ABTest = {
  id: string;
  elementSelector: string;
  goalType: 'click' | 'form_submit' | 'page_view' | 'custom';
  goalSelector?: string;
  variants: ABTestVariant[];
};

/**
 * Client component that loads active A/B tests and applies them to the DOM
 * Also handles tracking impressions and conversions
 */
const ABTestClient = () => {
  const [initialized, setInitialized] = useState(false);
  const [activeTests, setActiveTests] = useState<Record<string, { testId: string, variantId: string }>>({});
  
  useEffect(() => {
    // Skip during SSR
    if (typeof window === 'undefined') return;
    
    const fetchTests = async () => {
      try {
        // Fetch active tests
        const response = await apiRequest('GET', '/api/abtesting/active');
        const data = await response.json();
        
        if (!data.success || !data.data || !Array.isArray(data.data)) {
          console.warn('Failed to load A/B tests or no tests available');
          setInitialized(true);
          return;
        }
        
        const tests = data.data as ABTest[];
        if (tests.length === 0) {
          setInitialized(true);
          return;
        }
        
        // Process each test
        const newActiveTests: Record<string, { testId: string, variantId: string }> = {};
        
        for (const test of tests) {
          // Skip tests with no variants
          if (!test.variants || test.variants.length === 0) continue;
          
          // Apply a random variant for each test (weighted by already active tests in localStorage)
          applyTestVariant(test, newActiveTests);
        }
        
        setActiveTests(newActiveTests);
        setInitialized(true);
      } catch (error) {
        console.error('Error loading A/B tests:', error);
        setInitialized(true);
      }
    };
    
    fetchTests();
  }, []);
  
  // Handle conversions when relevant elements are clicked
  useEffect(() => {
    if (!initialized || Object.keys(activeTests).length === 0) return;
    
    // Fetch tests data again to get goal selectors
    const setupConversionTracking = async () => {
      try {
        const response = await apiRequest('GET', '/api/abtesting/active');
        const data = await response.json();
        
        if (!data.success || !data.data || !Array.isArray(data.data)) {
          return;
        }
        
        const tests = data.data as ABTest[];
        
        // Set up click handlers for goal elements
        tests.forEach(test => {
          if (!activeTests[test.elementSelector]) return;
          
          const selector = test.goalType === 'click' || test.goalType === 'form_submit' 
            ? (test.goalSelector || test.elementSelector) 
            : null;
          
          if (selector && test.goalType === 'click') {
            const elements = document.querySelectorAll(selector);
            
            elements.forEach(element => {
              // Avoid adding duplicate listeners
              element.removeEventListener('click', () => {});
              
              element.addEventListener('click', () => {
                recordConversion(test.id, activeTests[test.elementSelector].variantId);
              });
            });
          }
          
          if (selector && test.goalType === 'form_submit') {
            const forms = document.querySelectorAll(selector);
            
            forms.forEach(form => {
              if (form instanceof HTMLFormElement) {
                // Avoid adding duplicate listeners
                form.removeEventListener('submit', () => {});
                
                form.addEventListener('submit', () => {
                  recordConversion(test.id, activeTests[test.elementSelector].variantId);
                });
              }
            });
          }
          
          if (test.goalType === 'page_view') {
            // For page view goals, we'll trigger conversion after a delay
            // to ensure the user actually viewed the page (not just loaded it)
            setTimeout(() => {
              recordConversion(test.id, activeTests[test.elementSelector].variantId);
            }, 5000);
          }
        });
      } catch (error) {
        console.error('Error setting up conversion tracking:', error);
      }
    };
    
    setupConversionTracking();
  }, [initialized, activeTests]);
  
  const applyTestVariant = (
    test: ABTest, 
    newActiveTests: Record<string, { testId: string, variantId: string }>
  ) => {
    try {
      // Check for elements that match the selector
      const elements = document.querySelectorAll(test.elementSelector);
      if (elements.length === 0) {
        console.warn(`No elements found for selector: ${test.elementSelector}`);
        return;
      }
      
      // Check if we already have a variant assigned for this test
      const storedTestData = localStorage.getItem(`ab_test_${test.id}`);
      let variantId: string;
      
      if (storedTestData) {
        // Use previously assigned variant
        variantId = JSON.parse(storedTestData).variantId;
      } else {
        // Randomly choose a variant
        const randomIndex = Math.floor(Math.random() * test.variants.length);
        variantId = test.variants[randomIndex].id;
        
        // Store the assignment
        localStorage.setItem(`ab_test_${test.id}`, JSON.stringify({
          testId: test.id,
          variantId: variantId,
          timestamp: new Date().toISOString()
        }));
      }
      
      // Find the selected variant
      const variant = test.variants.find(v => v.id === variantId);
      if (!variant) {
        console.warn(`Variant ${variantId} not found in test ${test.id}`);
        return;
      }
      
      // Apply changes to the elements
      elements.forEach(element => {
        applyChangesToElement(element, variant.changes);
      });
      
      // Record this test as active
      newActiveTests[test.elementSelector] = {
        testId: test.id,
        variantId: variantId
      };
      
      // Record impression
      recordImpression(test.id, variantId);
    } catch (error) {
      console.error(`Error applying test ${test.id}:`, error);
    }
  };
  
  const applyChangesToElement = (element: Element, changes: Record<string, any>) => {
    // Apply CSS changes
    if (changes.css && typeof changes.css === 'object') {
      Object.entries(changes.css).forEach(([property, value]) => {
        if (element instanceof HTMLElement) {
          element.style[property as any] = value as string;
        }
      });
    }
    
    // Apply content changes
    if (changes.content && typeof changes.content === 'string') {
      element.textContent = changes.content;
    }
    
    // Apply HTML changes
    if (changes.html && typeof changes.html === 'string') {
      element.innerHTML = changes.html;
    }
    
    // Apply attribute changes
    if (changes.attributes && typeof changes.attributes === 'object') {
      Object.entries(changes.attributes).forEach(([attr, value]) => {
        if (value === null) {
          element.removeAttribute(attr);
        } else {
          element.setAttribute(attr, String(value));
        }
      });
    }
    
    // Apply class changes
    if (changes.addClass && Array.isArray(changes.addClass)) {
      changes.addClass.forEach((className: string) => {
        element.classList.add(className);
      });
    }
    
    if (changes.removeClass && Array.isArray(changes.removeClass)) {
      changes.removeClass.forEach((className: string) => {
        element.classList.remove(className);
      });
    }
  };
  
  const recordImpression = async (testId: string, variantId: string) => {
    try {
      await apiRequest('POST', `/api/abtesting/tests/${testId}/variants/${variantId}/impression`);
    } catch (error) {
      console.error('Error recording impression:', error);
    }
  };
  
  const recordConversion = async (testId: string, variantId: string) => {
    try {
      await apiRequest('POST', `/api/abtesting/tests/${testId}/variants/${variantId}/conversion`);
    } catch (error) {
      console.error('Error recording conversion:', error);
    }
  };
  
  // This component doesn't render anything
  return null;
};

export default ABTestClient;