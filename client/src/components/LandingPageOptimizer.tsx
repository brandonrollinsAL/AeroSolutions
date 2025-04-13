import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2, CheckCircle, AlertTriangle, BarChart, Code, Lightbulb, Clock, ThumbsUp, Eye } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

type OptimizationRecommendations = {
  summary: string;
  contentRecommendations: {
    recommendation: string;
    impact: string;
    complexity: string;
  }[];
  layoutRecommendations: {
    recommendation: string;
    impact: string;
    complexity: string;
  }[];
  ctaRecommendations: {
    recommendation: string;
    impact: string;
    complexity: string;
  }[];
  deviceOptimizations: {
    deviceType: string;
    recommendations: string[];
  }[];
  abTestingSuggestions: {
    testName: string;
    variantA: string;
    variantB: string;
    hypothesis: string;
    metrics: string[];
  }[];
  prioritizedActions: {
    action: string;
    expectedImpact: string;
    timeframe: string;
  }[];
};

type OptimizationConfig = {
  content?: {
    headline?: string;
    valueProposition?: string;
    keyMessages?: string[];
    ctaText?: string;
    ctaStyle?: string;
    contentBlocks?: {
      type: string;
      content: string;
    }[];
  };
  layout?: {
    orderOfSections?: string[];
    heroImagePosition?: string;
    ctaPosition?: string;
    navigationStyle?: string;
  };
  styling?: {
    colorAccents?: string[];
    fontEmphasis?: string;
    mobileAdjustments?: string[];
  };
};

interface LandingPageOptimizerProps {
  pagePath: string;
  isAdmin?: boolean;
  onApplyOptimizations?: (optimizations: OptimizationConfig) => void;
}

