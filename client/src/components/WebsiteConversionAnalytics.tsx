import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

// Get date range for default selection
const getDateRange = (days: number) => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0]
  };
};

interface WebsiteConversionAnalyticsProps {
  clientId: number;
}

const WebsiteConversionAnalytics = ({ clientId }: WebsiteConversionAnalyticsProps) => {
  const [timeframe, setTimeframe] = useState<'7' | '30' | '90'>('30');
  const [conversionType, setConversionType] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Get date range based on selected timeframe
  const dateRange = getDateRange(Number(timeframe));

  // Fetch conversion data with react-query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/analytics/website-conversions', clientId, dateRange.startDate, dateRange.endDate, conversionType],
    queryFn: async () => {
      let url = `/api/analytics/website-conversions/${clientId}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
      if (conversionType) {
        url += `&conversionType=${conversionType}`;
      }
      const response = await apiRequest('GET', url);
      if (!response.ok) {
        throw new Error('Failed to fetch conversion analytics');
      }
      return response.json();
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading conversion analytics",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  // Handle timeframe change
  const handleTimeframeChange = (value: string) => {
    setTimeframe(value as '7' | '30' | '90');
  };

  // Handle conversion type change
  const handleConversionTypeChange = (value: string) => {
    setConversionType(value === 'all' ? null : value);
  };

  // Get unique conversion types for filter
  const conversionTypes = data?.byType?.map((item: any) => item.type) || [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Website Conversion Analytics</CardTitle>
        <CardDescription>
          Real-time analytics for client website conversions
        </CardDescription>
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <Select value={timeframe} onValueChange={handleTimeframeChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={conversionType || 'all'} onValueChange={handleConversionTypeChange}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Filter by conversion type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All conversion types</SelectItem>
              {conversionTypes.map((type: string) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-4 items-center justify-center h-96">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground">Loading conversion analytics...</p>
          </div>
        ) : !data ? (
          <div className="flex flex-col gap-2 items-center justify-center h-96">
            <p className="text-muted-foreground">No conversion data available for the selected timeframe.</p>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="by-type">By Type</TabsTrigger>
              <TabsTrigger value="by-sources">By Sources</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Conversions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">{data.overview.totalConversions}</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      in the last {data.timeframe.days} days
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">${data.overview.totalValue}</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      estimated conversion value
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Average Bounce Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">{data.overview.avgBounceRate}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Visit to Conversion</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">{data.overview.avgVisitToConversion}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* By Type Tab */}
            <TabsContent value="by-type" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Conversion Types</CardTitle>
                    <CardDescription>Breakdown by conversion type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={data.byType}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="type" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="conversions" fill="#3B5B9D" name="Conversions" />
                          <Bar dataKey="value" fill="#00D1D1" name="Value ($)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <Separator className="my-6" />
                    <div className="space-y-6">
                      {data.byType.map((type: any) => (
                        <div key={type.type} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{type.type}</div>
                            <div className="text-sm text-muted-foreground">{type.conversions} conversions ({type.percentage})</div>
                          </div>
                          <Progress value={parseFloat(type.percentage)} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* By Sources Tab */}
            <TabsContent value="by-sources" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Traffic Sources</CardTitle>
                  <CardDescription>Conversion breakdown by traffic source</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.bySources}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="source" type="category" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="conversions" fill="#3B5B9D" name="Conversions" />
                        <Bar dataKey="value" fill="#00D1D1" name="Value ($)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <Separator className="my-6" />
                  <div className="space-y-4">
                    {data.bySources.map((source: any, index: number) => (
                      <div key={source.source} className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 bg-primary opacity-${100 - (index * 10)}`}></div>
                          <span>{source.source}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">{source.conversions} conversions (${source.value})</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Trends</CardTitle>
                  <CardDescription>Daily conversion trends over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={data.trends.daily}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="conversions"
                          stroke="#3B5B9D"
                          activeDot={{ r: 8 }}
                          name="Conversions"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="value"
                          stroke="#00D1D1"
                          name="Value ($)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      {data?.analysis && (
        <CardFooter className="flex flex-col items-start">
          <h3 className="text-lg font-medium mb-2">AI Analysis</h3>
          <div className="p-4 bg-muted rounded-md w-full">
            {data.analysis.split('\n').map((paragraph: string, i: number) => (
              <p key={i} className={i > 0 ? 'mt-2' : ''}>{paragraph}</p>
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default WebsiteConversionAnalytics;