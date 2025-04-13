import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Check, Search, ExternalLink, Lightbulb } from 'lucide-react';

interface SeoStrategyProps {
  websiteUrl?: string;
  initialContent?: string;
}

// Define the SEO strategy response interface
interface SeoStrategyResponse {
  success: boolean;
  seoStrategies: {
    overall_assessment: string;
    keyword_recommendations: {
      primary_keywords: string[];
      secondary_keywords: string[];
      keyword_placement_tips: string;
    };
    content_recommendations: {
      structure_improvements: string[];
      content_gaps: string[];
      readability_tips: string;
    };
    technical_seo: {
      meta_title: string;
      meta_description: string;
      url_structure: string;
      schema_markup: string;
    };
    link_building: {
      internal_linking: string[];
      external_linking: string[];
    };
    additional_strategies: string[];
  };
  timestamp: string;
  fallback?: boolean;
  error?: string;
}

export default function SeoStrategySuggestions({ websiteUrl, initialContent }: SeoStrategyProps) {
  const [websiteContent, setWebsiteContent] = useState(initialContent || '');
  const [activeTab, setActiveTab] = useState('form');
  const { toast } = useToast();

  // Mutation for submitting content and getting SEO strategies
  const seoStrategyMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('POST', '/api/marketplace/suggest-seo', { websiteContent: content });
      return response.json();
    },
    onSuccess: (data: SeoStrategyResponse) => {
      if (data.success) {
        setActiveTab('results');
        if (data.fallback) {
          toast({
            title: "Using general SEO strategies",
            description: "We couldn't analyze your specific content, so we're showing general best practices.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "SEO Strategy Analysis Complete",
            description: "We've analyzed your content and generated tailored SEO recommendations.",
            variant: "default",
          });
        }
      } else {
        toast({
          title: "Analysis Failed",
          description: data.error || "Unable to analyze your content. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze your content. Please try again later.",
        variant: "destructive",
      });
      console.error('SEO strategy error:', error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteContent.trim()) {
      toast({
        title: "Content Required",
        description: "Please provide your website content to analyze.",
        variant: "destructive",
      });
      return;
    }
    seoStrategyMutation.mutate(websiteContent);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg border-slate-200">
      <CardHeader className="bg-slate-50 border-b border-slate-100">
        <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Search className="w-5 h-5 text-electric-cyan-600" />
          SEO Strategy Suggestions
        </CardTitle>
        <CardDescription>
          Get AI-powered recommendations to improve your website's search engine visibility
        </CardDescription>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6 pt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form">Website Content</TabsTrigger>
            <TabsTrigger value="results" disabled={!seoStrategyMutation.data}>Results</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="form" className="p-6 pt-4">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="websiteContent" className="block text-sm font-medium text-slate-700 mb-1">
                  Paste your website content below for analysis
                </label>
                <Textarea
                  id="websiteContent"
                  value={websiteContent}
                  onChange={(e) => setWebsiteContent(e.target.value)}
                  placeholder="Enter your website content, including headings, paragraphs, product descriptions, etc."
                  className="min-h-[200px]"
                />
                <p className="mt-1 text-xs text-slate-500">
                  For best results, include as much content as possible from your website.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button 
                type="submit" 
                disabled={seoStrategyMutation.isPending || !websiteContent.trim()}
                className="bg-gradient-to-r from-slate-blue-600 to-electric-cyan-600 hover:from-slate-blue-700 hover:to-electric-cyan-700"
              >
                {seoStrategyMutation.isPending ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    Analyzing...
                  </>
                ) : (
                  <>Analyze Content</>
                )}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="results" className="p-6 pt-4">
          {seoStrategyMutation.isPending ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : seoStrategyMutation.data ? (
            <div className="space-y-6">
              {/* Overall Assessment */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 className="font-medium text-lg text-slate-800 mb-2 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-sunset-orange-500" />
                  Overall Assessment
                </h3>
                <p className="text-slate-700">{seoStrategyMutation.data.seoStrategies.overall_assessment}</p>
                
                {seoStrategyMutation.data.fallback && (
                  <div className="mt-3 flex items-start gap-2 text-amber-600 bg-amber-50 p-3 rounded-md text-sm">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Using general SEO best practices</p>
                      <p className="text-amber-700 mt-1">We couldn't analyze your specific content, so we're showing general recommendations that work for most websites.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* SEO Strategy Details */}
              <Accordion type="single" collapsible className="w-full">
                {/* Keywords */}
                <AccordionItem value="keywords">
                  <AccordionTrigger className="text-slate-800 hover:text-slate-blue-600">
                    Keyword Recommendations
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-2">
                      <div>
                        <h4 className="font-medium text-sm text-slate-700 mb-2">Primary Keywords</h4>
                        <div className="flex flex-wrap gap-2">
                          {seoStrategyMutation.data.seoStrategies.keyword_recommendations.primary_keywords.map((keyword, index) => (
                            <Badge key={index} variant="outline" className="bg-slate-blue-50 text-slate-blue-700 border-slate-blue-200">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm text-slate-700 mb-2">Secondary Keywords</h4>
                        <div className="flex flex-wrap gap-2">
                          {seoStrategyMutation.data.seoStrategies.keyword_recommendations.secondary_keywords.map((keyword, index) => (
                            <Badge key={index} variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm text-slate-700 mb-2">Keyword Placement Tips</h4>
                        <p className="text-slate-600 text-sm">
                          {seoStrategyMutation.data.seoStrategies.keyword_recommendations.keyword_placement_tips}
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                {/* Content Recommendations */}
                <AccordionItem value="content">
                  <AccordionTrigger className="text-slate-800 hover:text-slate-blue-600">
                    Content Recommendations
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-2">
                      <div>
                        <h4 className="font-medium text-sm text-slate-700 mb-2">Structure Improvements</h4>
                        <ul className="space-y-2">
                          {seoStrategyMutation.data.seoStrategies.content_recommendations.structure_improvements.map((item, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <Check className="w-4 h-4 text-electric-cyan-600 mt-0.5 flex-shrink-0" />
                              <span className="text-slate-700">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm text-slate-700 mb-2">Content Gaps to Address</h4>
                        <ul className="space-y-2">
                          {seoStrategyMutation.data.seoStrategies.content_recommendations.content_gaps.map((item, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <span className="w-4 h-4 rounded-full bg-slate-blue-100 text-slate-blue-600 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">+</span>
                              <span className="text-slate-700">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm text-slate-700 mb-2">Readability Tips</h4>
                        <p className="text-slate-600 text-sm">
                          {seoStrategyMutation.data.seoStrategies.content_recommendations.readability_tips}
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                {/* Technical SEO */}
                <AccordionItem value="technical">
                  <AccordionTrigger className="text-slate-800 hover:text-slate-blue-600">
                    Technical SEO
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-2">
                      <div>
                        <h4 className="font-medium text-sm text-slate-700 mb-1">Suggested Meta Title</h4>
                        <div className="p-3 bg-slate-50 rounded border border-slate-200 text-sm text-slate-800">
                          {seoStrategyMutation.data.seoStrategies.technical_seo.meta_title}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm text-slate-700 mb-1">Suggested Meta Description</h4>
                        <div className="p-3 bg-slate-50 rounded border border-slate-200 text-sm text-slate-700">
                          {seoStrategyMutation.data.seoStrategies.technical_seo.meta_description}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm text-slate-700 mb-1">URL Structure</h4>
                        <p className="text-slate-600 text-sm">
                          {seoStrategyMutation.data.seoStrategies.technical_seo.url_structure}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm text-slate-700 mb-1">Schema Markup</h4>
                        <p className="text-slate-600 text-sm">
                          {seoStrategyMutation.data.seoStrategies.technical_seo.schema_markup}
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                {/* Link Building */}
                <AccordionItem value="links">
                  <AccordionTrigger className="text-slate-800 hover:text-slate-blue-600">
                    Link Building Strategies
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-2">
                      <div>
                        <h4 className="font-medium text-sm text-slate-700 mb-2">Internal Linking</h4>
                        <ul className="space-y-2">
                          {seoStrategyMutation.data.seoStrategies.link_building.internal_linking.map((item, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <ExternalLink className="w-4 h-4 text-electric-cyan-600 mt-0.5 flex-shrink-0" />
                              <span className="text-slate-700">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm text-slate-700 mb-2">External Linking</h4>
                        <ul className="space-y-2">
                          {seoStrategyMutation.data.seoStrategies.link_building.external_linking.map((item, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <ExternalLink className="w-4 h-4 text-slate-blue-600 mt-0.5 flex-shrink-0" />
                              <span className="text-slate-700">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                {/* Additional Strategies */}
                <AccordionItem value="additional">
                  <AccordionTrigger className="text-slate-800 hover:text-slate-blue-600">
                    Additional Strategies
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="p-2">
                      <ul className="space-y-2">
                        {seoStrategyMutation.data.seoStrategies.additional_strategies.map((item, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-sunset-orange-500 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-600">No SEO analysis data available. Submit your content to get started.</p>
              <Button 
                onClick={() => setActiveTab('form')} 
                variant="outline" 
                className="mt-4"
              >
                Go to Content Form
              </Button>
            </div>
          )}
          
          {seoStrategyMutation.data && (
            <div className="mt-6 text-center">
              <Button 
                onClick={() => setActiveTab('form')} 
                variant="outline" 
                className="text-slate-700"
              >
                Analyze Different Content
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <CardFooter className="bg-slate-50 border-t border-slate-100 flex justify-between items-center">
        <p className="text-xs text-slate-500">
          Analysis powered by Elevion's AI technology
        </p>
        <div className="flex space-x-2">
          <Badge variant="outline" className="bg-slate-blue-50 text-slate-blue-700 border-slate-blue-200">
            SEO
          </Badge>
          <Badge variant="outline" className="bg-electric-cyan-50 text-electric-cyan-700 border-electric-cyan-200">
            AI-Powered
          </Badge>
        </div>
      </CardFooter>
    </Card>
  );
}