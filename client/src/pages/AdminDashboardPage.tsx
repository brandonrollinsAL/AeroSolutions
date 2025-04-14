import React from 'react';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  Users, 
  CreditCard, 
  Activity, 
  BarChart2, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock 
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { apiRequest } from '@/lib/queryClient';

interface AnalyticsData {
  userMetrics: {
    totalUsers: number;
    activeSubscriptions: number;
  };
  contentMetrics: any[];
  recentOrders: any[];
  aiUsageMetrics: any;
}

const AdminDashboardPage: React.FC = () => {
  const { data: analyticsData, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['admin', 'analytics'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/analytics', null, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      return response.json();
    }
  });

  const { data: configData } = useQuery({
    queryKey: ['admin', 'api-config'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/api-config', null, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      return response.json();
    }
  });

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const stats = [
    {
      name: 'Total Users',
      value: analyticsData?.userMetrics.totalUsers ?? 0,
      icon: Users,
      change: '+12%',
      trend: 'up',
    },
    {
      name: 'Active Subscriptions',
      value: analyticsData?.userMetrics.activeSubscriptions ?? 0,
      icon: CreditCard,
      change: '+7%',
      trend: 'up',
    },
    {
      name: 'AI Requests Today',
      value: analyticsData?.aiUsageMetrics?.dailyRequests ?? 0,
      icon: Activity,
      change: '+18%',
      trend: 'up',
    },
    {
      name: 'Content Views',
      value: analyticsData?.contentMetrics?.reduce((acc, metric) => acc + (metric.views || 0), 0) ?? 0,
      icon: BarChart2,
      change: '+4%',
      trend: 'up',
    },
  ];

  return (
    <AdminLayout title="Dashboard">
      <Helmet>
        <title>Admin Dashboard | Elevion</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="space-y-6">
        {/* API Status Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className={configData?.openai_api_key ? "border-green-500 border-2" : "border-red-500 border-2"}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">OpenAI API Key</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                {configData?.openai_api_key ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                )}
                <span className={configData?.openai_api_key ? "text-green-500" : "text-red-500"}>
                  {configData?.openai_api_key ? "Configured" : "Not Configured"}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card className={configData?.xai_api_key ? "border-green-500 border-2" : "border-red-500 border-2"}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">XAI API Key</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                {configData?.xai_api_key ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                )}
                <span className={configData?.xai_api_key ? "text-green-500" : "text-red-500"}>
                  {configData?.xai_api_key ? "Configured" : "Not Configured"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className={configData?.stripe_secret_key ? "border-green-500 border-2" : "border-red-500 border-2"}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Stripe Secret Key</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                {configData?.stripe_secret_key ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                )}
                <span className={configData?.stripe_secret_key ? "text-green-500" : "text-red-500"}>
                  {configData?.stripe_secret_key ? "Configured" : "Not Configured"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className={configData?.stripe_publishable_key ? "border-green-500 border-2" : "border-red-500 border-2"}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Stripe Publishable Key</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                {configData?.stripe_publishable_key ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                )}
                <span className={configData?.stripe_publishable_key ? "text-green-500" : "text-red-500"}>
                  {configData?.stripe_publishable_key ? "Configured" : "Not Configured"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.name}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span
                    className={
                      stat.trend === 'up'
                        ? 'text-green-500'
                        : 'text-red-500'
                    }
                  >
                    {stat.change}
                  </span>{' '}
                  from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="recent-orders">Recent Orders</TabsTrigger>
            <TabsTrigger value="ai-usage">AI Usage</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Activity</CardTitle>
                <CardDescription>
                  Overview of platform activities in the last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <div className="h-[300px] w-full flex items-center justify-center">
                    <p className="text-muted-foreground">
                      Activity visualization charts will appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="recent-orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>
                  Recent marketplace orders from users
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : analyticsData?.recentOrders && analyticsData.recentOrders.length > 0 ? (
                  <div className="space-y-2">
                    {analyticsData.recentOrders.map((order, index) => (
                      <div key={index} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">{order.itemName}</p>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>
                              {order.createdAt ? dateFormatter.format(new Date(order.createdAt)) : 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${order.totalPrice}</p>
                          <p className={`text-xs ${
                            order.status === 'completed' 
                              ? 'text-green-500' 
                              : order.status === 'cancelled' 
                                ? 'text-red-500' 
                                : 'text-yellow-500'
                          }`}>
                            {order.status.toUpperCase()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent orders found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="ai-usage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Usage Statistics</CardTitle>
                <CardDescription>
                  Breakdown of AI feature usage across the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : analyticsData?.aiUsageMetrics ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {analyticsData.aiUsageMetrics.totalRequests || 0}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            ${analyticsData.aiUsageMetrics.monthlyCost?.toFixed(2) || '0.00'}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="h-[200px] w-full flex items-center justify-center">
                      <p className="text-muted-foreground">
                        AI usage charts will appear here
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No AI usage data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;