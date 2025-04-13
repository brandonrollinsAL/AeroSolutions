import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// Data types for the component
interface ServiceEngagement {
  serviceId: number;
  serviceName: string;
  clicks: number;
  inquiries: number;
  conversions: number;
  viewDuration: string | null;
  lastEngagedAt: string;
}

const MarketplaceServiceEngagement = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('all');

  // Fetch engagement data from API
  const { data: engagementData, isLoading, error } = useQuery({
    queryKey: ['/api/marketplace/service-engagement'],
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error fetching engagement data',
        description: 'Could not load service engagement metrics.',
        variant: 'destructive'
      });
    }
  }, [error, toast]);

  // Process data for charts
  const processChartData = () => {
    if (!engagementData?.data || !Array.isArray(engagementData.data)) return [];

    // Convert data for chart display
    return engagementData.data.map((item: ServiceEngagement) => ({
      name: item.serviceName,
      clicks: item.clicks || 0,
      inquiries: item.inquiries || 0,
      conversionRate: item.inquiries > 0 ? 
        Math.round((item.conversions / item.inquiries) * 100) : 0,
      engagementScore: calculateEngagementScore(item)
    }));
  };

  const calculateEngagementScore = (item: ServiceEngagement) => {
    // Basic engagement score calculation
    // Weight: 1 for clicks, 3 for inquiries, 5 for conversions
    return (item.clicks * 1) + (item.inquiries * 3) + ((item.conversions || 0) * 5);
  };

  // Sort data by engagement metrics
  const getMostEngagedServices = () => {
    if (!engagementData?.data || !Array.isArray(engagementData.data)) return [];
    
    const sortedData = [...engagementData.data];
    return sortedData
      .sort((a: ServiceEngagement, b: ServiceEngagement) => 
        calculateEngagementScore(b) - calculateEngagementScore(a)
      )
      .slice(0, 5); // Top 5 services
  };

  // Calculate summary metrics
  const getTotalClicks = () => {
    if (!engagementData?.data || !Array.isArray(engagementData.data)) return 0;
    return engagementData.data.reduce(
      (sum: number, item: ServiceEngagement) => sum + (item.clicks || 0), 
      0
    );
  };

  const getTotalInquiries = () => {
    if (!engagementData?.data || !Array.isArray(engagementData.data)) return 0;
    return engagementData.data.reduce(
      (sum: number, item: ServiceEngagement) => sum + (item.inquiries || 0), 
      0
    );
  };

  const getOverallConversionRate = () => {
    const inquiries = getTotalInquiries();
    if (!engagementData?.data || !Array.isArray(engagementData.data) || inquiries === 0) return 0;
    
    const conversions = engagementData.data.reduce(
      (sum: number, item: ServiceEngagement) => sum + (item.conversions || 0), 
      0
    );
    
    return Math.round((conversions / inquiries) * 100);
  };

  // For skeleton loading
  const loadingPlaceholders = Array(5).fill(0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Service Engagement Analytics</h2>
        <div className="flex gap-2">
          <Badge 
            className={`cursor-pointer ${timeRange === 'all' ? 'bg-primary' : 'bg-secondary'}`}
            onClick={() => setTimeRange('all')}
          >
            All Time
          </Badge>
          <Badge 
            className={`cursor-pointer ${timeRange === 'month' ? 'bg-primary' : 'bg-secondary'}`}
            onClick={() => setTimeRange('month')}
          >
            This Month
          </Badge>
          <Badge 
            className={`cursor-pointer ${timeRange === 'week' ? 'bg-primary' : 'bg-secondary'}`}
            onClick={() => setTimeRange('week')}
          >
            This Week
          </Badge>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <div className="text-3xl font-bold">{getTotalClicks()}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Inquiries</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <div className="text-3xl font-bold">{getTotalInquiries()}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <div className="text-3xl font-bold">{getOverallConversionRate()}%</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main content tabs */}
      <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Engagement Overview</CardTitle>
              <CardDescription>Engagement metrics across all services</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[350px] flex items-center justify-center">
                  <div className="space-y-2 w-full">
                    {loadingPlaceholders.map((_, index) => (
                      <Skeleton key={index} className="h-12 w-full" />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={processChartData()} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={150} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="clicks" fill="#3B5B9D" name="Clicks" />
                      <Bar dataKey="inquiries" fill="#00D1D1" name="Inquiries" />
                      <Bar dataKey="conversionRate" fill="#FF7043" name="Conversion Rate (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Services</CardTitle>
                <CardDescription>Based on overall engagement</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {loadingPlaceholders.map((_, index) => (
                      <Skeleton key={index} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getMostEngagedServices().map((service: ServiceEngagement) => (
                      <div key={service.serviceId} className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="font-medium">{service.serviceName}</div>
                          <div className="text-sm text-muted-foreground">
                            {service.clicks} clicks • {service.inquiries} inquiries
                          </div>
                        </div>
                        <Badge variant="outline">
                          Score: {calculateEngagementScore(service)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Distribution</CardTitle>
                <CardDescription>How service interest is distributed</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {loadingPlaceholders.map((_, index) => (
                      <Skeleton key={index} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={processChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="engagementScore" fill="#3B5B9D" name="Engagement Score" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Engagement Metrics</CardTitle>
              <CardDescription>In-depth analysis of service engagement</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {loadingPlaceholders.map((_, index) => (
                    <Skeleton key={index} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* More detailed metrics would go here in a real implementation */}
                  <p className="text-muted-foreground">
                    Detailed engagement metrics show how users interact with each service. 
                    This includes click patterns, inquiry-to-conversion rates, and time-based analysis.
                  </p>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Coming Soon</h3>
                    <p className="text-sm text-muted-foreground">
                      We're working on more detailed engagement analytics including:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc pl-5 mt-2">
                      <li>User session analysis</li>
                      <li>Engagement flow visualization</li>
                      <li>User demographic breakdown</li>
                      <li>Conversion path insights</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Trends</CardTitle>
              <CardDescription>How service engagement changes over time</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {loadingPlaceholders.map((_, index) => (
                    <Skeleton key={index} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Trends would be implemented here in a real app */}
                  <p className="text-muted-foreground">
                    Trend analysis shows how engagement metrics have changed over time. 
                    This helps identify growing service popularity and seasonal patterns.
                  </p>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Coming Soon</h3>
                    <p className="text-sm text-muted-foreground">
                      We're working on time-based analytics including:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc pl-5 mt-2">
                      <li>Weekly trend reports</li>
                      <li>Monthly comparison views</li>
                      <li>Year-over-year analysis</li>
                      <li>Predictive engagement forecasting</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketplaceServiceEngagement;