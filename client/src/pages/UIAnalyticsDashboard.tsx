import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import UIAnalytics from '@/components/UIAnalytics';
import UIHeatmap from '@/components/UIHeatmap';
import UIMetricsDisplay from '@/components/UIMetricsDisplay';
import UIAnalyticsExport from '@/components/UIAnalyticsExport';
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
  Activity, BarChart, Download, LineChart, RefreshCw, Share2, FileSpreadsheet, 
  PieChart, AlertTriangle, ChevronDown
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UIAnalyticsDashboard() {
  const { toast } = useToast();
  const [exportOpen, setExportOpen] = useState(false);
  
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
        <meta name="description" content="Advanced UI/UX analytics powered by Elevion AI for identifying improvement opportunities" />
      </Helmet>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">UI/UX Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">
            AI-powered insights for optimizing user experience
          </p>
        </div>
        
        <div className="flex gap-2 mt-4 md:mt-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
                <ChevronDown className="h-3 w-3 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Quick Export</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => {
                toast({
                  title: "PDF Export Started",
                  description: "Your report will be ready in a moment.",
                });
              }}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                toast({
                  title: "CSV Export Started",
                  description: "Your data will be ready in a moment.",
                });
              }}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setExportOpen(prev => !prev)}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Advanced Export Options
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
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
      
      <Collapsible
        open={exportOpen}
        onOpenChange={setExportOpen}
        className="mb-8"
      >
        <CollapsibleContent>
          <Card className="mt-2 border-blue-100 bg-blue-50/30">
            <CardContent className="pt-6">
              <UIAnalyticsExport />
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
      
      <Tabs defaultValue="recommendations" className="w-full">
        <TabsList className="grid w-full md:w-auto md:inline-flex">
          <TabsTrigger value="recommendations">
            <Activity className="h-4 w-4 mr-2" />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="interactions">
            <BarChart className="h-4 w-4 mr-2" />
            Interactions
          </TabsTrigger>
          <TabsTrigger value="metrics">
            <PieChart className="h-4 w-4 mr-2" />
            Detailed Metrics
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
          <UIHeatmap />
        </TabsContent>
        
        <TabsContent value="metrics" className="space-y-4 mt-6">
          <UIMetricsDisplay />
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