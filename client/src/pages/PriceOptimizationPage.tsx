import React from 'react';
import { Helmet } from 'react-helmet';
import MainLayout from '@/layouts/MainLayout';
import PriceOptimizationRecommendations from '@/components/PriceOptimizationRecommendations';
import PriceOptimizationHistory from '@/components/PriceOptimizationHistory';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/ui/page-header";
import { Button } from '@/components/ui/button';
import { BarChart, History, Info, AlertCircle, Lightbulb } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';

const PriceOptimizationPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { hasPermission } = usePermissions();
  const [, setLocation] = useLocation();
  
  // Cast the permissions to the appropriate type
  const canViewPricing = hasPermission('pricing.view' as any);
  const canManagePricing = hasPermission('pricing.manage' as any);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-10 px-4 md:px-6">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user || (!canViewPricing && !canManagePricing)) {
    return (
      <MainLayout>
        <div className="container mx-auto py-10 px-4 md:px-6">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-6">
              You don't have permission to access the Price Optimization dashboard.
            </p>
            <Button onClick={() => setLocation('/')}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Helmet>
        <title>Price Optimization Dashboard | Elevion</title>
        <meta 
          name="description" 
          content="AI-powered price optimization dashboard for subscription services. Analyze market data, user behavior, and competitive analysis to optimize pricing." 
        />
      </Helmet>

      <div className="container mx-auto py-10 px-4 md:px-6">
        <PageHeader>
          <div className="flex items-center space-x-4">
            <PageHeaderHeading>Price Optimization</PageHeaderHeading>
            <Badge variant="outline" className="border-primary text-primary">AI-Powered</Badge>
          </div>
          <PageHeaderDescription>
            Use AI-driven market analysis and user behavior insights to optimize subscription pricing
          </PageHeaderDescription>
        </PageHeader>

        <Separator className="my-6" />

        <div className="mb-6 bg-slate-50 border rounded-lg p-5">
          <div className="flex space-x-4">
            <div className="flex-shrink-0">
              <Lightbulb className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-medium mb-2">How Price Optimization Works</h2>
              <p className="text-muted-foreground mb-3">
                Our AI-powered price optimization system analyzes multiple data sources to recommend optimal pricing for your subscription plans:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="border-l-2 border-primary pl-3">
                  <span className="font-medium">Market Analysis</span> - Evaluates competitor pricing, industry trends, and market positioning
                </div>
                <div className="border-l-2 border-primary pl-3">
                  <span className="font-medium">User Behavior</span> - Examines conversion rates, churn, and usage patterns across pricing tiers
                </div>
                <div className="border-l-2 border-primary pl-3">
                  <span className="font-medium">Financial Projections</span> - Forecasts revenue impact and break-even analysis for each recommendation
                </div>
              </div>
            </div>
          </div>
        </div>

        {canManagePricing ? (
          <Tabs defaultValue="recommendations" className="w-full mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="recommendations" className="flex items-center">
                <BarChart className="mr-2 h-4 w-4" />
                Recommendations
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center">
                <History className="mr-2 h-4 w-4" />
                Price History
              </TabsTrigger>
            </TabsList>
            <TabsContent value="recommendations" className="mt-6">
              <PriceOptimizationRecommendations />
            </TabsContent>
            <TabsContent value="history" className="mt-6">
              <PriceOptimizationHistory />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6 mt-6">
            <Alert variant="default">
              <Info className="h-4 w-4" />
              <AlertTitle>View-Only Access</AlertTitle>
              <AlertDescription>
                You can view price optimization data but don't have permission to approve or reject recommendations.
              </AlertDescription>
            </Alert>
            
            <PriceOptimizationHistory />
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default PriceOptimizationPage;