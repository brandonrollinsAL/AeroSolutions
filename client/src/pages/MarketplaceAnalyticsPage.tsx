import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import MarketplaceSalesAnalytics from '@/components/MarketplaceSalesAnalytics';
import LanguageMetaTags from '@/components/LanguageMetaTags';

export default function MarketplaceAnalyticsPage() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  
  // For demo purposes, we're temporarily allowing access without authentication
  // In a production environment, this would check for admin privileges
  useEffect(() => {
    // Demo code - no authentication check for demonstration purposes
    console.log('Marketplace Analytics page loaded successfully');
    
    // The following code would be used in production:
    /*
    const token = localStorage.getItem('token');
    if (!token) {
      setLocation('/login?redirect=/marketplace/analytics');
      return;
    }
    
    try {
      // Verify token has admin role
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token');
      }
      
      const payload = JSON.parse(atob(tokenParts[1]));
      if (payload.role !== 'admin') {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to access this page.',
          variant: 'destructive',
        });
        setLocation('/');
      }
    } catch (e) {
      localStorage.removeItem('token');
      setLocation('/login?redirect=/marketplace/analytics');
    }
    */
  }, [setLocation]);

  return (
    <MainLayout>
      <Helmet>
        <title>Marketplace Analytics | Elevion</title>
        <meta name="description" content="Real-time analytics for Elevion marketplace services" />
        <meta name="robots" content="noindex,nofollow" />
        <html lang={t('language_code')} />
      </Helmet>
      <LanguageMetaTags currentPath="/admin/marketplace-analytics" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/admin')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold">Marketplace Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Real-time sales data and AI-powered analytics for marketplace services
          </p>
        </div>
        
        <MarketplaceSalesAnalytics />
      </div>
    </MainLayout>
  );
}