import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/layouts/MainLayout';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BarChart2, CheckCircle2, CreditCard, Package, BarChart, AlertTriangle, ChevronDown, ChevronRight, Code, Smartphone, Globe, RefreshCw, Clock, MousePointer, Users } from 'lucide-react';

// Type definitions for checkout analytics and suggestions
interface CheckoutAnalytics {
  abandonedCarts: number;
  completedCheckouts: number;
  totalSessionsWithCheckoutIntent: number;
  averageTimeOnCheckoutPage: number;
  averageFieldsFilledBeforeAbandonment: number;
  commonDropOffPoints: {
    step: string;
    dropOffCount: number;
    percentOfTotal: number;
  }[];
  deviceBreakdown: {
    mobile: { sessions: number; completionRate: number };
    desktop: { sessions: number; completionRate: number };
    tablet: { sessions: number; completionRate: number };
  };
  paymentMethod: {
    creditCard: { attempts: number; success: number; error: number };
    paypal: { attempts: number; success: number; error: number };
    applePay: { attempts: number; success: number; error: number };
  };
}

interface OptimizationSuggestion {
  id: string;
  title: string;
  description: string;
  implementation: string;
  impactArea: string;
  difficulty: number;
  estimatedConversionImprovement: string;
  applied?: boolean;
}

