import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

// Types for the mockup engagement data
interface MockupEngagementAnalytics {
  summaryMetrics: {
    totalViews: number;
    avgRating: number;
    totalShares: number;
    totalMockups: number;
  };
  byBusinessType: Array<{
    businessType: string;
    views: number;
    shares: number;
    avgRating: number;
  }>;
  byIndustry: Array<{
    industry: string;
    views: number;
    shares: number;
    avgRating: number;
  }>;
  byEngagementSource: Array<{
    source: string;
    views: number;
    shares: number;
    avgRating: number;
  }>;
  recentEngagement: Array<{
    mockupId: number;
    businessType: string;
    industry: string;
    views: number;
    rating: number;
    lastViewed: string;
    feedback: string;
    sharedCount: number;
  }>;
  trends: Array<{
    insight: string;
  }>;
}

// Colors for charts
const COLORS = ['#3B5B9D', '#00D1D1', '#FF7043', '#EDEFF2', '#6C5B7B', '#355C7D'];

const MockupEngagementAnalytics = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const { toast } = useToast();
  
  // Fetch mockup engagement data
  const { data: apiResponse, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['/api/mockups/mockup-engagement'],
    refetchOnWindowFocus: false
  });
  
  const analytics: MockupEngagementAnalytics | undefined = apiResponse?.data;
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshing analytics",
      description: "Fetching the latest mockup engagement data"
    });
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-[250px] w-full" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Render error state
  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Analytics</CardTitle>
          <CardDescription>There was a problem loading mockup engagement data.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Check if data is available
  if (!analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Analytics Data</CardTitle>
          <CardDescription>No mockup engagement data is currently available.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()} variant="outline">
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header and refresh button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mockup Engagement Analytics</h2>
          <p className="text-muted-foreground">
            Track how clients interact with your design mockups
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {/* Summary metrics */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.summaryMetrics.totalViews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total mockup page views
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.summaryMetrics.avgRating.toFixed(1)}
              <span className="text-sm text-muted-foreground">/5</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Client satisfaction rating
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.summaryMetrics.totalShares.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Client shares to stakeholders
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Mockups</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.summaryMetrics.totalMockups}
            </div>
            <p className="text-xs text-muted-foreground">
              Active mockups with engagement
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs for different analytics views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="businessType">Business Types</TabsTrigger>
          <TabsTrigger value="industry">Industries</TabsTrigger>
          <TabsTrigger value="source">Traffic Sources</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>
        
        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <CardDescription>
                Aggregate engagement metrics for all mockups
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.byBusinessType}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="views"
                    nameKey="businessType"
                  >
                    {analytics.byBusinessType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value} views`, 'Views']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Business Type Tab */}
        <TabsContent value="businessType" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Engagement by Business Type</CardTitle>
              <CardDescription>
                How different business types interact with mockups
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.byBusinessType}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="businessType" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="views" fill="#3B5B9D" name="Views" />
                  <Bar dataKey="shares" fill="#00D1D1" name="Shares" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics.byBusinessType.map((item, index) => (
              <Card key={index}>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium capitalize">
                    {item.businessType.replace(/_/g, ' ')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{item.views}</div>
                    <div className="text-xs text-muted-foreground">Views</div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-lg font-medium">{item.avgRating.toFixed(1)}/5</div>
                    <div className="text-xs text-muted-foreground">Avg. Rating</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Industry Tab */}
        <TabsContent value="industry" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Engagement by Industry</CardTitle>
              <CardDescription>
                How different industries interact with mockups
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.byIndustry}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="industry" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="views" fill="#3B5B9D" name="Views" />
                  <Bar dataKey="shares" fill="#00D1D1" name="Shares" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics.byIndustry.map((item, index) => (
              <Card key={index}>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium capitalize">
                    {item.industry}
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{item.views}</div>
                    <div className="text-xs text-muted-foreground">Views</div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-lg font-medium">{item.avgRating.toFixed(1)}/5</div>
                    <div className="text-xs text-muted-foreground">Avg. Rating</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Traffic Source Tab */}
        <TabsContent value="source" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Engagement by Traffic Source</CardTitle>
              <CardDescription>
                How different traffic sources contribute to mockup engagement
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.byEngagementSource}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="views"
                    nameKey="source"
                  >
                    {analytics.byEngagementSource.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value} views`, 'Views']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {analytics.byEngagementSource.map((item, index) => (
              <Card key={index}>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium capitalize">
                    {item.source}
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{item.views}</div>
                    <div className="text-xs text-muted-foreground">Views</div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-lg font-medium">{item.shares}</div>
                    <div className="text-xs text-muted-foreground">Shares</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Recent Activity Tab */}
        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Mockup Activity</CardTitle>
              <CardDescription>
                The most recent engagement with mockups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.recentEngagement.slice(0, 5).map((item, index) => (
                  <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{item.businessType.replace(/_/g, ' ')}</Badge>
                        <span className="text-sm text-muted-foreground">{item.industry}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(item.lastViewed)}
                      </div>
                    </div>
                    <p className="text-sm italic">"{item.feedback}"</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          className="h-4 w-4 text-muted-foreground"
                        >
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        <span className="text-sm">{item.views} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          className="h-4 w-4 text-muted-foreground"
                        >
                          <path d="M17 2.069v1.714M4.429 9.783l1.217 1.146M18.571 9.783l-1.217 1.146M8.5 15.714l1.429 1.428M15.5 15.714l-1.429 1.428M12 2.143v2.143M4.429 12.357l1.217 1.214M12 17.143v2.143M18.571 12.357l-1.217 1.214" />
                        </svg>
                        <span className="text-sm">{item.rating}/5 rating</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          className="h-4 w-4 text-muted-foreground"
                        >
                          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                          <polyline points="16 6 12 2 8 6" />
                          <line x1="12" y1="2" x2="12" y2="15" />
                        </svg>
                        <span className="text-sm">{item.sharedCount} shares</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Insights</CardTitle>
              <CardDescription>
                Intelligent analysis of mockup engagement patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.trends && analytics.trends.length > 0 ? (
                  analytics.trends.map((trend, index) => (
                    <div key={index} className="border-l-4 border-primary pl-4 py-2">
                      <p className="text-sm">{trend.insight}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-muted-foreground">
                      {analytics.recentEngagement.length >= 10 
                        ? "AI insights are being generated..." 
                        : "Not enough data for AI analysis. At least 10 engagements are required."}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MockupEngagementAnalytics;