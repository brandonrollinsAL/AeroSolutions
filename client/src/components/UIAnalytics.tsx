import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Layout, 
  MousePointer, 
  Clock, 
  Zap, 
  BarChart2 
} from 'lucide-react';
import { apiRequest } from '../lib/queryClient';

// Define types for UI recommendations
interface UIRecommendation {
  title: string;
  category: 'Critical' | 'High' | 'Medium' | 'Low';
  problem: string;
  supporting_data: string;
  solution: string;
  expected_impact: string;
}

export default function UIAnalytics() {
  const [activeTab, setActiveTab] = useState<'recommendations' | 'metrics'>('recommendations');
  
  // Fetch UI/UX recommendations from the API
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/ux/analyze-ui-improvements'],
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
  
  // Track UI element interactions
  useEffect(() => {
    // Set up global click tracking
    const handleElementInteraction = (e: MouseEvent) => {
      // Get the target element
      const target = e.target as HTMLElement;
      if (!target) return;
      
      // Get element information
      const elementId = target.id || 'unknown';
      const elementTagName = target.tagName.toLowerCase();
      const elementClassList = Array.from(target.classList).join(' ');
      const elementType = elementTagName + (elementClassList ? ` (${elementClassList})` : '');
      
      // Get interaction information
      const pageUrl = window.location.href;
      const interactionType = 'click';
      
      // Send the interaction data to the server
      trackInteraction({
        pageUrl,
        elementId,
        elementType,
        interactionType,
        deviceType: getDeviceType(),
        browser: getBrowserInfo()
      });
    };
    
    // Add event listener
    document.addEventListener('click', handleElementInteraction);
    
    // Clean up
    return () => {
      document.removeEventListener('click', handleElementInteraction);
    };
  }, []);
  
  // Function to track UI element interactions
  const trackInteraction = async (interactionData: any) => {
    try {
      await apiRequest('POST', '/api/ux/track-ui-interaction', interactionData);
    } catch (error) {
      console.error('Error tracking UI interaction:', error);
    }
  };
  
  // Helper function to get device type
  const getDeviceType = () => {
    const userAgent = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  };
  
  // Helper function to get browser info
  const getBrowserInfo = () => {
    const userAgent = navigator.userAgent;
    let browserName;
    
    if (userAgent.match(/chrome|chromium|crios/i)) {
      browserName = 'Chrome';
    } else if (userAgent.match(/firefox|fxios/i)) {
      browserName = 'Firefox';
    } else if (userAgent.match(/safari/i)) {
      browserName = 'Safari';
    } else if (userAgent.match(/opr\//i)) {
      browserName = 'Opera';
    } else if (userAgent.match(/edg/i)) {
      browserName = 'Edge';
    } else {
      browserName = 'Unknown';
    }
    
    return browserName;
  };
  
  // Helper function to render badge by category
  const renderCategoryBadge = (category: string) => {
    switch (category) {
      case 'Critical':
        return <Badge variant="destructive" className="ml-2"><AlertCircle className="h-3 w-3 mr-1" /> {category}</Badge>;
      case 'High':
        return <Badge variant="destructive" className="ml-2 bg-orange-500"><AlertTriangle className="h-3 w-3 mr-1" /> {category}</Badge>;
      case 'Medium':
        return <Badge variant="secondary" className="ml-2 bg-yellow-500 text-black"><Info className="h-3 w-3 mr-1" /> {category}</Badge>;
      case 'Low':
        return <Badge variant="outline" className="ml-2"><Info className="h-3 w-3 mr-1" /> {category}</Badge>;
      default:
        return <Badge variant="outline" className="ml-2">{category}</Badge>;
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>UI/UX Analytics</CardTitle>
          <CardDescription>Loading analysis and recommendations...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>UI/UX Analytics</CardTitle>
          <CardDescription>Error loading analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-red-800">Failed to load UI/UX recommendations. Please try again later.</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </CardFooter>
      </Card>
    );
  }
  
  // No data state
  if (!data?.recommendations || data.recommendations.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>UI/UX Analytics</CardTitle>
          <CardDescription>AI-powered interface improvements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-blue-800">Not enough data to generate recommendations yet. Continue using the app to collect more interaction data.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Main UI
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>UI/UX Analytics</CardTitle>
            <CardDescription>AI-powered interface improvements</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant={activeTab === 'recommendations' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveTab('recommendations')}
            >
              <Layout className="h-4 w-4 mr-2" />
              Recommendations
            </Button>
            <Button 
              variant={activeTab === 'metrics' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveTab('metrics')}
            >
              <BarChart2 className="h-4 w-4 mr-2" />
              Metrics
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === 'recommendations' ? (
          <Accordion type="single" collapsible className="w-full">
            {data.recommendations.map((recommendation: UIRecommendation, index: number) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="text-left">
                  <span>{recommendation.title} {renderCategoryBadge(recommendation.category)}</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 mt-2">
                    <div>
                      <h4 className="font-medium">Problem</h4>
                      <p className="text-sm text-gray-600 mt-1">{recommendation.problem}</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Supporting Data</h4>
                      <p className="text-sm text-gray-600 mt-1">{recommendation.supporting_data}</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Solution</h4>
                      <p className="text-sm text-gray-600 mt-1">{recommendation.solution}</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Expected Impact</h4>
                      <p className="text-sm text-gray-600 mt-1">{recommendation.expected_impact}</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="space-y-6">
            {data.data_summary && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <MetricCard 
                    title="User Interactions" 
                    value={data.data_summary.interactions?.total_interactions || 0} 
                    icon={<MousePointer className="h-4 w-4" />} 
                  />
                  <MetricCard 
                    title="Avg. Time on Page" 
                    value={`${Math.round(data.data_summary.engagement?.overall_avg_time_on_page || 0)}s`} 
                    icon={<Clock className="h-4 w-4" />} 
                  />
                  <MetricCard 
                    title="Page Load Time" 
                    value={`${Math.round((data.data_summary.performance?.average_page_load_time || 0) * 100) / 100}s`} 
                    icon={<Zap className="h-4 w-4" />} 
                  />
                </div>
                
                {data.data_summary.interactions?.top_error_elements?.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Top Error Elements</h3>
                    <div className="bg-red-50 p-4 rounded-md">
                      <ul className="space-y-2">
                        {data.data_summary.interactions.top_error_elements.map((element: any, idx: number) => (
                          <li key={idx} className="text-sm">
                            <span className="font-medium">{element.elementId}</span>: {element.count} errors
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                
                {data.data_summary.engagement?.low_engagement_pages?.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Low Engagement Pages</h3>
                    <div className="bg-yellow-50 p-4 rounded-md">
                      <ul className="space-y-2">
                        {data.data_summary.engagement.low_engagement_pages.map((page: any, idx: number) => (
                          <li key={idx} className="text-sm">
                            <span className="font-medium">{page.page}</span>: {Math.round(page.avg_time_on_page)}s avg. time, 
                            {Math.round(page.avg_scroll_depth * 100)}% scroll depth
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                
                {data.data_summary.performance?.slow_pages?.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Slow-Loading Pages</h3>
                    <div className="bg-orange-50 p-4 rounded-md">
                      <ul className="space-y-2">
                        {data.data_summary.performance.slow_pages.map((page: any, idx: number) => (
                          <li key={idx} className="text-sm">
                            <span className="font-medium">{page.url}</span>: {Math.round(page.avg_page_load_time * 100) / 100}s load time
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-6">
        <p className="text-xs text-gray-500">
          Powered by Grok AI | Last updated: {new Date().toLocaleString()}
        </p>
      </CardFooter>
    </Card>
  );
}

// Helper component for metrics
function MetricCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 flex flex-col">
      <div className="flex items-center mb-2 text-gray-600">
        {icon}
        <span className="ml-2 text-sm">{title}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}