export default function LandingPageOptimizer({ 
  pagePath, 
  isAdmin = false,
  onApplyOptimizations 
}: LandingPageOptimizerProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedTab, setSelectedTab] = useState('recommendations');
  const [selectedOptimizations, setSelectedOptimizations] = useState<OptimizationConfig>({});
  const { toast } = useToast();
  const [location] = useLocation();
  
  // Clean page path to match server expectations
  const cleanPagePath = pagePath || location.split('?')[0];
  const encodedPagePath = encodeURIComponent(cleanPagePath);
  
  // Fetch optimization recommendations
  const { 
    data: optimizationData,
    isLoading: isLoadingOptimizations,
    error: optimizationError,
    refetch: refetchOptimizations
  } = useQuery<{
    success: boolean;
    pagePath: string;
    period: string;
    metrics: {
      visits: number;
      avgTimeOnPage: string;
      avgScrollDepth: string;
      conversionRate: string;
      deviceBreakdown: Record<string, number>;
      browserBreakdown: Record<string, number>;
    };
    recommendations: OptimizationRecommendations;
  }>({
    queryKey: ['/api/landing-pages/optimize', encodedPagePath, selectedPeriod],
    enabled: !!encodedPagePath && isAdmin,
  });
  
  // Fetch active optimizations
  const { 
    data: activeOptimizationsData,
    isLoading: isLoadingActive 
  } = useQuery<{
    success: boolean;
    pagePath: string;
    variantId: string;
    optimizations: OptimizationConfig;
    appliedAt: string;
  }>({
    queryKey: ['/api/landing-pages/active-optimizations', encodedPagePath],
    enabled: !!encodedPagePath
  });
  
  // Apply selected optimizations
  const applyOptimizationsMutation = useMutation({
    mutationFn: async (optimizations: OptimizationConfig) => {
      const res = await apiRequest('POST', `/api/landing-pages/apply-optimization/${encodedPagePath}`, {
        optimizations,
        variantId: 'default'
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Optimizations applied",
        description: "The landing page optimizations have been applied successfully",
        variant: "default",
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: ['/api/landing-pages/active-optimizations', encodedPagePath]
      });
      
      // Call the handler if provided
      if (onApplyOptimizations) {
        onApplyOptimizations(selectedOptimizations);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to apply optimizations",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Apply active optimizations if available
  useEffect(() => {
    if (activeOptimizationsData?.optimizations && onApplyOptimizations) {
      onApplyOptimizations(activeOptimizationsData.optimizations);
    }
  }, [activeOptimizationsData, onApplyOptimizations]);
  
  // Track page view and engagement
  useEffect(() => {
    if (!cleanPagePath) return;
    
    let startTime = Date.now();
    let maxScrollDepth = 0;
    let interactionCount = 0;
    let clicks = 0;
    
    // Track scroll depth
    const handleScroll = () => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
      const clientHeight = document.documentElement.clientHeight || window.innerHeight;
      
      const scrollDepth = (scrollTop / (scrollHeight - clientHeight)) * 100;
      
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
      }
    };
    
    // Track clicks
    const handleClick = () => {
      clicks++;
    };
    
    // Track interactions (inputs, buttons, etc.)
    const handleInteraction = (event: Event) => {
      const target = event.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      
      if (['input', 'button', 'a', 'select', 'textarea'].includes(tagName)) {
        interactionCount++;
      }
    };
    
    // Register event listeners
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('click', handleClick);
    window.addEventListener('input', handleInteraction);
    window.addEventListener('change', handleInteraction);
    
    return () => {
      // Clean up event listeners
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('input', handleInteraction);
      window.removeEventListener('change', handleInteraction);
      
      // Calculate time on page
      const timeOnPage = (Date.now() - startTime) / 1000; // in seconds
      
      // Record engagement data if spent at least 2 seconds on the page
      if (timeOnPage >= 2) {
        // Get device and browser info
        const deviceType = /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
        
        // Determine browser
        const userAgent = navigator.userAgent;
        let browser = 'unknown';
        
        if (userAgent.indexOf('Chrome') !== -1) {
          browser = 'chrome';
        } else if (userAgent.indexOf('Firefox') !== -1) {
          browser = 'firefox';
        } else if (userAgent.indexOf('Safari') !== -1) {
          browser = 'safari';
        } else if (userAgent.indexOf('Edge') !== -1 || userAgent.indexOf('Edg') !== -1) {
          browser = 'edge';
        } else if (userAgent.indexOf('MSIE') !== -1 || userAgent.indexOf('Trident') !== -1) {
          browser = 'ie';
        }
        
        // Send engagement data to the server
        const engagementData = {
          pageUrl: window.location.href,
          path: cleanPagePath,
          clicks,
          timeOnPage,
          scrollDepth: maxScrollDepth,
          interactionCount,
          deviceType,
          browser
        };
        
        // Fire and forget engagement tracking
        fetch('/api/analytics/website-engagement', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(engagementData)
        }).catch(err => {
          console.error('Error tracking engagement:', err);
        });
      }
    };
  }, [cleanPagePath]);
  
  // Determine if we have data to show
  const hasOptimizationData = optimizationData?.recommendations && !isLoadingOptimizations;
  const hasActiveOptimizations = activeOptimizationsData?.optimizations && !isLoadingActive;
  
  // Handle toggling of optimization selections
  const toggleOptimization = (type: 'content' | 'layout' | 'cta', item: any) => {
    setSelectedOptimizations(prev => {
      const newOptimizations = { ...prev };
      
      // Handle different types of optimizations
      if (type === 'content') {
        const content = newOptimizations.content || {};
        if (content.keyMessages?.includes(item.recommendation)) {
          content.keyMessages = content.keyMessages.filter(m => m !== item.recommendation);
        } else {
          content.keyMessages = [...(content.keyMessages || []), item.recommendation];
        }
        newOptimizations.content = content;
      } else if (type === 'layout') {
        const layout = newOptimizations.layout || {};
        layout.orderOfSections = layout.orderOfSections || [];
        if (layout.orderOfSections.includes(item.recommendation)) {
          layout.orderOfSections = layout.orderOfSections.filter(s => s !== item.recommendation);
        } else {
          layout.orderOfSections = [...layout.orderOfSections, item.recommendation];
        }
        newOptimizations.layout = layout;
      } else if (type === 'cta') {
        const content = newOptimizations.content || {};
        if (content.ctaText === item.recommendation) {
          delete content.ctaText;
        } else {
          content.ctaText = item.recommendation;
        }
        newOptimizations.content = content;
      }
      
      return newOptimizations;
    });
  };
  
  // Handle applying all priority actions
  const applyPriorityActions = () => {
    if (!optimizationData?.recommendations.prioritizedActions) return;
    
    const newOptimizations: OptimizationConfig = {
      content: {
        keyMessages: []
      },
      layout: {
        orderOfSections: []
      },
      styling: {
        mobileAdjustments: []
      }
    };
    
    // Convert priority actions to optimizations
    optimizationData.recommendations.prioritizedActions.forEach(action => {
      // Extract action type from the text by checking keywords
      const actionText = action.action.toLowerCase();
      
      if (actionText.includes('content') || actionText.includes('message') || actionText.includes('headline')) {
        if (newOptimizations.content) {
          newOptimizations.content.keyMessages = [
            ...(newOptimizations.content.keyMessages || []),
            action.action
          ];
        }
      } else if (actionText.includes('layout') || actionText.includes('position') || actionText.includes('section')) {
        if (newOptimizations.layout) {
          newOptimizations.layout.orderOfSections = [
            ...(newOptimizations.layout.orderOfSections || []),
            action.action
          ];
        }
      } else if (actionText.includes('cta') || actionText.includes('call to action') || actionText.includes('button')) {
        if (newOptimizations.content) {
          newOptimizations.content.ctaText = action.action;
        }
      } else if (actionText.includes('mobile') || actionText.includes('responsive')) {
        if (newOptimizations.styling) {
          newOptimizations.styling.mobileAdjustments = [
            ...(newOptimizations.styling.mobileAdjustments || []),
            action.action
          ];
        }
      }
    });
    
    // Set the new optimizations
    setSelectedOptimizations(newOptimizations);
    
    // Apply them if handler is provided
    if (onApplyOptimizations) {
      applyOptimizationsMutation.mutate(newOptimizations);
    }
  };
  
  // If only for tracking (not admin), render nothing
  if (!isAdmin) {
    return null;
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Landing Page Optimizer</span>
          <Badge variant={hasActiveOptimizations ? "default" : "outline"}>
            {hasActiveOptimizations ? "Optimized" : "Not Optimized"}
          </Badge>
        </CardTitle>
        <CardDescription>
          AI-powered recommendations to improve this landing page based on real user engagement data
        </CardDescription>
      </CardHeader>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <div className="px-6">
          <TabsList className="w-full">
            <TabsTrigger value="recommendations" className="flex-1">
              <Lightbulb className="w-4 h-4 mr-2" />
              Recommendations
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex-1">
              <BarChart className="w-4 h-4 mr-2" />
              Metrics
            </TabsTrigger>
            <TabsTrigger value="implementation" className="flex-1">
              <Code className="w-4 h-4 mr-2" />
              Implementation
            </TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="pt-6">
          <TabsContent value="recommendations" className="space-y-4 mt-0">
            {isLoadingOptimizations ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">
                  Analyzing user engagement data...
                </p>
              </div>
            ) : optimizationError ? (
              <div className="flex flex-col items-center justify-center py-8">
                <AlertTriangle className="h-8 w-8 text-destructive mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Unable to load optimization recommendations
                </p>
                <Button variant="outline" size="sm" onClick={() => refetchOptimizations()}>
                  Try Again
                </Button>
              </div>
            ) : hasOptimizationData ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="font-medium text-lg">Performance Summary</h3>
                  <p className="text-sm text-muted-foreground">{optimizationData.recommendations.summary}</p>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-lg">Priority Actions</h3>
                    <Button 
                      size="sm" 
                      onClick={applyPriorityActions}
                      disabled={applyOptimizationsMutation.isPending}
                    >
                      {applyOptimizationsMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Apply All
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {optimizationData.recommendations.prioritizedActions.map((action, i) => (
                      <div key={i} className="flex items-start gap-3 bg-muted/50 p-3 rounded-md">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <ThumbsUp className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{action.action}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs font-normal">
                              Impact: {action.expectedImpact}
                            </Badge>
                            <Badge variant="outline" className="text-xs font-normal">
                              <Clock className="h-3 w-3 mr-1" />
                              {action.timeframe}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="font-medium">Content Recommendations</h3>
                    {optimizationData.recommendations.contentRecommendations.map((rec, i) => (
                      <div 
                        key={i} 
                        className={`flex items-start gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                          selectedOptimizations.content?.keyMessages?.includes(rec.recommendation)
                            ? 'bg-primary/10'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => toggleOptimization('content', rec)}
                      >
                        <div className="mt-0.5">
                          {selectedOptimizations.content?.keyMessages?.includes(rec.recommendation) ? (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border border-primary/30" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{rec.recommendation}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs font-normal">
                              Impact: {rec.impact}
                            </Badge>
                            <Badge variant="outline" className="text-xs font-normal">
                              Complexity: {rec.complexity}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="font-medium">Layout Recommendations</h3>
                    {optimizationData.recommendations.layoutRecommendations.map((rec, i) => (
                      <div 
                        key={i} 
                        className={`flex items-start gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                          selectedOptimizations.layout?.orderOfSections?.includes(rec.recommendation)
                            ? 'bg-primary/10'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => toggleOptimization('layout', rec)}
                      >
                        <div className="mt-0.5">
                          {selectedOptimizations.layout?.orderOfSections?.includes(rec.recommendation) ? (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border border-primary/30" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{rec.recommendation}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs font-normal">
                              Impact: {rec.impact}
                            </Badge>
                            <Badge variant="outline" className="text-xs font-normal">
                              Complexity: {rec.complexity}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-medium">CTA Recommendations</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {optimizationData.recommendations.ctaRecommendations.map((rec, i) => (
                      <div 
                        key={i} 
                        className={`flex items-start gap-2 p-3 rounded-md cursor-pointer transition-colors border ${
                          selectedOptimizations.content?.ctaText === rec.recommendation
                            ? 'bg-primary/10 border-primary/30'
                            : 'hover:bg-muted border-transparent'
                        }`}
                        onClick={() => toggleOptimization('cta', rec)}
                      >
                        <div className="mt-0.5">
                          {selectedOptimizations.content?.ctaText === rec.recommendation ? (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border border-primary/30" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{rec.recommendation}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Impact: {rec.impact} • Complexity: {rec.complexity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <h3 className="font-medium">A/B Testing Suggestions</h3>
                  <div className="space-y-4">
                    {optimizationData.recommendations.abTestingSuggestions.map((test, i) => (
                      <div key={i} className="border rounded-md p-4">
                        <h4 className="font-medium">{test.testName}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{test.hypothesis}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="bg-muted p-3 rounded-md">
                            <p className="text-sm font-medium">Variant A</p>
                            <p className="text-sm mt-1">{test.variantA}</p>
                          </div>
                          <div className="bg-muted p-3 rounded-md">
                            <p className="text-sm font-medium">Variant B</p>
                            <p className="text-sm mt-1">{test.variantB}</p>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <p className="text-xs text-muted-foreground">Metrics to track:</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {test.metrics.map((metric, j) => (
                              <Badge key={j} variant="secondary">{metric}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <Eye className="h-8 w-8 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  No engagement data available for this page yet
                </p>
                <p className="text-xs text-muted-foreground text-center max-w-md">
                  Recommendations will appear here once users start interacting with this page
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="metrics" className="space-y-6 mt-0">
            {isLoadingOptimizations ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">
                  Loading engagement metrics...
                </p>
              </div>
            ) : optimizationData?.metrics ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/50 p-4 rounded-md">
                    <p className="text-sm text-muted-foreground">Total Visits</p>
                    <p className="text-2xl font-bold">{optimizationData.metrics.visits}</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-md">
                    <p className="text-sm text-muted-foreground">Avg. Time on Page</p>
                    <p className="text-2xl font-bold">{optimizationData.metrics.avgTimeOnPage}</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-md">
                    <p className="text-sm text-muted-foreground">Avg. Scroll Depth</p>
                    <p className="text-2xl font-bold">{optimizationData.metrics.avgScrollDepth}</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-md">
                    <p className="text-sm text-muted-foreground">Conversion Rate</p>
                    <p className="text-2xl font-bold">{optimizationData.metrics.conversionRate}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="font-medium">Device Breakdown</h3>
                    <div className="space-y-3">
                      {Object.entries(optimizationData.metrics.deviceBreakdown).map(([device, count]) => {
                        const percentage = (count / optimizationData.metrics.visits) * 100;
                        return (
                          <div key={device} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="capitalize">{device}</span>
                              <span>{count} ({percentage.toFixed(1)}%)</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="font-medium">Browser Breakdown</h3>
                    <div className="space-y-3">
                      {Object.entries(optimizationData.metrics.browserBreakdown).map(([browser, count]) => {
                        const percentage = (count / optimizationData.metrics.visits) * 100;
                        return (
                          <div key={browser} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="capitalize">{browser}</span>
                              <span>{count} ({percentage.toFixed(1)}%)</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-medium">Device-Specific Optimizations</h3>
                  <div className="space-y-4">
                    {optimizationData.recommendations.deviceOptimizations.map((deviceOpt, i) => (
                      <div key={i} className="border rounded-md p-4">
                        <h4 className="font-medium capitalize">{deviceOpt.deviceType}</h4>
                        <ul className="mt-2 space-y-2">
                          {deviceOpt.recommendations.map((rec, j) => (
                            <li key={j} className="text-sm flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <Eye className="h-8 w-8 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  No engagement metrics available for this page yet
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="implementation" className="space-y-4 mt-0">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-lg">Selected Optimizations</h3>
              <div className="flex items-center gap-2">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setSelectedOptimizations({})}
                  disabled={Object.keys(selectedOptimizations).length === 0}
                >
                  Clear All
                </Button>
                <Button 
                  size="sm"
                  onClick={() => applyOptimizationsMutation.mutate(selectedOptimizations)}
                  disabled={
                    applyOptimizationsMutation.isPending || 
                    Object.keys(selectedOptimizations).length === 0
                  }
                >
                  {applyOptimizationsMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Apply Optimizations
                </Button>
              </div>
            </div>
            
            {Object.keys(selectedOptimizations).length === 0 ? (
              <div className="border border-dashed rounded-md p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No optimizations selected yet. Go to the Recommendations tab to select optimizations to apply.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedOptimizations.content && Object.keys(selectedOptimizations.content).length > 0 && (
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium">Content Optimizations</h4>
                    <div className="mt-3 space-y-3">
                      {selectedOptimizations.content.ctaText && (
                        <div>
                          <p className="text-sm font-medium">Call-to-Action</p>
                          <p className="text-sm mt-1 bg-muted/50 p-2 rounded">
                            {selectedOptimizations.content.ctaText}
                          </p>
                        </div>
                      )}
                      
                      {selectedOptimizations.content.keyMessages && selectedOptimizations.content.keyMessages.length > 0 && (
                        <div>
                          <p className="text-sm font-medium">Key Messages</p>
                          <ul className="mt-1 space-y-2">
                            {selectedOptimizations.content.keyMessages.map((message, i) => (
                              <li key={i} className="text-sm bg-muted/50 p-2 rounded">
                                {message}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {selectedOptimizations.layout && Object.keys(selectedOptimizations.layout).length > 0 && (
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium">Layout Optimizations</h4>
                    <div className="mt-3 space-y-3">
                      {selectedOptimizations.layout.orderOfSections && selectedOptimizations.layout.orderOfSections.length > 0 && (
                        <div>
                          <p className="text-sm font-medium">Section Ordering & Layout Changes</p>
                          <ul className="mt-1 space-y-2">
                            {selectedOptimizations.layout.orderOfSections.map((section, i) => (
                              <li key={i} className="text-sm bg-muted/50 p-2 rounded">
                                {section}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {selectedOptimizations.styling && Object.keys(selectedOptimizations.styling).length > 0 && (
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium">Styling Optimizations</h4>
                    <div className="mt-3 space-y-3">
                      {selectedOptimizations.styling.mobileAdjustments && selectedOptimizations.styling.mobileAdjustments.length > 0 && (
                        <div>
                          <p className="text-sm font-medium">Mobile Adjustments</p>
                          <ul className="mt-1 space-y-2">
                            {selectedOptimizations.styling.mobileAdjustments.map((adjustment, i) => (
                              <li key={i} className="text-sm bg-muted/50 p-2 rounded">
                                {adjustment}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {hasActiveOptimizations && (
              <div className="mt-6">
                <h3 className="font-medium text-lg mb-3">Currently Active Optimizations</h3>
                <div className="border rounded-md p-4 bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-muted-foreground">
                      Applied on {new Date(activeOptimizationsData.appliedAt).toLocaleDateString()} at {new Date(activeOptimizationsData.appliedAt).toLocaleTimeString()}
                    </p>
                    <Badge variant="outline">Active</Badge>
                  </div>
                  
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-64">
                    {JSON.stringify(activeOptimizationsData.optimizations, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Data period: 
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="ml-2 bg-background border rounded p-1 text-xs"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => refetchOptimizations()}
        >
          Refresh Data
        </Button>
      </CardFooter>
    </Card>
  );
}