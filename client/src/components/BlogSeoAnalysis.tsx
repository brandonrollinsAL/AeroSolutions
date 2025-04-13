import React, { useState, useEffect } from 'react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { 
  Progress 
} from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Search, Award, Book, CheckCircle, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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

const BlogSeoAnalysis: React.FC<SEOAnalysisProps> = ({ 
  postId,
  displayMode = 'icon'
}) => {
  const [seoData, setSeoData] = useState<SEOAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (displayMode === 'full') {
      fetchSeoAnalysis();
    }
  }, [postId, displayMode]);

  const fetchSeoAnalysis = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest('GET', `/api/content/seo-analysis/${postId}`);
      const data = await response.json();
      
      if (data.success && data.seoAnalysis) {
        setSeoData(data.seoAnalysis);
      } else {
        throw new Error(data.message || 'Failed to fetch SEO analysis');
      }
    } catch (err: any) {
      console.error('Error fetching SEO analysis:', err);
      setError(err.message || 'An error occurred while fetching SEO analysis');
      toast({
        title: "SEO Analysis Error",
        description: "Could not load SEO analysis. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpanded = () => {
    if (!isExpanded && !seoData) {
      fetchSeoAnalysis();
    }
    setIsExpanded(!isExpanded);
  };

  const getSeoScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const renderSeoScoreBadge = () => {
    if (!seoData) return null;
    
    let color = "bg-gray-200 text-gray-700";
    if (seoData.seo_score >= 80) color = "bg-green-100 text-green-800";
    else if (seoData.seo_score >= 60) color = "bg-yellow-100 text-yellow-800";
    else color = "bg-red-100 text-red-800";
    
    return (
      <Badge className={`${color} hover:${color} ml-2`}>
        SEO Score: {seoData.seo_score}
      </Badge>
    );
  };

  // Icon-only mode - just shows an icon with a tooltip
  if (displayMode === 'icon') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-0 h-8 w-8" 
              onClick={!seoData ? fetchSeoAnalysis : undefined}
            >
              <Search className="h-4 w-4 text-slate-500" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            {isLoading ? (
              <span>Analyzing SEO...</span>
            ) : seoData ? (
              <div className="text-xs">
                <div className="font-semibold mb-1">
                  SEO Score: {seoData.seo_score}/100
                </div>
                <div className="flex items-center mb-1">
                  <Progress value={seoData.seo_score} className="h-1 w-full" />
                </div>
                <div className="text-xs">
                  <span className="font-semibold">Primary Keyword:</span> {seoData.keyword_analysis.primary_keyword}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Click for detailed analysis
                </div>
              </div>
            ) : (
              <span>Click to analyze SEO</span>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Button mode - shows a button that expands to full analysis when clicked
  if (displayMode === 'button') {
    return (
      <div className="w-full">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-between"
          onClick={toggleExpanded}
        >
          <span className="flex items-center">
            <Search className="h-4 w-4 mr-2" />
            SEO Analysis
            {seoData && renderSeoScoreBadge()}
          </span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        
        {isExpanded && (
          <Card className="mt-2 border-slate-200 shadow-sm">
            {renderFullAnalysis()}
          </Card>
        )}
      </div>
    );
  }

  // Full mode - always shows the complete analysis
  const renderFullAnalysis = () => {
    if (isLoading) {
      return (
        <CardContent className="py-4">
          <div className="flex justify-center items-center h-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      );
    }
    
    if (error) {
      return (
        <CardContent className="py-4">
          <div className="text-center text-red-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      );
    }
    
    if (!seoData) {
      return (
        <CardContent className="py-4">
          <div className="text-center">
            <Search className="h-8 w-8 mx-auto mb-2 text-slate-400" />
            <p className="text-slate-600">No SEO analysis available</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={fetchSeoAnalysis}
            >
              Analyze SEO
            </Button>
          </div>
        </CardContent>
      );
    }
    
    return (
      <>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Award className="h-5 w-5 mr-2 text-primary" />
            SEO Analysis
          </CardTitle>
          <CardDescription>
            Powered by AI to improve search engine visibility
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-sm">SEO Score</span>
              <span className={`font-bold ${seoData.seo_score >= 80 ? 'text-green-600' : seoData.seo_score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {seoData.seo_score}/100
              </span>
            </div>
            <Progress value={seoData.seo_score} className={`h-2 ${getSeoScoreColor(seoData.seo_score)}`} />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="border rounded-md p-3">
              <h4 className="font-semibold text-sm mb-1 flex items-center">
                <Book className="h-4 w-4 mr-1 text-blue-600" />
                Content Quality
              </h4>
              <div className="text-xs space-y-2">
                <div>
                  <span className="text-slate-600">Length:</span> {seoData.content_analysis.length_assessment}
                </div>
                <div>
                  <span className="text-slate-600">Readability:</span> {seoData.content_analysis.readability_score}/100
                </div>
                <div>
                  <span className="text-slate-600">Headings:</span> {seoData.content_analysis.heading_structure}
                </div>
              </div>
            </div>
            
            <div className="border rounded-md p-3">
              <h4 className="font-semibold text-sm mb-1 flex items-center">
                <Search className="h-4 w-4 mr-1 text-green-600" />
                Keyword Analysis
              </h4>
              <div className="text-xs space-y-2">
                <div>
                  <span className="text-slate-600">Primary:</span> {seoData.keyword_analysis.primary_keyword}
                </div>
                <div>
                  <span className="text-slate-600">Density:</span> {seoData.keyword_analysis.keyword_density}
                </div>
                <div>
                  <span className="text-slate-600">Missing:</span> {seoData.keyword_analysis.missing_keywords.slice(0, 2).join(', ')}
                  {seoData.keyword_analysis.missing_keywords.length > 2 && '...'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="border rounded-md p-3 mb-4">
            <h4 className="font-semibold text-sm mb-2 flex items-center">
              <CheckCircle className="h-4 w-4 mr-1 text-orange-600" />
              Improvement Suggestions
            </h4>
            <ul className="text-xs space-y-1 list-disc pl-4">
              {seoData.improvement_suggestions.slice(0, 5).map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
          
          <div className="border rounded-md p-3">
            <h4 className="font-semibold text-sm mb-1">Suggested Meta Description</h4>
            <p className="text-xs text-slate-700 italic">
              "{seoData.meta_description_suggestion}"
            </p>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <p className="text-xs text-slate-500 w-full text-center">
            Updated {new Date().toLocaleDateString()}
          </p>
        </CardFooter>
      </>
    );
  };

  // Full display mode
  return (
    <Card className="w-full border-slate-200 shadow-sm">
      {renderFullAnalysis()}
    </Card>
  );
};

export default BlogSeoAnalysis;