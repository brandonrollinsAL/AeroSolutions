import React, { useState } from 'react';
import MarketplaceServiceEngagement from '@/components/MarketplaceServiceEngagement';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, BarChart4, LineChart, PieChart, Activity, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MarketplaceAnalyticsPage: React.FC = () => {
  const { t } = useTranslation();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  const refreshData = () => {
    setIsRefreshing(true);
    // Simulate refreshing data
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-blue font-poppins">Marketplace Analytics</h1>
          <p className="text-muted-foreground">
            Track service engagement, sales performance, and customer behavior in the Elevion Marketplace
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshData} 
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <ShoppingBag className="h-5 w-5 mr-2 text-electric-cyan" />
              Service Clicks
            </CardTitle>
            <CardDescription>Total service interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">254</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
            <div className="h-[100px] w-full mt-4 rounded-md bg-slate-100 flex items-center justify-center">
              <span className="text-sm text-muted-foreground">Click trend chart</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <BarChart4 className="h-5 w-5 mr-2 text-electric-cyan" />
              Inquiries
            </CardTitle>
            <CardDescription>Service inquiry count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">67</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
            <div className="h-[100px] w-full mt-4 rounded-md bg-slate-100 flex items-center justify-center">
              <span className="text-sm text-muted-foreground">Inquiry trend chart</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <Activity className="h-5 w-5 mr-2 text-electric-cyan" />
              Conversions
            </CardTitle>
            <CardDescription>Inquiry to sale conversion rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">22.4%</div>
            <p className="text-xs text-muted-foreground">+1.2% from last month</p>
            <div className="h-[100px] w-full mt-4 rounded-md bg-slate-100 flex items-center justify-center">
              <span className="text-sm text-muted-foreground">Conversion trend chart</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="engagement" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="engagement" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Service Engagement
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            Sales Performance
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <BarChart4 className="h-4 w-4" />
            Service Comparison
          </TabsTrigger>
          <TabsTrigger value="audience" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Audience Insights
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="engagement">
          <MarketplaceServiceEngagement />
        </TabsContent>
        
        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Sales Performance Analytics</CardTitle>
              <CardDescription>
                Analyze sales performance, revenue metrics, and growth trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full bg-slate-100 rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">Sales analytics placeholder - to be implemented</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Service Comparison Analytics</CardTitle>
              <CardDescription>
                Compare performance metrics across different service categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full bg-slate-100 rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">Service comparison analytics placeholder - to be implemented</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="audience">
          <Card>
            <CardHeader>
              <CardTitle>Audience Insights</CardTitle>
              <CardDescription>
                Understand your customer demographics and behavior patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full bg-slate-100 rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">Audience insights placeholder - to be implemented</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketplaceAnalyticsPage;