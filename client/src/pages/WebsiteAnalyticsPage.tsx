import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WebsiteConversionAnalytics from '@/components/WebsiteConversionAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { BarChart4, LineChart, PieChart, Activity, RefreshCw } from 'lucide-react';

const WebsiteAnalyticsPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const refreshData = () => {
    setIsRefreshing(true);
    // Simulate refreshing data
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // Sample client data - in a real app, this would come from an API
  const clients = [
    { id: 1, name: 'Aurora Designs', website: 'aurora-designs.com' },
    { id: 2, name: 'Pinnacle Tech', website: 'pinnacletech.io' },
    { id: 3, name: 'GreenLeaf Organic', website: 'greenleaf-organic.com' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-blue font-poppins">Website Analytics</h1>
          <p className="text-muted-foreground">
            Analyze client website performance, engagement, and conversion metrics
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
              <BarChart4 className="h-5 w-5 mr-2 text-electric-cyan" />
              Engagement Overview
            </CardTitle>
            <CardDescription>Website engagement metrics across clients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">3,721</div>
            <p className="text-xs text-muted-foreground">Average monthly page views</p>
            <div className="h-[100px] w-full mt-4 rounded-md bg-slate-100 flex items-center justify-center">
              <span className="text-sm text-muted-foreground">Engagement chart placeholder</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <LineChart className="h-5 w-5 mr-2 text-electric-cyan" />
              Conversion Performance
            </CardTitle>
            <CardDescription>Overall conversion metrics across clients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">4.8%</div>
            <p className="text-xs text-muted-foreground">Average conversion rate</p>
            <div className="h-[100px] w-full mt-4 rounded-md bg-slate-100 flex items-center justify-center">
              <span className="text-sm text-muted-foreground">Conversion chart placeholder</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <Activity className="h-5 w-5 mr-2 text-electric-cyan" />
              Client Comparison
            </CardTitle>
            <CardDescription>Performance comparison across clients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">7 / 10</div>
            <p className="text-xs text-muted-foreground">Average performance score</p>
            <div className="h-[100px] w-full mt-4 rounded-md bg-slate-100 flex items-center justify-center">
              <span className="text-sm text-muted-foreground">Comparison chart placeholder</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client selection */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Select Client Website</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Card 
              key={client.id} 
              className={`cursor-pointer transition-all hover:border-electric-cyan ${
                selectedClient === client.id ? 'border-2 border-electric-cyan' : ''
              }`}
              onClick={() => setSelectedClient(client.id)}
            >
              <CardHeader className="py-4">
                <CardTitle className="text-lg">{client.name}</CardTitle>
                <CardDescription>{client.website}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {selectedClient ? (
        <Tabs defaultValue="conversions" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="conversions" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              Conversions
            </TabsTrigger>
            <TabsTrigger value="engagement" className="flex items-center gap-2">
              <BarChart4 className="h-4 w-4" />
              Engagement
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="demographics" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Demographics
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="conversions">
            <WebsiteConversionAnalytics clientId={selectedClient} />
          </TabsContent>
          
          <TabsContent value="engagement">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Analytics</CardTitle>
                <CardDescription>
                  Analyze visitor engagement metrics like time on page, bounce rate, and page views
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full bg-slate-100 rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">Engagement analytics placeholder - to be implemented</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>
                  Website performance metrics like load time, TTFB, and core web vitals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full bg-slate-100 rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">Performance analytics placeholder - to be implemented</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="demographics">
            <Card>
              <CardHeader>
                <CardTitle>Visitor Demographics</CardTitle>
                <CardDescription>
                  Visitor information including location, device type, and referral sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full bg-slate-100 rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">Demographics analytics placeholder - to be implemented</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select a Client</CardTitle>
            <CardDescription>Please select a client above to view detailed analytics</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">No client selected</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WebsiteAnalyticsPage;