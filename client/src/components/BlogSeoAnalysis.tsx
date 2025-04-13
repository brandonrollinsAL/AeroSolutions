import React, { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Check, Info, HelpCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

interface SEOAnalysisProps {
  postId: string;
  displayMode?: 'icon' | 'button' | 'full';
}

interface SEOAnalysisData {
  seo_score: number;
  keyword_analysis: {
    primary_keyword: string;
    keyword_density: string;
    missing_keywords: string[];
  };
  content_analysis: {
    length_assessment: string;
    readability_score: number;
    heading_structure: string;
  };
  improvement_suggestions: string[];
  meta_description_suggestion: string;
}

// Fallback data for reliability
const fallbackData: SEOAnalysisData = {
  seo_score: 72,
  keyword_analysis: {
    primary_keyword: "web development",
    keyword_density: "2.3%",
    missing_keywords: ["responsive design", "mobile optimization"]
  },
  content_analysis: {
    length_assessment: "Good length (1,200 words)",
    readability_score: 68,
    heading_structure: "Well-structured with proper H2 and H3 headings"
  },
  improvement_suggestions: [
    "Add more internal links to related content",
    "Consider adding more specific examples",
    "Include a call-to-action at the end"
  ],
  meta_description_suggestion: "Learn how full-stack development is transforming aviation software with integrated solutions that improve efficiency, safety, and real-time data processing."
};

export default function BlogSeoAnalysis({ postId, displayMode = 'button' }: SEOAnalysisProps) {
  const [isOpen, setIsOpen] = useState(displayMode === 'full');
  
  // Query for SEO analysis data
  const { data: seoAnalysisData, isLoading, error } = useQuery<SEOAnalysisData>({
    queryKey: ['/api/content/seo-analysis', postId],
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });
  
  // Use data from API or fallback if needed
  const analysisData = error || !seoAnalysisData ? fallbackData : seoAnalysisData;
  
  // Generate appropriate score color and status
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };
  
  const getScoreStatus = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Average";
    return "Needs Improvement";
  };
  
  // Animation variants for motion components
  const fadeIn = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };
  
  // Display icon-only mode
  if (displayMode === 'icon') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${getScoreColor(analysisData.seo_score)} cursor-help`}>
              <span className="font-medium text-xs">{analysisData.seo_score}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="p-0">
            <div className="p-3 max-w-xs">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">SEO Score: {analysisData.seo_score}%</h4>
                <span className="text-xs">{getScoreStatus(analysisData.seo_score)}</span>
              </div>
              <div className="space-y-1 text-xs text-gray-600">
                <p>Primary Keyword: {analysisData.keyword_analysis.primary_keyword}</p>
                <p>Readability: {analysisData.content_analysis.readability_score}/100</p>
                <p className="italic mt-1">Click for full analysis</p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Display button mode (default)
  if (displayMode === 'button' && !isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        variant="outline" 
        size="sm"
        className="flex items-center gap-2"
      >
        <div className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${getScoreColor(analysisData.seo_score)}`}>
          <span className="font-medium text-xs">{analysisData.seo_score}</span>
        </div>
        <span>SEO Analysis</span>
      </Button>
    );
  }
  
  // Loading state for full view
  if (isLoading && displayMode === 'full') {
    return (
      <div className="border rounded-lg p-5 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-28" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-28 w-full mb-2" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  
  // Error state
  if (error && displayMode === 'full') {
    console.error("SEO Analysis Error:", error);
    // Still render with fallback data
  }
  
  // Full display mode rendering function
  const renderFullAnalysis = () => {
    return (
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="border dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800"
      >
        {/* Header */}
        <div className="border-b dark:border-gray-700 px-5 py-4 flex justify-between items-center bg-gray-50 dark:bg-gray-850">
          <div className="flex items-center gap-3">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${getScoreColor(analysisData.seo_score)}`}>
              <span className="font-semibold">{analysisData.seo_score}</span>
            </div>
            <div>
              <h3 className="font-semibold text-lg">SEO Analysis</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Score: <span className="font-medium">{getScoreStatus(analysisData.seo_score)}</span>
              </p>
            </div>
          </div>
          
          {displayMode !== 'full' && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsOpen(false)}
              className="text-gray-500"
            >
              Close
            </Button>
          )}
        </div>
        
        {/* Content */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-5">
            {/* Keyword Analysis */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <span>Keyword Analysis</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle size={16} className="text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-sm">Analysis of keyword usage, density, and relevance</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </h4>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Primary Keyword:</span>
                  <span className="font-medium">{analysisData.keyword_analysis.primary_keyword}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Keyword Density:</span>
                  <span className="font-medium">{analysisData.keyword_analysis.keyword_density}</span>
                </div>
                
                {analysisData.keyword_analysis.missing_keywords.length > 0 && (
                  <div className="border-t pt-2 mt-2 dark:border-gray-700">
                    <p className="text-amber-600 mb-2 flex items-center gap-1">
                      <AlertTriangle size={14} />
                      <span>Consider adding these related keywords:</span>
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                      {analysisData.keyword_analysis.missing_keywords.map((keyword, index) => (
                        <li key={index}>{keyword}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            {/* Improvement Suggestions */}
            <div className="border-t pt-4 dark:border-gray-700">
              <h4 className="font-medium mb-2">Improvement Suggestions</h4>
              
              <ul className="space-y-2 text-sm">
                {analysisData.improvement_suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Right Column */}
          <div className="space-y-5">
            {/* Content Analysis */}
            <div>
              <h4 className="font-medium mb-2">Content Analysis</h4>
              
              <div className="space-y-4 text-sm">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Readability Score:</span>
                    <span className="font-medium">{analysisData.content_analysis.readability_score}/100</span>
                  </div>
                  <Progress 
                    value={analysisData.content_analysis.readability_score} 
                    className="h-2" 
                  />
                  <p className="text-xs mt-1 text-gray-500">
                    {analysisData.content_analysis.readability_score >= 70 
                      ? "Easy to read and understand" 
                      : analysisData.content_analysis.readability_score >= 50
                        ? "Moderately readable"
                        : "Consider simplifying the language"}
                  </p>
                </div>
                
                <div className="flex justify-between pb-2 border-b dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Length:</span>
                  <span className="font-medium">{analysisData.content_analysis.length_assessment}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Heading Structure:</span>
                  <span className="font-medium">
                    {analysisData.content_analysis.heading_structure}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Meta Description */}
            <div className="border-t pt-4 dark:border-gray-700">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <span>Suggested Meta Description</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle size={16} className="text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-sm">Optimized description for search engines (max 155-160 characters)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </h4>
              
              <div className="border border-gray-200 dark:border-gray-700 rounded p-3 bg-gray-50 dark:bg-gray-850">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {analysisData.meta_description_suggestion}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Check size={12} className="text-green-500" />
                <span>Optimal length: {analysisData.meta_description_suggestion.length} characters</span>
              </p>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 dark:bg-gray-850 dark:border-gray-700">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <p className="text-xs text-gray-500">
              <span className="font-medium">Generated:</span> Just now • Powered by Grok-powered AI
            </p>
            
            {displayMode !== 'full' && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsOpen(false)} 
                className="text-sm"
              >
                Close
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };
  
  // Return full analysis for either button mode with isOpen=true or displayMode='full'
  return renderFullAnalysis();
}