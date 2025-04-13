import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowRight, 
  TrendingUp, 
  BarChart, 
  AlertCircle, 
  Check, 
  CheckCircle,
  Users,
  LineChart,
  Target,
  BadgeDollarSign,
  ThumbsUp,
  Clock
} from "lucide-react";

interface Competitor {
  features: string[];
  price: number;
  competitor: string;
  comparativeValue: string;
}

interface RecommendationItem {
  id: number;
  planId: number;
  planName: string;
  currentPrice: string;
  recommendedPrice: string;
  percentChange: string;
  analysisData: {
    competitiveAnalysis: Competitor[];
    userEngagement: {
      currentTrialConversion: string;
      projectedTrialConversion: string;
      retentionImpact: string;
    };
    marketTrends: {
      industryAverage: string;
      growthRate: string;
      priceElasticity: string;
    };
    financialImpact: {
      revenueChange: string;
      margin: string;
      breakEven: string;
    };
  };
  implementationNotes: string;
  reviewNotes: string | null;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
}

const formatPrice = (price: string): string => {
  return `$${parseFloat(price).toFixed(2)}`;
};

const PriceOptimizationRecommendations: React.FC = () => {
  const { toast } = useToast();
  const [selectedRecommendation, setSelectedRecommendation] = useState<RecommendationItem | null>(null);
  
  // Fetch price recommendations data
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/price-optimization/recommendations'],
    refetchOnWindowFocus: false,
  });

  // Mutation for approving a recommendation
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/price-optimization/recommendations/${id}/approve`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Recommendation approved",
        description: "The price change will be implemented according to the schedule.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/price-optimization/recommendations'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for rejecting a recommendation
  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/price-optimization/recommendations/${id}/reject`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Recommendation rejected",
        description: "The price recommendation has been rejected.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/price-optimization/recommendations'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Rejection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-2" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <h3 className="text-xl font-bold text-red-500">Error Loading Recommendations</h3>
        <p className="mt-2">Failed to fetch price optimization recommendations. Please try again later.</p>
      </div>
    );
  }

  const recommendations: RecommendationItem[] = data?.data || [];

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price Optimization Recommendations</CardTitle>
          <CardDescription>
            AI-generated pricing recommendations based on market data and user behavior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground">No pricing recommendations are currently available.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart className="mr-2 h-5 w-5 text-primary" />
          Price Optimization Recommendations
        </CardTitle>
        <CardDescription>
          AI-generated pricing recommendations based on market data and user behavior
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map((recommendation) => {
            const percentChange = parseFloat(recommendation.percentChange);
            const isIncrease = percentChange > 0;
            const formattedChange = `${isIncrease ? '+' : ''}${percentChange.toFixed(1)}%`;
            
            return (
              <Card key={recommendation.id} className="overflow-hidden">
                <div className={`
                  h-1.5 w-full 
                  ${recommendation.status === 'pending' ? 'bg-amber-400' :
                    recommendation.status === 'approved' ? 'bg-green-500' :
                    recommendation.status === 'rejected' ? 'bg-red-500' :
                    'bg-blue-500'}
                `}></div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{recommendation.planName}</CardTitle>
                      <CardDescription className="flex items-center gap-1 text-sm mt-1">
                        <Clock className="h-3.5 w-3.5" />
                        Generated on {new Date(recommendation.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={recommendation.status === 'pending' ? 'outline' : 'default'}
                      className={`
                        ${recommendation.status === 'pending' ? 'border-amber-400 text-amber-600 bg-amber-50' :
                          recommendation.status === 'approved' ? 'bg-green-500' :
                          recommendation.status === 'rejected' ? 'bg-red-500 hover:bg-red-600' :
                          'bg-blue-500 hover:bg-blue-600'}
                      `}
                    >
                      {recommendation.status === 'pending' ? 'Pending Review' :
                        recommendation.status === 'approved' ? 'Approved' :
                        recommendation.status === 'rejected' ? 'Rejected' :
                        'Implemented'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="grid grid-cols-3 gap-4 mb-2">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Current Price</p>
                      <p className="text-lg font-medium">{formatPrice(recommendation.currentPrice)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Recommended Price</p>
                      <p className="text-lg font-medium text-primary">{formatPrice(recommendation.recommendedPrice)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Change</p>
                      <div className="flex items-center gap-1">
                        {isIncrease ? (
                          <TrendingUp className="h-4 w-4 text-amber-500" />
                        ) : (
                          <TrendingUp className="h-4 w-4 text-green-500 transform rotate-180" />
                        )}
                        <p className={`text-lg font-medium ${isIncrease ? 'text-amber-500' : 'text-green-500'}`}>
                          {formattedChange}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="flex items-center gap-2 cursor-help py-1">
                          <Users className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">Conversion +{recommendation.analysisData.userEngagement.projectedTrialConversion}</span>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium">User Engagement Impact</h4>
                          <p className="text-sm">Current trial conversion: {recommendation.analysisData.userEngagement.currentTrialConversion}</p>
                          <p className="text-sm">Projected conversion: {recommendation.analysisData.userEngagement.projectedTrialConversion}</p>
                          <p className="text-sm">Retention impact: {recommendation.analysisData.userEngagement.retentionImpact}</p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                    
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="flex items-center gap-2 cursor-help py-1">
                          <LineChart className="h-4 w-4 text-purple-500" />
                          <span className="text-sm">Market: {recommendation.analysisData.marketTrends.industryAverage}</span>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium">Market Trends</h4>
                          <p className="text-sm">Industry average: {recommendation.analysisData.marketTrends.industryAverage}</p>
                          <p className="text-sm">Growth rate: {recommendation.analysisData.marketTrends.growthRate}</p>
                          <p className="text-sm">Price elasticity: {recommendation.analysisData.marketTrends.priceElasticity}</p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                    
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="flex items-center gap-2 cursor-help py-1">
                          <Target className="h-4 w-4 text-red-500" />
                          <span className="text-sm">Competitors: {recommendation.analysisData.competitiveAnalysis.length}</span>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium">Competitive Analysis</h4>
                          <ul className="space-y-1 text-sm">
                            {recommendation.analysisData.competitiveAnalysis.map((competitor, idx) => (
                              <li key={idx}>
                                <span className="font-medium">{competitor.competitor}:</span> ${competitor.price.toFixed(2)} - {competitor.comparativeValue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                    
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="flex items-center gap-2 cursor-help py-1">
                          <BadgeDollarSign className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Revenue: {recommendation.analysisData.financialImpact.revenueChange}</span>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium">Financial Impact</h4>
                          <p className="text-sm">Revenue change: {recommendation.analysisData.financialImpact.revenueChange}</p>
                          <p className="text-sm">Margin: {recommendation.analysisData.financialImpact.margin}</p>
                          <p className="text-sm">Break-even: {recommendation.analysisData.financialImpact.breakEven}</p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedRecommendation(recommendation)}
                  >
                    View Details
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                  
                  {recommendation.status === 'pending' && (
                    <div className="flex gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50">
                            Reject
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Reject Price Recommendation</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to reject this price recommendation? This action keeps the current price in place.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => rejectMutation.mutate(recommendation.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Reject
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="default" size="sm" className="bg-green-500 hover:bg-green-600">
                            Approve
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Approve Price Change</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to approve this price change from {formatPrice(recommendation.currentPrice)} to {formatPrice(recommendation.recommendedPrice)} ({recommendation.percentChange}%)?
                              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-700 flex items-start gap-2">
                                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                <span>Once approved, the new price will be applied to all new subscriptions and renewals. Existing subscribers will be notified before their next billing cycle.</span>
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => approveMutation.mutate(recommendation.id)}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              Approve
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </CardContent>

      {selectedRecommendation && (
        <AlertDialog 
          open={!!selectedRecommendation} 
          onOpenChange={() => setSelectedRecommendation(null)}
        >
          <AlertDialogContent className="max-w-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle>
                Detailed Price Recommendation for {selectedRecommendation.planName}
              </AlertDialogTitle>
              <AlertDialogDescription>
                AI-generated price optimization analysis and implementation guidance
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <Tabs defaultValue="competitive" className="mt-2">
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="competitive">Competition</TabsTrigger>
                <TabsTrigger value="user">User Impact</TabsTrigger>
                <TabsTrigger value="market">Market Trends</TabsTrigger>
                <TabsTrigger value="implementation">Implementation</TabsTrigger>
              </TabsList>
              
              <TabsContent value="competitive" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedRecommendation.analysisData.competitiveAnalysis.map((competitor, idx) => (
                    <Card key={idx} className="overflow-hidden">
                      <div className="h-1 w-full bg-gray-200"></div>
                      <CardHeader className="py-3">
                        <CardTitle className="text-base flex justify-between">
                          <span>{competitor.competitor}</span>
                          <span className="text-primary">${competitor.price.toFixed(2)}</span>
                        </CardTitle>
                        <CardDescription className="text-sm">{competitor.comparativeValue}</CardDescription>
                      </CardHeader>
                      <CardContent className="py-2">
                        <p className="text-sm font-medium mb-2">Key Features:</p>
                        <ul className="space-y-1">
                          {competitor.features.map((feature, fidx) => (
                            <li key={fidx} className="text-sm flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="user" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Trial Conversion</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Current</p>
                          <p className="text-lg font-medium">{selectedRecommendation.analysisData.userEngagement.currentTrialConversion}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Projected</p>
                          <p className="text-lg font-medium text-primary">{selectedRecommendation.analysisData.userEngagement.projectedTrialConversion}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Retention Impact</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{selectedRecommendation.analysisData.userEngagement.retentionImpact}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Financial Impact</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Revenue Change</p>
                          <p>{selectedRecommendation.analysisData.financialImpact.revenueChange}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">New Margin</p>
                          <p>{selectedRecommendation.analysisData.financialImpact.margin}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="market" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Market Trend Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium">Industry Average Price</p>
                        <p className="text-muted-foreground">{selectedRecommendation.analysisData.marketTrends.industryAverage}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Market Growth Rate</p>
                        <p className="text-muted-foreground">{selectedRecommendation.analysisData.marketTrends.growthRate}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Price Elasticity</p>
                        <p className="text-muted-foreground">{selectedRecommendation.analysisData.marketTrends.priceElasticity}</p>
                      </div>
                    </div>
                    
                    <div className="rounded-md border p-4 bg-slate-50">
                      <h3 className="text-sm font-medium mb-2">Break-Even Analysis</h3>
                      <p className="text-sm text-muted-foreground">{selectedRecommendation.analysisData.financialImpact.breakEven}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="implementation" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Implementation Guidance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-md border p-4">
                      <h3 className="text-sm font-medium mb-2">Recommended Approach</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{selectedRecommendation.implementationNotes}</p>
                    </div>
                    
                    <div className="rounded-md bg-green-50 border border-green-200 p-4">
                      <h3 className="text-sm font-medium text-green-800 flex items-center gap-2 mb-2">
                        <ThumbsUp className="h-4 w-4" />
                        Best Practices
                      </h3>
                      <ul className="space-y-2">
                        <li className="text-sm text-green-700 flex items-start gap-2">
                          <Check className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>Notify existing customers at least 30 days before the price change takes effect</span>
                        </li>
                        <li className="text-sm text-green-700 flex items-start gap-2">
                          <Check className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>Highlight the value of new features or improvements that justify the price change</span>
                        </li>
                        <li className="text-sm text-green-700 flex items-start gap-2">
                          <Check className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>Consider grandfather clauses for loyal customers or offering a discount for annual renewals</span>
                        </li>
                        <li className="text-sm text-green-700 flex items-start gap-2">
                          <Check className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>Monitor customer feedback and churn rates closely after implementation</span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel>Close</AlertDialogCancel>
              {selectedRecommendation.status === 'pending' && (
                <>
                  <Button 
                    variant="outline" 
                    className="border-red-200 text-red-500 hover:bg-red-50"
                    onClick={() => {
                      rejectMutation.mutate(selectedRecommendation.id);
                      setSelectedRecommendation(null);
                    }}
                  >
                    Reject
                  </Button>
                  <Button 
                    className="bg-green-500 hover:bg-green-600"
                    onClick={() => {
                      approveMutation.mutate(selectedRecommendation.id);
                      setSelectedRecommendation(null);
                    }}
                  >
                    Approve
                  </Button>
                </>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  );
};

export default PriceOptimizationRecommendations;