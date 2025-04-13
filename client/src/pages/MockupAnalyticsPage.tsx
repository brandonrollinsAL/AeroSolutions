import { Helmet } from 'react-helmet';
import MockupEngagementAnalytics from "@/components/MockupEngagementAnalytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Mockup Analytics Page
 * 
 * Displays analytics and metrics for client mockup engagement
 * This page uses the MockupEngagementAnalytics component to visualize data
 */
export default function MockupAnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1">Mockup Analytics</h1>
          <p className="text-muted-foreground max-w-2xl">
            Track how clients engage with your mockups and gain insights to improve your design strategy
          </p>
        </div>
      </div>

      <Tabs defaultValue="engagement" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 max-w-[600px]">
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="engagement" className="space-y-6">
          <MockupEngagementAnalytics />
        </TabsContent>
        
        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle>Client Feedback Analysis</CardTitle>
              <CardDescription>
                Sentiment analysis and key themes from client feedback
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-[300px] border border-dashed rounded-lg">
                <div className="text-center">
                  <h3 className="text-lg font-medium">Coming Soon</h3>
                  <p className="text-muted-foreground mt-2">
                    Feedback analysis is currently under development
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Mockup Performance Metrics</CardTitle>
              <CardDescription>
                Performance analysis and optimization recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-[300px] border border-dashed rounded-lg">
                <div className="text-center">
                  <h3 className="text-lg font-medium">Coming Soon</h3>
                  <p className="text-muted-foreground mt-2">
                    Performance metrics are currently under development
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ai-insights">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Insights</CardTitle>
              <CardDescription>
                Intelligent insights and recommendations based on mockup data
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-[300px] border border-dashed rounded-lg">
                <div className="text-center">
                  <h3 className="text-lg font-medium">Coming Soon</h3>
                  <p className="text-muted-foreground mt-2">
                    AI-powered insights are currently under development
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}