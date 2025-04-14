import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

type ABTestVariant = {
  id: string;
  name: string;
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
export default function ABTestClient() {
  const [appliedTests, setAppliedTests] = useState<Record<string, string>>({});

  const { data: activeTests, isLoading, error } = useQuery<{ success: boolean; data: ABTest[] }>({
    queryKey: ['/api/ab-tests/active'],
    staleTime: 300000, // 5 minutes
  });

  // Track when a test has been applied to the DOM
  const trackImpression = async (testId: string, variantId: string) => {
    try {
      await apiRequest('POST', '/api/ab-tests/track/impression', { testId, variantId });
    } catch (err) {
      console.error('Failed to track A/B test impression:', err);
    }
  };

  // Track when a conversion goal is achieved
  const trackConversion = async (testId: string, variantId: string) => {
    try {
      await apiRequest('POST', '/api/ab-tests/track/conversion', { testId, variantId });
    } catch (err) {
      console.error('Failed to track A/B test conversion:', err);
    }
  };

  // Apply a variant's changes to an element
  const applyChangesToElement = (element: Element, changes: Record<string, any>) => {
    // Apply text content if specified
    if (changes.text && element instanceof HTMLElement) {
      element.innerText = changes.text;
    }

    // Apply HTML content if specified
    if (changes.html && element instanceof HTMLElement) {
      element.innerHTML = changes.html;
    }

    // Apply CSS styles if specified
    if (element instanceof HTMLElement) {
      Object.entries(changes).forEach(([key, value]) => {
        // Skip text and html as they're handled separately
        if (key !== 'text' && key !== 'html') {
          (element.style as any)[key] = value;
        }
      });
    }

    // Apply attributes if specified
    if (changes.attributes && element instanceof HTMLElement) {
      Object.entries(changes.attributes).forEach(([attr, value]) => {
        if (value === null || value === undefined) {
          element.removeAttribute(attr);
        } else {
          element.setAttribute(attr, String(value));
        }
      });
    }

    // Apply class changes if specified
    if (changes.addClass && element instanceof HTMLElement) {
      if (Array.isArray(changes.addClass)) {
        element.classList.add(...changes.addClass);
      } else {
        element.classList.add(changes.addClass);
      }
    }

    if (changes.removeClass && element instanceof HTMLElement) {
      if (Array.isArray(changes.removeClass)) {
        element.classList.remove(...changes.removeClass);
      } else {
        element.classList.remove(changes.removeClass);
      }
    }
  };

  const setupConversionTracking = (test: ABTest, variantId: string) => {
    switch (test.goalType) {
      case 'click':
        if (test.goalSelector) {
          const elements = document.querySelectorAll(test.goalSelector);
          elements.forEach(element => {
            element.addEventListener('click', () => trackConversion(test.id, variantId));
          });
        }
        break;
      case 'form_submit':
        if (test.goalSelector) {
          const forms = document.querySelectorAll(test.goalSelector);
          forms.forEach(form => {
            form.addEventListener('submit', () => trackConversion(test.id, variantId));
          });
        }
        break;
      case 'page_view':
        // Page view conversions are tracked when navigating to a specific page
        // This would be handled with a route listener or in a useEffect
        const currentPath = window.location.pathname;
        if (test.goalSelector && test.goalSelector === currentPath) {
          trackConversion(test.id, variantId);
        }
        break;
      case 'custom':
        // Custom conversions would be triggered by specific code elsewhere
        // Could set up a global event bus or window event
        window.addEventListener(`ab-test-convert-${test.id}`, () => {
          trackConversion(test.id, variantId);
        });
        break;
    }
  };

  useEffect(() => {
    const applyActiveTests = async () => {
      if (!activeTests?.data?.length) return;

      const newAppliedTests: Record<string, string> = { ...appliedTests };

      for (const test of activeTests.data) {
        // Skip if we've already applied this test
        if (appliedTests[test.id]) continue;

        // Find elements matching the test selector
        const elements = document.querySelectorAll(test.elementSelector);
        if (elements.length === 0) continue;

        // Select a variant based on its weight
        // Simplified version: randomly select one variant
        // In a more complex implementation, use weighted selection
        const variants = test.variants;
        const variantIndex = Math.floor(Math.random() * variants.length);
        const selectedVariant = variants[variantIndex];

        // Apply the changes to all matching elements
        elements.forEach(element => {
          applyChangesToElement(element, selectedVariant.changes);
        });

        // Set up conversion tracking
        setupConversionTracking(test, selectedVariant.id);

        // Track the impression
        await trackImpression(test.id, selectedVariant.id);

        // Mark test as applied
        newAppliedTests[test.id] = selectedVariant.id;
      }

      setAppliedTests(newAppliedTests);
    };

    // Apply the tests
    applyActiveTests();

    // Add listener for page changes (SPA navigation)
    const handleRouteChange = () => {
      // For tests that care about page views
      Object.entries(appliedTests).forEach(([testId, variantId]) => {
        const test = activeTests?.data?.find(t => t.id === testId);
        if (test?.goalType === 'page_view' && test.goalSelector === window.location.pathname) {
          trackConversion(testId, variantId);
        }
      });
    };

    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [activeTests, appliedTests]);

  // This component doesn't render anything, it just applies the tests
  return null;
}