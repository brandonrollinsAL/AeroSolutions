import React from 'react';
import { Helmet } from 'react-helmet';
import UIAnalytics from '@/components/UIAnalytics';
import { 
  useToast 
} from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Activity, BarChart, Download, LineChart, RefreshCw, Share2 
} from 'lucide-react';

export default function UIAnalyticsDashboard() {
  const { toast } = useToast();
  
  const handleExport = () => {
    toast({
      title: "Export started",
      description: "Your analytics data is being prepared for export.",
    });
    
    // In a real application, this would trigger an API call to generate
    // and download the export file
    setTimeout(() => {
      toast({
        title: "Export complete",
        description: "Analytics data has been exported successfully.",
      });
    }, 1500);
  };
  
  const handleShare = () => {
    // Generate a shareable link (in a real app this would create a unique URL)
    const shareableLink = `${window.location.origin}/shared-analytics?id=${Date.now()}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareableLink).then(() => {
      toast({
        title: "Link copied to clipboard",
        description: "Share this link to give temporary access to this dashboard.",
      });
    }).catch(err => {
      toast({
        title: "Failed to copy link",
        description: "Please try again or create a report manually.",
        variant: "destructive",
      });
    });
  };
  
  return (
    <div className="container mx-auto py-8">
      <Helmet>
        <title>UI/UX Analytics Dashboard | Elevion</title>
        <meta name="description" content="Advanced UI/UX analytics powered by xAI for identifying improvement opportunities" />
      </Helmet>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">UI/UX Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">
            AI-powered insights for optimizing user experience
          </p>
        </div>
        
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="recommendations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommendations">
            <Activity className="h-4 w-4 mr-2" />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="interactions">
            <BarChart className="h-4 w-4 mr-2" />
            Interactions
          </TabsTrigger>
          <TabsTrigger value="trends">
            <LineChart className="h-4 w-4 mr-2" />
            Trends
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="recommendations" className="space-y-4 mt-6">
          <UIAnalytics />
        </TabsContent>
        
        <TabsContent value="interactions" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Element Interactions</CardTitle>
              <CardDescription>
                Detailed breakdown of how users interact with specific UI elements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-blue-800">
                  This feature is coming soon! It will provide a heatmap of element interactions and detailed metrics for each component.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Interaction Trends</CardTitle>
              <CardDescription>
                Long-term trends in user interaction patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-blue-800">
                  This feature is coming soon! It will show how user interactions have changed over time, highlighting improvements and potential issues.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}