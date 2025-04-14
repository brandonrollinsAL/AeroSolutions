import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePlatform } from '@/hooks/usePlatform';
import { apiRequest } from '@/lib/queryClient';

interface PlatformIssue {
  platform: string;
  issueType: string;
  affectedComponents: string[];
  description: string;
  recommendedFix: string;
  priority: 'high' | 'medium' | 'low';
  occurrences: number;
}

interface PlatformSummary {
  mostAffectedPlatforms: string[];
  mostAffectedComponents: string[];
  criticalIssues: number;
  topRecommendations: string[];
}

interface PlatformAnalysis {
  platformIssues: PlatformIssue[];
  summary: PlatformSummary;
}

interface PlatformCompatibilityContextType {
  platform: ReturnType<typeof usePlatform>;
  platformIssues: PlatformIssue[];
  isAnalyzing: boolean;
  lastAnalyzed: Date | null;
  analyzePlatformIssues: () => Promise<void>;
  getSolutionForComponent: (componentName: string) => PlatformIssue | null;
}

const PlatformCompatibilityContext = createContext<PlatformCompatibilityContextType | null>(null);

interface PlatformCompatibilityProviderProps {
  children: ReactNode;
}

export const PlatformCompatibilityProvider: React.FC<PlatformCompatibilityProviderProps> = ({ children }) => {
  const platform = usePlatform();
  const [platformAnalysis, setPlatformAnalysis] = useState<PlatformAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);
  
  // Function to fetch platform issues from the server
  const analyzePlatformIssues = async () => {
    try {
      setIsAnalyzing(true);
      const response = await apiRequest('GET', '/api/platform-compatibility/platform-issues');
      const data = await response.json();
      setPlatformAnalysis(data);
      setLastAnalyzed(new Date());
    } catch (error) {
      console.error('Failed to analyze platform issues:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Get a solution for a specific component
  const getSolutionForComponent = (componentName: string): PlatformIssue | null => {
    if (!platformAnalysis?.platformIssues) return null;
    
    // Find issues that affect this component
    const issues = platformAnalysis.platformIssues.filter(
      issue => issue.affectedComponents.includes(componentName)
    );
    
    // Sort by priority (high first)
    const sortedIssues = issues.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    return sortedIssues.length > 0 ? sortedIssues[0] : null;
  };
  
  // Apply global platform-specific styles
  useEffect(() => {
    // Add platform-specific CSS classes to the document body
    const body = document.body;
    body.classList.add(`platform-${platform.type}`);
    
    if (platform.isMobile) body.classList.add('mobile');
    if (platform.isTablet) body.classList.add('tablet');
    if (platform.isDesktop) body.classList.add('desktop');
    if (platform.isTouch) body.classList.add('touch-device');
    if (platform.browser) body.classList.add(`browser-${platform.browser.toLowerCase()}`);
    if (platform.os) body.classList.add(`os-${platform.os.toLowerCase().replace(/\s+/g, '-')}`);
    
    // Apply CSS variables for platform-specific adjustments
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--touch-target-size', platform.isTouch ? '44px' : '32px');
    rootStyle.setProperty('--scrollbar-width', platform.type === 'ios' ? '0px' : '8px');
    
    return () => {
      // Cleanup classes when unmounted
      body.classList.remove(`platform-${platform.type}`);
      body.classList.remove('mobile', 'tablet', 'desktop', 'touch-device');
      if (platform.browser) body.classList.remove(`browser-${platform.browser.toLowerCase()}`);
      if (platform.os) body.classList.remove(`os-${platform.os.toLowerCase().replace(/\s+/g, '-')}`);
    };
  }, [platform]);
  
  return (
    <PlatformCompatibilityContext.Provider
      value={{
        platform,
        platformIssues: platformAnalysis?.platformIssues || [],
        isAnalyzing,
        lastAnalyzed,
        analyzePlatformIssues,
        getSolutionForComponent,
      }}
    >
      {children}
    </PlatformCompatibilityContext.Provider>
  );
};

export const usePlatformCompatibility = () => {
  const context = useContext(PlatformCompatibilityContext);
  if (!context) {
    throw new Error('usePlatformCompatibility must be used within a PlatformCompatibilityProvider');
  }
  return context;
};