import { useState, useEffect } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, RefreshCw } from "lucide-react";

interface SalesAnalyticsData {
  totalSales: number;
  orderCount: number;
  averageOrderValue: number;
  topProducts: {
    itemName: string;
    orderCount: number;
    totalValue: number;
  }[];
  salesByCategory: {
    category: string;
    orderCount: number;
    totalValue: number;
    percentOfTotal: string;
  }[];
  aiInsights?: {
    keyTrends: string[];
    customerBehaviorInsights: string[];
    salesOpportunities: string[];
    recommendations: string[];
    note?: string;
  };
  generatedAt: string;
  source?: 'cache' | 'fresh';
}

const COLORS = ['#3B5B9D', '#00D1D1', '#FF7043', '#6366F1', '#8B5CF6', '#EC4899'];

const MarketplaceSalesAnalytics = () => {
  const [analytics, setAnalytics] = useState<SalesAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async (force = false) => {
    try {
      setLoading(true);
      setError(null);
      if (force) setRefreshing(true);
      
      const endpoint = force 
        ? '/api/marketplace/sales-analytics?force=true' 
        : '/api/marketplace/sales-analytics';
      
      const response = await apiRequest('GET', endpoint);
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data);
      } else {
        setError(data.message || 'Failed to fetch sales analytics');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  if (loading && !refreshing) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Marketplace Sales Analytics</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="w-full">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-28" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-24 mb-4" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTitle>Error Loading Analytics</AlertTitle>
        <AlertDescription>
          {error}
          <button 
            onClick={() => fetchAnalytics()} 
            className="ml-4 text-sm underline"
          >
            Try Again
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Marketplace Sales Analytics</h2>
        <div className="flex items-center gap-2">
          {analytics?.source && (
            <Badge variant={analytics.source === 'cache' ? 'outline' : 'default'} className="h-8">
              {analytics.source === 'cache' ? 'Cached Data' : 'Fresh Data'}
            </Badge>
          )}
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            {refreshing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </>
            )}
          </button>
        </div>
      </div>

      {analytics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{formatCurrency(analytics.totalSales)}</p>
                <p className="text-sm text-gray-500">Across {analytics.orderCount} orders</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">Average Order Value</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{formatCurrency(analytics.averageOrderValue)}</p>
                <p className="text-sm text-gray-500">Per completed order</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">Analytics Generation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base font-medium">{formatDate(analytics.generatedAt)}</p>
                <p className="text-sm text-gray-500">Last updated</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>Best performing products by sales value</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                    <YAxis type="category" dataKey="itemName" width={150} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="totalValue" name="Total Sales" fill="#3B5B9D" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sales by Category</CardTitle>
                <CardDescription>Revenue distribution across categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.salesByCategory}
                      dataKey="totalValue"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      label={({ category, percentOfTotal }) => `${category}: ${percentOfTotal}`}
                    >
                      {analytics.salesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {analytics.aiInsights && !analytics.aiInsights.note && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>AI-Powered Insights</span>
                  <Info className="h-4 w-4 text-slate-500" />
                </CardTitle>
                <CardDescription>
                  Generated using Elevion AI to analyze your sales data patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="trends">
                  <TabsList className="mb-4">
                    <TabsTrigger value="trends">Key Trends</TabsTrigger>
                    <TabsTrigger value="behavior">Customer Behavior</TabsTrigger>
                    <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
                    <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="trends" className="space-y-4">
                    <ul className="space-y-2 list-disc list-inside">
                      {analytics.aiInsights.keyTrends?.map((trend, i) => (
                        <li key={i} className="text-gray-700">{trend}</li>
                      ))}
                    </ul>
                  </TabsContent>
                  
                  <TabsContent value="behavior" className="space-y-4">
                    <ul className="space-y-2 list-disc list-inside">
                      {analytics.aiInsights.customerBehaviorInsights?.map((insight, i) => (
                        <li key={i} className="text-gray-700">{insight}</li>
                      ))}
                    </ul>
                  </TabsContent>
                  
                  <TabsContent value="opportunities" className="space-y-4">
                    <ul className="space-y-2 list-disc list-inside">
                      {analytics.aiInsights.salesOpportunities?.map((opportunity, i) => (
                        <li key={i} className="text-gray-700">{opportunity}</li>
                      ))}
                    </ul>
                  </TabsContent>
                  
                  <TabsContent value="recommendations" className="space-y-4">
                    <ul className="space-y-2 list-disc list-inside">
                      {analytics.aiInsights.recommendations?.map((recommendation, i) => (
                        <li key={i} className="text-gray-700">{recommendation}</li>
                      ))}
                    </ul>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
          
          {analytics.aiInsights?.note && (
            <Alert className="mb-6">
              <AlertTitle>AI Insights Unavailable</AlertTitle>
              <AlertDescription>
                {analytics.aiInsights.note}
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );
};

export default MarketplaceSalesAnalytics;