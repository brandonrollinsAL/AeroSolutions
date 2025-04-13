import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Search, RefreshCw, Sparkles, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion } from 'framer-motion';

interface BlogSeoOptimizerProps {
  postId: string | number;
  preview?: boolean;
}

export default function BlogSeoOptimizer({ postId, preview = false }: BlogSeoOptimizerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('analysis');
  const [seoData, setSeoData] = useState<{
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
    schemaMarkup?: string;
    focusKeyword?: string;
    canonicalUrl?: string;
  }>({});
  
  const { toast } = useToast();
  
  // Query for blog SEO analysis
  const {
    data: seoAnalysis,
    isLoading: isAnalysisLoading,
    isError: isAnalysisError,
    refetch: refetchAnalysis
  } = useQuery({
    queryKey: ['/api/seo/blog-analysis', postId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/seo/blog-analysis/${postId}`);
      return response.json();
    },
    enabled: dialogOpen // Only fetch when dialog is open
  });
  
  // Mutation for updating blog post SEO
  const updateSeoMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/seo/update-blog-seo/${postId}`, seoData);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'SEO Data Updated',
          description: 'Your blog post SEO has been optimized successfully.',
          variant: 'default'
        });
        setDialogOpen(false);
      } else {
        toast({
          title: 'Update Failed',
          description: data.message || 'Failed to update SEO data.',
          variant: 'destructive'
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: 'An error occurred while updating SEO data.',
        variant: 'destructive'
      });
      console.error('SEO update error:', error);
    }
  });
  
  // Handle input change for SEO data fields
  const handleInputChange = (field: string, value: string) => {
    setSeoData((prev) => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Apply recommendations from analysis
  const applyRecommendations = () => {
    if (!seoAnalysis) return;
    
    setSeoData({
      seoTitle: seoAnalysis.keyword_analysis?.primary_keyword 
        ? `${seoAnalysis.keyword_analysis.primary_keyword} - Blog Post | Elevion`
        : undefined,
      seoDescription: seoAnalysis.meta_description_suggestion,
      seoKeywords: seoAnalysis.keyword_analysis?.primary_keyword +
        (seoAnalysis.keyword_analysis?.missing_keywords?.length > 0 
          ? ', ' + seoAnalysis.keyword_analysis.missing_keywords.join(', ')
          : ''),
      focusKeyword: seoAnalysis.keyword_analysis?.primary_keyword,
    });
    
    setActiveTab('customize');
    
    toast({
      title: 'Recommendations Applied',
      description: 'You can now review and make further adjustments to the SEO data.',
    });
  };
  
  // Generate schema markup
  const generateSchemaMutation = useMutation({
    mutationFn: async () => {
      // Using existing blog post data + focus keyword
      const response = await apiRequest('POST', '/api/seo/generate-schema', {
        contentType: 'blog',
        contentData: {
          title: seoData.seoTitle,
          author: 'Elevion',
          datePublished: new Date().toISOString(),
          description: seoData.seoDescription,
          keywords: seoData.seoKeywords,
          focusKeyword: seoData.focusKeyword
        }
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.schemaMarkup) {
        setSeoData((prev) => ({
          ...prev,
          schemaMarkup: data.schemaMarkup
        }));
        
        toast({
          title: 'Schema Generated',
          description: 'JSON-LD schema markup has been generated for your blog post.',
        });
      } else {
        toast({
          title: 'Schema Generation Failed',
          description: data.message || 'Failed to generate schema markup.',
          variant: 'destructive'
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Schema Generation Failed',
        description: 'An error occurred while generating schema markup.',
        variant: 'destructive'
      });
      console.error('Schema generation error:', error);
    }
  });
  
  // Get score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };
  
  // Render score indicator
  const renderScoreIndicator = (score: number) => (
    <div className="flex items-center gap-2">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${getScoreColor(score)}`}>
        <span className="font-semibold">{score}</span>
      </div>
      <div>
        <p className="font-medium">SEO Score</p>
        <p className="text-sm text-gray-500">
          {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Improvement'}
        </p>
      </div>
    </div>
  );
  
  // Render skeleton loading state
  const renderSkeletonLoading = () => (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-16 mt-1" />
        </div>
      </div>
      <Skeleton className="h-8 w-full mt-4" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  );
  
  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        variant="outline"
        size="sm"
        className="flex items-center gap-2 text-slate-blue-600 border-slate-blue-200 hover:bg-slate-blue-50"
      >
        <Search className="h-3.5 w-3.5" />
        <span>{preview ? 'SEO Analysis' : 'Optimize SEO'}</span>
      </Button>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-slate-blue-500" />
              Blog SEO Optimization
            </DialogTitle>
            <DialogDescription>
              Analyze and optimize your blog post for better search engine visibility.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="analysis">SEO Analysis</TabsTrigger>
              <TabsTrigger value="customize">Customize SEO</TabsTrigger>
              <TabsTrigger value="schema">Schema Markup</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analysis" className="mt-4">
              {isAnalysisLoading ? (
                renderSkeletonLoading()
              ) : isAnalysisError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to load SEO analysis. Please try again later.
                  </AlertDescription>
                </Alert>
              ) : seoAnalysis ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Score */}
                  <div className="flex justify-between items-center">
                    {renderScoreIndicator(seoAnalysis.seo_score)}
                    <Button
                      onClick={applyRecommendations}
                      size="sm"
                      className="bg-slate-blue-600 hover:bg-slate-blue-700"
                    >
                      <ArrowUpRight className="w-4 h-4 mr-2" />
                      Apply Recommendations
                    </Button>
                  </div>
                  
                  {/* Keyword Analysis */}
                  <div className="border rounded-md p-4 bg-slate-50">
                    <h3 className="font-medium text-lg mb-3">Keyword Analysis</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Primary Keyword:</span>
                        <Badge variant="outline" className="bg-slate-blue-50 text-slate-blue-700 border-slate-blue-200">
                          {seoAnalysis.keyword_analysis.primary_keyword}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-slate-600">Keyword Density:</span>
                        <span className="font-medium">{seoAnalysis.keyword_analysis.keyword_density}</span>
                      </div>
                      
                      {seoAnalysis.keyword_analysis.missing_keywords?.length > 0 && (
                        <div className="pt-2 mt-2 border-t">
                          <p className="text-amber-600 mb-2 flex items-center gap-1">
                            <AlertTriangle size={14} />
                            <span>Consider adding these related keywords:</span>
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {seoAnalysis.keyword_analysis.missing_keywords.map((keyword, index) => (
                              <Badge key={index} variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Content Analysis */}
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium text-lg mb-3">Content Analysis</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-slate-600">Readability Score:</span>
                          <span className="font-medium">{seoAnalysis.content_analysis.readability_score}/100</span>
                        </div>
                        <Progress 
                          value={seoAnalysis.content_analysis.readability_score} 
                          className="h-2" 
                        />
                        <p className="text-xs mt-1 text-slate-500">
                          {seoAnalysis.content_analysis.readability_score >= 70 
                            ? "Easy to read and understand" 
                            : seoAnalysis.content_analysis.readability_score >= 50
                              ? "Moderately readable"
                              : "Consider simplifying the language"}
                        </p>
                      </div>
                      
                      <div className="flex justify-between pb-2 border-b">
                        <span className="text-slate-600">Length:</span>
                        <span className="font-medium">{seoAnalysis.content_analysis.length_assessment}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-slate-600">Heading Structure:</span>
                        <span className="font-medium">
                          {seoAnalysis.content_analysis.heading_structure}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Improvement Suggestions */}
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium text-lg mb-3">Improvement Suggestions</h3>
                    <ul className="space-y-2">
                      {seoAnalysis.improvement_suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertCircle size={16} className="text-slate-blue-500 mt-0.5 shrink-0" />
                          <span className="text-slate-700">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Suggested Meta Description */}
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium text-lg mb-3">Suggested Meta Description</h3>
                    <div className="border p-3 rounded bg-slate-50 text-slate-700">
                      {seoAnalysis.meta_description_suggestion}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {seoAnalysis.meta_description_suggestion.length} characters (Recommended: 150-160)
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="p-8 text-center">
                  <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-700 mb-2">No Analysis Data</h3>
                  <p className="text-slate-500 mb-4">
                    We couldn't find SEO analysis for this blog post. Refresh to try again.
                  </p>
                  <Button onClick={() => refetchAnalysis()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Analysis
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="customize" className="mt-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="seo-title" className="text-sm font-medium text-slate-700 mb-1 block">
                    SEO Title <span className="text-xs text-slate-500">(50-60 characters)</span>
                  </Label>
                  <Input
                    id="seo-title"
                    value={seoData.seoTitle || ''}
                    onChange={(e) => handleInputChange('seoTitle', e.target.value)}
                    className="w-full"
                    maxLength={70}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    {(seoData.seoTitle?.length || 0)} characters
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="seo-description" className="text-sm font-medium text-slate-700 mb-1 block">
                    Meta Description <span className="text-xs text-slate-500">(150-160 characters)</span>
                  </Label>
                  <Textarea
                    id="seo-description"
                    value={seoData.seoDescription || ''}
                    onChange={(e) => handleInputChange('seoDescription', e.target.value)}
                    className="w-full h-24"
                    maxLength={170}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    {(seoData.seoDescription?.length || 0)} characters
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="seo-keywords" className="text-sm font-medium text-slate-700 mb-1 block">
                    Keywords <span className="text-xs text-slate-500">(comma-separated)</span>
                  </Label>
                  <Input
                    id="seo-keywords"
                    value={seoData.seoKeywords || ''}
                    onChange={(e) => handleInputChange('seoKeywords', e.target.value)}
                    className="w-full"
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
                
                <div>
                  <Label htmlFor="focus-keyword" className="text-sm font-medium text-slate-700 mb-1 block">
                    Focus Keyword <span className="text-xs text-slate-500">(main keyword)</span>
                  </Label>
                  <Input
                    id="focus-keyword"
                    value={seoData.focusKeyword || ''}
                    onChange={(e) => handleInputChange('focusKeyword', e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <Label htmlFor="canonical-url" className="text-sm font-medium text-slate-700 mb-1 block">
                    Canonical URL <span className="text-xs text-slate-500">(for duplicate content)</span>
                  </Label>
                  <Input
                    id="canonical-url"
                    value={seoData.canonicalUrl || ''}
                    onChange={(e) => handleInputChange('canonicalUrl', e.target.value)}
                    className="w-full"
                    placeholder="https://elevion.com/blog/my-post"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Leave empty if this is the primary version of the content
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="schema" className="mt-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-lg">JSON-LD Schema Markup</h3>
                  <Button
                    onClick={() => generateSchemaMutation.mutate()}
                    disabled={generateSchemaMutation.isPending || !seoData.seoTitle}
                    size="sm"
                    variant="outline"
                  >
                    {generateSchemaMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Schema'
                    )}
                  </Button>
                </div>
                
                {!seoData.seoTitle && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Required Information Missing</AlertTitle>
                    <AlertDescription>
                      Please fill in the SEO Title and other fields in the "Customize SEO" tab before generating schema.
                    </AlertDescription>
                  </Alert>
                )}
                
                <Textarea
                  value={seoData.schemaMarkup || ''}
                  onChange={(e) => handleInputChange('schemaMarkup', e.target.value)}
                  className="w-full h-60 font-mono text-xs"
                  placeholder='{ "@context": "https://schema.org", "@type": "BlogPosting", ... }'
                />
                
                <div className="text-xs text-slate-500 space-y-1">
                  <p>Schema markup helps search engines understand your content better.</p>
                  <p>This JSON-LD code will be added to the page's HTML.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button
              onClick={() => updateSeoMutation.mutate()}
              disabled={updateSeoMutation.isPending}
              className="bg-slate-blue-600 hover:bg-slate-blue-700"
            >
              {updateSeoMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save SEO Data'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}