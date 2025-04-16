import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Types for the analytics data
interface UserInteraction {
  clickEvents?: Record<string, Record<string, number>>;
  formSubmissions?: Record<string, Record<string, number>>;
  loadTimes?: Record<string, Record<string, number>>;
  [key: string]: any;
}

interface ErrorLog {
  browserErrors?: Record<string, string[]>;
  mobileErrors?: Record<string, string[]>;
  [key: string]: any;
}

interface LayoutData {
  components?: Record<string, Record<string, string>>;
  interactionPatterns?: Record<string, Record<string, string>>;
  [key: string]: any;
}

// Return types for the analytics API
interface InteractionAnalysisResult {
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

interface ErrorAnalysisResult {
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

interface LayoutAnalysisResult {
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

interface CrossPlatformReport {
  interactionAnalysis: InteractionAnalysisResult;
  errorAnalysis: ErrorAnalysisResult;
  layoutAnalysis: LayoutAnalysisResult;
  summary: {
    highPriorityIssues: string[];
    crossPlatformIssues: string[];
    responsiveImprovements: Record<string, string[]>;
    animationRecommendations: string[];
  };
}

// Hook for platform analytics functionality
export function usePlatformAnalytics() {
  const { toast } = useToast();
  const [currentPlatform, setCurrentPlatform] = useState(() => {
    const userAgent = navigator.userAgent || navigator.vendor;
    
    if (/android/i.test(userAgent)) {
      return 'android';
    }
    
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      return 'ios';
    }
    
    return 'web';
  });

  // Track user interactions (clicks, form submissions, etc.)
  const trackInteractionsMutation = useMutation({
    mutationFn: async (interactionData: UserInteraction) => {
      const res = await apiRequest('POST', '/api/analytics/user-interactions', interactionData);
      return await res.json();
    },
    onError: (error: Error) => {
      console.error('Failed to track interactions:', error);
      // Silent fail for tracking to avoid disrupting user experience
    }
  });

  // Track error logs for analysis
  const trackErrorsMutation = useMutation({
    mutationFn: async (errorLogs: ErrorLog) => {
      const res = await apiRequest('POST', '/api/analytics/error-logs', errorLogs);
      return await res.json();
    },
    onError: (error: Error) => {
      console.error('Failed to track errors:', error);
      // Silent fail for tracking
    }
  });

  // Submit UI layout data for analysis
  const analyzeLayoutMutation = useMutation({
    mutationFn: async (layoutData: LayoutData) => {
      const res = await apiRequest('POST', '/api/analytics/ui-layout', layoutData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Layout Analysis Complete",
        description: "Your layout has been analyzed for cross-platform compatibility.",
        variant: "default"
      });
    },
    onError: (error: Error) => {
      console.error('Layout analysis failed:', error);
      toast({
        title: "Layout Analysis Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Get the comprehensive cross-platform report
  const {
    data: crossPlatformReport,
    isLoading: isReportLoading,
    error: reportError,
    refetch: refetchReport
  } = useQuery<CrossPlatformReport>({
    queryKey: ['/api/analytics/cross-platform-report'],
    enabled: false, // Don't fetch automatically
  });

  // Helper function to track button clicks with platform info
  const trackButtonClick = (buttonId: string) => {
    const clickData = {
      clickEvents: {
        [buttonId]: {
          [currentPlatform]: 1
        }
      },
      timestamp: new Date().toISOString(),
      platform: currentPlatform,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
    
    trackInteractionsMutation.mutate(clickData);
  };

  // Helper function to track form submissions with platform info
  const trackFormSubmission = (formId: string, isSuccess: boolean) => {
    const formData = {
      formSubmissions: {
        [formId]: {
          [currentPlatform]: 1
        }
      },
      formResult: isSuccess ? 'success' : 'error',
      timestamp: new Date().toISOString(),
      platform: currentPlatform,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
    
    trackInteractionsMutation.mutate(formData);
  };

  // Helper function to track errors with platform info
  const trackError = (errorType: string, errorMessage: string, componentName?: string) => {
    const errorData: ErrorLog = {
      timestamp: new Date().toISOString(),
      platform: currentPlatform,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
    
    // Organize by browser/platform specific errors
    if (currentPlatform === 'ios' || currentPlatform === 'android') {
      errorData.mobileErrors = {
        [currentPlatform]: [errorMessage]
      };
    } else {
      errorData.browserErrors = {
        [navigator.userAgent]: [errorMessage]
      };
    }
    
    if (componentName) {
      errorData.component = componentName;
    }
    
    errorData.errorType = errorType;
    
    trackErrorsMutation.mutate(errorData);
  };

  return {
    currentPlatform,
    setCurrentPlatform,
    trackButtonClick,
    trackFormSubmission,
    trackError,
    analyzeLayout: (layoutData: LayoutData) => analyzeLayoutMutation.mutate(layoutData),
    isAnalyzingLayout: analyzeLayoutMutation.isPending,
    layoutAnalysisResult: analyzeLayoutMutation.data?.data,
    getCrossPlatformReport: () => refetchReport(),
    crossPlatformReport: crossPlatformReport,
    isReportLoading,
    reportError
  };
}