import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/queryClient';
import { LineChart, BarChart, PieChart } from 'lucide-react';

interface WebsiteConversionAnalyticsProps {
  clientId: number;
}

interface ConversionDataItem {
  id: number;
  clientId: number;
  conversionType: string;
  conversionCount: number;
  conversionRate: string;
  date: string;
  source: string;
  campaign: string;
  landingPage: string;
  exitPage: string;
  averageTimeToConvert: string;
  deviceType: string;
  location: string;
  aiInsights: string;
  createdAt: string;
  updatedAt: string;
}

const WebsiteConversionAnalytics: React.FC<WebsiteConversionAnalyticsProps> = ({ clientId }) => {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/analytics/website-conversions', clientId, period],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/analytics/website-conversions/${clientId}?period=${period}`);
      return response.json();
    },
    enabled: !!clientId,
  });

  // Helper function to calculate total conversions
  const getTotalConversions = (data: ConversionDataItem[]) => {
    return data?.reduce((total, item) => total + item.conversionCount, 0) || 0;
  };

  // Helper function to calculate average conversion rate
  const getAverageConversionRate = (data: ConversionDataItem[]) => {
    if (!data?.length) return '0%';
    
    const sum = data.reduce((total, item) => {
      const rate = parseFloat(item.conversionRate.replace('%', ''));
      return total + rate;
    }, 0);
    
    return (sum / data.length).toFixed(2) + '%';
  };

  // Helper function to get most popular conversion type
  const getMostPopularConversionType = (data: ConversionDataItem[]) => {
    if (!data?.length) return 'N/A';
    
    const conversionTypes: Record<string, number> = {};
    
    data.forEach(item => {
      if (conversionTypes[item.conversionType]) {
        conversionTypes[item.conversionType] += item.conversionCount;
      } else {
        conversionTypes[item.conversionType] = item.conversionCount;
      }
    });
    
    let maxCount = 0;
    let popularType = 'N/A';
    
    for (const type in conversionTypes) {
      if (conversionTypes[type] > maxCount) {
        maxCount = conversionTypes[type];
        popularType = type;
      }
    }
    
    return popularType;
  };

  // Helper function to get most effective source
  const getMostEffectiveSource = (data: ConversionDataItem[]) => {
    if (!data?.length) return 'N/A';
    
    const sources: Record<string, { count: number, rate: number }> = {};
    
    data.forEach(item => {
      const rate = parseFloat(item.conversionRate.replace('%', ''));
      
      if (sources[item.source]) {
        sources[item.source].count += item.conversionCount;
        sources[item.source].rate = (sources[item.source].rate + rate) / 2; // Average rate
      } else {
        sources[item.source] = { count: item.conversionCount, rate };
      }
    });
    
    let maxEffectiveness = 0;
    let effectiveSource = 'N/A';
    
    for (const source in sources) {
      // Effectiveness = count * rate (weighted metric)
      const effectiveness = sources[source].count * sources[source].rate;
      
      if (effectiveness > maxEffectiveness) {
        maxEffectiveness = effectiveness;
        effectiveSource = source;
      }
    }
    
    return effectiveSource;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-500">Error Loading Conversion Analytics</CardTitle>
          <CardDescription>
            There was a problem fetching the conversion data. Please try again later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Error details: {(error as Error).message || 'Unknown error'}</p>
        </CardContent>
      </Card>
    );
  }

  // Since we're in early implementation, handle the case where data isn't available yet
  const conversionData = data?.data || [];
  const hasData = conversionData.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Website Conversion Analytics</h3>
        <Tabs defaultValue="30d" value={period} onValueChange={(value) => setPeriod(value as any)} className="w-auto">
          <TabsList>
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="90d">90 Days</TabsTrigger>
            <TabsTrigger value="all">All Time</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {hasData ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center">
                  <LineChart className="h-5 w-5 mr-2 text-electric-cyan" />
                  Total Conversions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{getTotalConversions(conversionData)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {period === '7d' ? 'Past week' : 
                   period === '30d' ? 'Past month' : 
                   period === '90d' ? 'Past 3 months' : 'All time'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center">
                  <PieChart className="h-5 w-5 mr-2 text-electric-cyan" />
                  Avg. Conversion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{getAverageConversionRate(conversionData)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {period === '7d' ? 'Past week' : 
                   period === '30d' ? 'Past month' : 
                   period === '90d' ? 'Past 3 months' : 'All time'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center">
                  <BarChart className="h-5 w-5 mr-2 text-electric-cyan" />
                  Most Effective Source
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold truncate">{getMostEffectiveSource(conversionData)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on conversion count and rate
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Conversion Breakdown</CardTitle>
              <CardDescription>
                Detailed analysis of conversions by type, source, and page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="byType">
                <TabsList className="mb-4">
                  <TabsTrigger value="byType">By Conversion Type</TabsTrigger>
                  <TabsTrigger value="bySource">By Source</TabsTrigger>
                  <TabsTrigger value="byPage">By Landing Page</TabsTrigger>
                </TabsList>
                
                <TabsContent value="byType">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left pb-2">Conversion Type</th>
                          <th className="text-left pb-2">Count</th>
                          <th className="text-left pb-2">Rate</th>
                          <th className="text-left pb-2">Avg. Time to Convert</th>
                        </tr>
                      </thead>
                      <tbody>
                        {conversionData.map((item, index) => (
                          <tr key={index} className="border-b last:border-0">
                            <td className="py-3">{item.conversionType}</td>
                            <td className="py-3">{item.conversionCount}</td>
                            <td className="py-3">{item.conversionRate}</td>
                            <td className="py-3">{item.averageTimeToConvert}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
                
                <TabsContent value="bySource">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left pb-2">Source</th>
                          <th className="text-left pb-2">Campaign</th>
                          <th className="text-left pb-2">Conversions</th>
                          <th className="text-left pb-2">Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {conversionData.map((item, index) => (
                          <tr key={index} className="border-b last:border-0">
                            <td className="py-3">{item.source}</td>
                            <td className="py-3">{item.campaign || 'N/A'}</td>
                            <td className="py-3">{item.conversionCount}</td>
                            <td className="py-3">{item.conversionRate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
                
                <TabsContent value="byPage">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left pb-2">Landing Page</th>
                          <th className="text-left pb-2">Exit Page</th>
                          <th className="text-left pb-2">Conversions</th>
                          <th className="text-left pb-2">Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {conversionData.map((item, index) => (
                          <tr key={index} className="border-b last:border-0">
                            <td className="py-3">{item.landingPage}</td>
                            <td className="py-3">{item.exitPage}</td>
                            <td className="py-3">{item.conversionCount}</td>
                            <td className="py-3">{item.conversionRate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Insights</CardTitle>
              <CardDescription>
                Intelligent analysis of your conversion data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-slate-50 rounded-md border border-slate-200">
                <h4 className="font-semibold mb-2">Summary</h4>
                <p className="text-sm text-slate-700 mb-4">
                  {data?.aiInsights?.summary || "AI-powered insights are being generated for your data. This feature uses Grok AI to analyze patterns and provide actionable recommendations."}
                </p>
                
                <h4 className="font-semibold mb-2">Recommendations</h4>
                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
                  {data?.aiInsights?.recommendations ? (
                    data.aiInsights.recommendations.map((rec: string, i: number) => (
                      <li key={i}>{rec}</li>
                    ))
                  ) : (
                    <>
                      <li>Focus on optimizing your {getMostPopularConversionType(conversionData)} conversion path to increase overall conversions.</li>
                      <li>Consider allocating more resources to {getMostEffectiveSource(conversionData)} as it's your most effective traffic source.</li>
                      <li>Test different call-to-action messages on your landing pages to improve conversion rates.</li>
                    </>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Conversion Data Available</CardTitle>
            <CardDescription>
              We don't have any conversion data for this client yet. This could be because:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              <li>The conversion tracking has just been set up</li>
              <li>The website hasn't received enough traffic</li>
              <li>There's an issue with the tracking implementation</li>
            </ul>
            <p className="mt-4">
              Ensure conversion tracking is properly implemented on the client's website to collect data.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WebsiteConversionAnalytics;