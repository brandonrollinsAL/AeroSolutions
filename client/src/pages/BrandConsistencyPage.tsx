import React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import BrandConsistencyDashboard from '@/components/BrandConsistencyDashboard';
import PlatformCompatibilityDebugger from '@/components/platform/PlatformCompatibilityDebugger';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlatformCompatibilityProvider } from '@/components/platform/PlatformCompatibilityProvider';

const BrandConsistencyPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-background">
      <Helmet>
        <title>{t('Brand & Platform Consistency')} | Elevion</title>
        <meta
          name="description"
          content={t('Track and manage brand consistency and platform compatibility issues across your digital presence')}
        />
      </Helmet>
      
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">{t('Brand & Platform Consistency')}</h1>
        
        <Tabs defaultValue="brand">
          <TabsList className="mb-6">
            <TabsTrigger value="brand">{t('Brand Consistency')}</TabsTrigger>
            <TabsTrigger value="platform">{t('Platform Compatibility')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="brand">
            <BrandConsistencyDashboard />
          </TabsContent>
          
          <TabsContent value="platform">
            <PlatformCompatibilityProvider>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  {t('Monitor and analyze cross-platform compatibility issues affecting your website.')}
                </p>
                <PlatformCompatibilityDebugger />
              </div>
            </PlatformCompatibilityProvider>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BrandConsistencyPage;