const CheckoutOptimizationPage: React.FC = () => {
  const [selectedSuggestion, setSelectedSuggestion] = useState<OptimizationSuggestion | null>(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState<string[]>([]);
  const [isImplementing, setIsImplementing] = useState<boolean>(false);
  
  // Fetch checkout analytics and optimization suggestions
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/checkout-optimization/analyze'],
    refetchOnWindowFocus: false,
  });
  
  const analytics: CheckoutAnalytics | undefined = data?.data?.analytics;
  const suggestions: OptimizationSuggestion[] = data?.data?.suggestions || [];
  
  // Handle applying a suggestion
  const handleApplySuggestion = async (suggestion: OptimizationSuggestion) => {
    setIsImplementing(true);
    
    try {
      // In a real app, this would make an API call to implement the changes
      // For demo purposes, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Add to applied suggestions
      setAppliedSuggestions(prev => [...prev, suggestion.id]);
      
      toast({
        title: "Suggestion Applied",
        description: `"${suggestion.title}" has been implemented successfully.`,
      });
    } catch (error) {
      console.error("Error applying suggestion:", error);
      toast({
        title: "Implementation Failed",
        description: "Failed to apply the suggestion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsImplementing(false);
    }
  };
  
  // Get impact icon based on impact area
  const getImpactIcon = (impactArea: string) => {
    switch (impactArea.toLowerCase()) {
      case 'ui':
        return <Globe className="h-4 w-4" />;
      case 'ux':
        return <MousePointer className="h-4 w-4" />;
      case 'technical':
        return <Code className="h-4 w-4" />;
      case 'copy':
        return <Package className="h-4 w-4" />;
      case 'trust':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <BarChart className="h-4 w-4" />;
    }
  };
  
  // Get difficulty level color
  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return "bg-green-500";
      case 2: return "bg-green-400";
      case 3: return "bg-yellow-500";
      case 4: return "bg-orange-500";
      case 5: return "bg-red-500";
      default: return "bg-gray-400";
    }
  };
  
  // Format drop-off point name
  const formatDropOffPoint = (point: string) => {
    return point
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Calculate conversion rate
  const conversionRate = analytics 
    ? (analytics.completedCheckouts / analytics.totalSessionsWithCheckoutIntent) * 100 
    : 0;
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-12 px-4">
          <div className="flex items-center justify-center flex-col space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p>Analyzing checkout flow data...</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto py-12 px-4">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Failed to load checkout optimization data. Please try again later.</AlertDescription>
          </Alert>
          <Button onClick={() => refetch()} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <Helmet>
        <title>Checkout Optimization | Elevion</title>
        <meta name="description" content="Optimize your checkout process to increase conversions using AI-powered suggestions" />
      </Helmet>
      
      <div className="container mx-auto py-12 px-4">
        <div className="flex flex-col md:flex-row items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Checkout Flow Optimization</h1>
            <p className="text-muted-foreground mt-2">
              AI-powered analysis and suggestions to improve your checkout conversion rate
            </p>
          </div>
          
          <Button onClick={() => refetch()} variant="outline" className="mt-4 md:mt-0">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh Analysis
          </Button>
        </div>
        
        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Conversion Rate</CardTitle>
              <CardDescription>Overall checkout completion</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{conversionRate.toFixed(1)}%</div>
              <Progress value={conversionRate} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Avg. Time on Checkout</CardTitle>
              <CardDescription>Time spent completing purchase</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
              <div className="text-3xl font-bold">{analytics?.averageTimeOnCheckoutPage || 0}s</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Mobile Conversion</CardTitle>
              <CardDescription>vs. Desktop conversion</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {analytics?.deviceBreakdown.mobile.completionRate.toFixed(1)}%
              </div>
              {analytics && (
                <div className="text-sm text-muted-foreground mt-1">
                  Desktop: {analytics.deviceBreakdown.desktop.completionRate.toFixed(1)}%
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Fields Before Abandonment</CardTitle>
              <CardDescription>Average completed fields</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {analytics?.averageFieldsFilledBeforeAbandonment.toFixed(1) || 0}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="analysis" className="space-y-4">
          <TabsList>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="suggestions">Optimization Suggestions</TabsTrigger>
            <TabsTrigger value="implementation">Implementation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="analysis" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Drop-off Points Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Common Drop-off Points</CardTitle>
                  <CardDescription>
                    Steps where users abandon the checkout process
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics?.commonDropOffPoints.map((point, i) => (
                    <div key={i} className="mb-4">
                      <div className="flex justify-between mb-1">
                        <span>{formatDropOffPoint(point.step)}</span>
                        <span>{point.percentOfTotal.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${point.percentOfTotal}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              {/* Device Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Device Usage & Conversion</CardTitle>
                  <CardDescription>
                    Comparison of checkout performance across devices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <div className="flex items-center">
                          <Smartphone className="h-4 w-4 mr-2" />
                          <span>Mobile</span>
                        </div>
                        <span>{analytics?.deviceBreakdown.mobile.sessions}% of traffic</span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full mb-1">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${analytics?.deviceBreakdown.mobile.sessions || 0}%` }}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Conversion rate: {analytics?.deviceBreakdown.mobile.completionRate.toFixed(1)}%
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 mr-2" />
                          <span>Desktop</span>
                        </div>
                        <span>{analytics?.deviceBreakdown.desktop.sessions}% of traffic</span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full mb-1">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${analytics?.deviceBreakdown.desktop.sessions || 0}%` }}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Conversion rate: {analytics?.deviceBreakdown.desktop.completionRate.toFixed(1)}%
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <div className="flex items-center">
                          <Package className="h-4 w-4 mr-2" />
                          <span>Tablet</span>
                        </div>
                        <span>{analytics?.deviceBreakdown.tablet.sessions}% of traffic</span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full mb-1">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${analytics?.deviceBreakdown.tablet.sessions || 0}%` }}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Conversion rate: {analytics?.deviceBreakdown.tablet.completionRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Payment Methods Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>
                    Success rates for different payment methods
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <div className="flex items-center">
                            <CreditCard className="h-4 w-4 mr-2" />
                            <span>Credit Card</span>
                          </div>
                          <span>
                            {(analytics.paymentMethod.creditCard.success / analytics.paymentMethod.creditCard.attempts * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-secondary h-2 rounded-full">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ 
                              width: `${(analytics.paymentMethod.creditCard.success / analytics.paymentMethod.creditCard.attempts * 100)}%` 
                            }}
                          />
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {analytics.paymentMethod.creditCard.success} successful / {analytics.paymentMethod.creditCard.attempts} attempts
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-2" />
                            <span>PayPal</span>
                          </div>
                          <span>
                            {(analytics.paymentMethod.paypal.success / analytics.paymentMethod.paypal.attempts * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-secondary h-2 rounded-full">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ 
                              width: `${(analytics.paymentMethod.paypal.success / analytics.paymentMethod.paypal.attempts * 100)}%` 
                            }}
                          />
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {analytics.paymentMethod.paypal.success} successful / {analytics.paymentMethod.paypal.attempts} attempts
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-2" />
                            <span>Apple Pay</span>
                          </div>
                          <span>
                            {(analytics.paymentMethod.applePay.success / analytics.paymentMethod.applePay.attempts * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-secondary h-2 rounded-full">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ 
                              width: `${(analytics.paymentMethod.applePay.success / analytics.paymentMethod.applePay.attempts * 100)}%` 
                            }}
                          />
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {analytics.paymentMethod.applePay.success} successful / {analytics.paymentMethod.applePay.attempts} attempts
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* AI Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>AI Analysis Summary</CardTitle>
                  <CardDescription>
                    Generated insights from checkout data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Primary Issue: Mobile Conversion</AlertTitle>
                    <AlertDescription>
                      Mobile conversion rate is 14% lower than desktop, indicating significant usability issues on mobile devices.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Key Findings:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Payment details step has the highest drop-off rate (41.2%)</li>
                      <li>Users complete only 3.2 fields on average before abandoning</li>
                      <li>Alternative payment methods show higher success rates than credit cards</li>
                      <li>Account creation is a significant barrier with 8.8% drop-off</li>
                    </ul>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Estimated Impact of Improvements:</h4>
                    <div className="flex items-center space-x-2">
                      <div className="bg-primary/20 text-primary px-2 py-1 rounded text-sm font-medium">
                        +15-22% Conversion Increase
                      </div>
                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                        -30% Cart Abandonment
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="suggestions" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Suggestions List */}
              <div className="md:col-span-2 space-y-4">
                {suggestions.length === 0 ? (
                  <Alert>
                    <AlertTitle>No suggestions available</AlertTitle>
                    <AlertDescription>
                      We couldn't generate optimization suggestions at this time. Try refreshing the analysis.
                    </AlertDescription>
                  </Alert>
                ) : (
                  suggestions.map((suggestion) => {
                    const isApplied = appliedSuggestions.includes(suggestion.id);
                    
                    return (
                      <Card 
                        key={suggestion.id}
                        className={`${isApplied ? 'border-green-500 bg-green-50/50' : ''} hover:border-primary/50 transition-all`}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center">
                                <CardTitle className="text-lg">
                                  {suggestion.title}
                                </CardTitle>
                                {isApplied && (
                                  <Badge className="ml-2 bg-green-500">
                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Applied
                                  </Badge>
                                )}
                              </div>
                              <CardDescription>
                                {suggestion.impactArea} optimization • Difficulty: {suggestion.difficulty}/5
                              </CardDescription>
                            </div>
                            <div className="flex flex-col items-end">
                              <Badge variant="outline" className="flex items-center">
                                {getImpactIcon(suggestion.impactArea)}
                                <span className="ml-1">{suggestion.estimatedConversionImprovement}</span>
                              </Badge>
                              <div className="flex mt-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <div
                                    key={i}
                                    className={`h-1 w-3 rounded-full mr-0.5 ${
                                      i < suggestion.difficulty
                                        ? getDifficultyColor(suggestion.difficulty)
                                        : 'bg-gray-200'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">{suggestion.description}</p>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSuggestion(suggestion)}
                          >
                            <Code className="h-4 w-4 mr-2" />
                            View Implementation
                          </Button>
                          
                          <Button
                            size="sm"
                            disabled={isImplementing || isApplied}
                            onClick={() => handleApplySuggestion(suggestion)}
                          >
                            {isImplementing ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Implementing...
                              </>
                            ) : isApplied ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Applied
                              </>
                            ) : (
                              <>
                                Apply Suggestion
                              </>
                            )}
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })
                )}
              </div>
              
              {/* Selected Suggestion Details */}
              <div>
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle>Implementation Details</CardTitle>
                    <CardDescription>
                      {selectedSuggestion 
                        ? `How to implement "${selectedSuggestion.title}"`
                        : "Select a suggestion to view implementation details"
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedSuggestion ? (
                      <>
                        <div className="mb-4">
                          <h4 className="font-medium mb-1">Description</h4>
                          <p className="text-sm text-muted-foreground">
                            {selectedSuggestion.description}
                          </p>
                        </div>
                        
                        <div className="mb-4">
                          <h4 className="font-medium mb-1">Expected Impact</h4>
                          <Badge>
                            {getImpactIcon(selectedSuggestion.impactArea)}
                            <span className="ml-1">{selectedSuggestion.estimatedConversionImprovement}</span>
                          </Badge>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-1">Code Implementation</h4>
                          <div className="bg-gray-900 text-gray-100 rounded-md p-4 text-xs overflow-auto max-h-[400px]">
                            <pre>{selectedSuggestion.implementation}</pre>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                        <Code className="h-10 w-10 mb-2 opacity-20" />
                        <p>Select a suggestion from the list to view implementation details</p>
                      </div>
                    )}
                  </CardContent>
                  {selectedSuggestion && (
                    <CardFooter>
                      <Button 
                        className="w-full"
                        disabled={isImplementing || appliedSuggestions.includes(selectedSuggestion.id)}
                        onClick={() => handleApplySuggestion(selectedSuggestion)}
                      >
                        {isImplementing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Implementing...
                          </>
                        ) : appliedSuggestions.includes(selectedSuggestion.id) ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Already Applied
                          </>
                        ) : (
                          <>
                            Apply This Suggestion
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="implementation" className="space-y-4">
            {appliedSuggestions.length === 0 ? (
              <Alert>
                <AlertTitle>No suggestions applied yet</AlertTitle>
                <AlertDescription>
                  Go to the Suggestions tab to view and apply checkout optimization recommendations.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Implementation Progress</CardTitle>
                    <CardDescription>
                      {appliedSuggestions.length} of {suggestions.length} suggestions applied
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="flex justify-between mb-1">
                        <span>Progress</span>
                        <span>{Math.round(appliedSuggestions.length / suggestions.length * 100)}%</span>
                      </div>
                      <Progress value={appliedSuggestions.length / suggestions.length * 100} />
                    </div>
                    
                    <div className="space-y-4">
                      {suggestions
                        .filter(s => appliedSuggestions.includes(s.id))
                        .map(suggestion => (
                          <Collapsible key={suggestion.id}>
                            <div className="flex items-center justify-between bg-secondary/30 p-3 rounded-md">
                              <div className="flex items-center">
                                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                                <div>
                                  <h4 className="font-medium">{suggestion.title}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {suggestion.impactArea} • {suggestion.estimatedConversionImprovement} improvement
                                  </p>
                                </div>
                              </div>
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </CollapsibleTrigger>
                            </div>
                            <CollapsibleContent>
                              <div className="p-4 border border-t-0 rounded-b-md">
                                <p className="mb-4">{suggestion.description}</p>
                                <div className="bg-secondary/20 p-3 rounded-md">
                                  <h5 className="font-medium mb-2">Implementation</h5>
                                  <pre className="text-xs overflow-auto">{suggestion.implementation}</pre>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Estimated Impact</CardTitle>
                    <CardDescription>
                      Projected improvements from applied changes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-secondary/20 p-4 rounded-md">
                        <h3 className="text-lg font-semibold mb-1">Conversion Rate</h3>
                        <div className="flex items-baseline">
                          <span className="text-3xl font-bold">{(conversionRate * 1.18).toFixed(1)}%</span>
                          <span className="text-green-500 ml-2">
                            +{(conversionRate * 0.18).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-secondary/20 p-4 rounded-md">
                        <h3 className="text-lg font-semibold mb-1">Mobile Conversion</h3>
                        <div className="flex items-baseline">
                          <span className="text-3xl font-bold">
                            {analytics && (analytics.deviceBreakdown.mobile.completionRate * 1.25).toFixed(1)}%
                          </span>
                          <span className="text-green-500 ml-2">
                            +{analytics && (analytics.deviceBreakdown.mobile.completionRate * 0.25).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-secondary/20 p-4 rounded-md">
                        <h3 className="text-lg font-semibold mb-1">Revenue Impact</h3>
                        <div className="flex items-baseline">
                          <span className="text-3xl font-bold">+15%</span>
                          <span className="text-green-500 ml-2">
                            Estimated
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default CheckoutOptimizationPage;