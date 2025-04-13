import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface LandingPageOptimizerProps {
  pagePath: string;
  isAdmin: boolean;
  onApplyOptimizations?: (optimizations: any) => void;
}

interface OptimizationSuggestion {
  id: string;
  type: 'color' | 'layout' | 'content' | 'cta';
  element: string;
  suggestion: string;
  confidence: number;
  before?: string;
  after?: string;
  status: 'pending' | 'applied' | 'rejected';
}

export default function LandingPageOptimizer({
  pagePath,
  isAdmin,
  onApplyOptimizations
}: LandingPageOptimizerProps) {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [analytics, setAnalytics] = useState<any>({
    views: 0,
    uniqueVisitors: 0,
    averageTimeOnPage: 0,
    bounceRate: 0,
    conversionRate: 0,
    heatmapData: []
  });
  
  // Track user engagement when component mounts
  useEffect(() => {
    if (!isAdmin) {
      trackUserEngagement();
    }
    
    if (isAdmin) {
      fetchSuggestions();
      fetchAnalytics();
    }
  }, [pagePath, isAdmin]);
  
  // Track user engagement with the page
  const trackUserEngagement = async () => {
    try {
      // Create timestamp for when user loaded the page
      const startTime = new Date().getTime();
      
      // Track page view
      await apiRequest('POST', '/api/landing-pages/track', {
        pagePath,
        event: 'pageView',
        timestamp: startTime
      });
      
      // Track scroll depth and time on page when user leaves
      const handleBeforeUnload = async () => {
        const endTime = new Date().getTime();
        const timeOnPage = (endTime - startTime) / 1000; // in seconds
        const scrollDepth = calculateScrollDepth();
        
        // Using Navigator.sendBeacon for more reliable analytics on page unload
        const data = JSON.stringify({
          pagePath,
          event: 'pageExit',
          timestamp: endTime,
          timeOnPage,
          scrollDepth
        });
        
        navigator.sendBeacon(
          '/api/landing-pages/track',
          new Blob([data], { type: 'application/json' })
        );
      };
      
      // Calculate how far down the page the user has scrolled
      const calculateScrollDepth = () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;
        return Math.floor((scrollTop / (scrollHeight - clientHeight)) * 100);
      };
      
      // Add event listeners for tracking
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      // Clean up event listeners
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    } catch (error) {
      console.error('Error tracking user engagement:', error);
    }
  };
  
  // Fetch optimization suggestions from the API
  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('GET', `/api/landing-pages/suggestions?pagePath=${encodeURIComponent(pagePath)}`);
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching optimization suggestions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch optimization suggestions',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch page analytics from the API
  const fetchAnalytics = async () => {
    try {
      const response = await apiRequest('GET', `/api/landing-pages/analytics?pagePath=${encodeURIComponent(pagePath)}`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching page analytics:', error);
    }
  };
  
  // Generate new optimization suggestions using AI
  const generateSuggestions = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/landing-pages/generate-suggestions', { pagePath });
      const data = await response.json();
      setSuggestions(data.suggestions || []);
      toast({
        title: 'Success',
        description: 'Generated new optimization suggestions',
      });
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate suggestions',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Apply selected optimization suggestions
  const applyOptimizations = () => {
    // Filter only the suggestions that are marked as 'applied'
    const appliedSuggestions = suggestions.filter(suggestion => suggestion.status === 'applied');
    
    // Transform into an optimizations object that can be used by the landing page
    const optimizations = appliedSuggestions.reduce((acc, suggestion) => {
      // Create a key-value structure based on the suggestion type and element
      acc[`${suggestion.type}_${suggestion.element}`] = suggestion.after || suggestion.suggestion;
      return acc;
    }, {} as Record<string, string>);
    
    // Call the callback function with the optimization data
    if (onApplyOptimizations) {
      onApplyOptimizations(optimizations);
      
      toast({
        title: 'Success',
        description: `Applied ${appliedSuggestions.length} optimization suggestions`,
      });
    }
  };
  
  // Toggle the status of a suggestion
  const toggleSuggestionStatus = (id: string) => {
    setSuggestions(prev => prev.map(suggestion => {
      if (suggestion.id === id) {
        const newStatus = suggestion.status === 'applied' ? 'pending' : 'applied';
        return { ...suggestion, status: newStatus };
      }
      return suggestion;
    }));
  };
  
  // If not admin, render an invisible component that only tracks
  if (!isAdmin) {
    return null;
  }
  
  return (
    <div className="w-full">
      <Tabs defaultValue="suggestions">
        <TabsList className="mb-4">
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="suggestions">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-medium">AI-Powered Optimization Suggestions</h3>
            <div className="space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={generateSuggestions}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate New
                  </>
                )}
              </Button>
              <Button 
                size="sm"
                onClick={applyOptimizations}
                disabled={!suggestions.some(s => s.status === 'applied')}
              >
                <Zap className="h-4 w-4 mr-2" />
                Apply Selected
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : suggestions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestions.map(suggestion => (
                <Card
                  key={suggestion.id}
                  className={`p-4 cursor-pointer transition-all ${
                    suggestion.status === 'applied' 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => toggleSuggestionStatus(suggestion.id)}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium capitalize">{suggestion.type}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-secondary">
                        {Math.round(suggestion.confidence * 100)}% confidence
                      </span>
                    </div>
                    <h4 className="font-medium">{suggestion.element}</h4>
                    <p className="text-sm text-muted-foreground">{suggestion.suggestion}</p>
                    
                    {(suggestion.before || suggestion.after) && (
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        {suggestion.before && (
                          <div>
                            <p className="font-medium">Before:</p>
                            <p className="text-muted-foreground">{suggestion.before}</p>
                          </div>
                        )}
                        {suggestion.after && (
                          <div>
                            <p className="font-medium">After:</p>
                            <p className="text-primary">{suggestion.after}</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="text-xs text-right">
                      {suggestion.status === 'applied' ? (
                        <span className="text-primary">Selected for application</span>
                      ) : (
                        <span className="text-muted-foreground">Click to select</span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No suggestions available yet. Generate new ones to get started.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="analytics">
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <h4 className="text-sm font-medium text-muted-foreground">Views</h4>
                <p className="text-2xl font-bold">{analytics.views}</p>
              </Card>
              <Card className="p-4">
                <h4 className="text-sm font-medium text-muted-foreground">Unique Visitors</h4>
                <p className="text-2xl font-bold">{analytics.uniqueVisitors}</p>
              </Card>
              <Card className="p-4">
                <h4 className="text-sm font-medium text-muted-foreground">Avg. Time on Page</h4>
                <p className="text-2xl font-bold">{analytics.averageTimeOnPage}s</p>
              </Card>
              <Card className="p-4">
                <h4 className="text-sm font-medium text-muted-foreground">Conversion Rate</h4>
                <p className="text-2xl font-bold">{(analytics.conversionRate * 100).toFixed(1)}%</p>
              </Card>
            </div>
            
            <Card className="p-4">
              <h4 className="text-sm font-medium mb-2">Bounce Rate</h4>
              <div className="h-6 w-full bg-secondary rounded-full">
                <div
                  className="h-6 bg-primary rounded-full"
                  style={{ width: `${analytics.bounceRate * 100}%` }}
                >
                  <span className="px-3 text-xs text-white leading-6">
                    {(analytics.bounceRate * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <h4 className="text-sm font-medium mb-4">Engagement Heatmap</h4>
              {analytics.heatmapData && analytics.heatmapData.length > 0 ? (
                <div className="h-64 bg-secondary/20 relative rounded-md border border-border">
                  {/* Simplified heatmap visualization */}
                  {analytics.heatmapData.map((point: any, index: number) => (
                    <div
                      key={index}
                      className="absolute w-4 h-4 rounded-full opacity-70"
                      style={{
                        backgroundColor: `rgba(59, 91, 157, ${point.intensity})`,
                        left: `${point.x * 100}%`,
                        top: `${point.y * 100}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Not enough data to generate heatmap</p>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}