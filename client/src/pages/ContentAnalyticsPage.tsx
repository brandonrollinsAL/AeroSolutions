import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import ContentEngagementAnalytics from '@/components/ContentEngagementAnalytics';
import LanguageMetaTags from '@/components/LanguageMetaTags';

export default function ContentAnalyticsPage() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  
  // For demo purposes, we're temporarily allowing access without authentication
  // In a production environment, this would check for admin privileges
  useEffect(() => {
    // Demo code - no authentication check for demonstration purposes
    console.log('Content Analytics page loaded successfully');
    
    // The following code would be used in production:
    /*
    const token = localStorage.getItem('token');
    if (!token) {
      setLocation('/login?redirect=/admin/content-analytics');
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
      setLocation('/login?redirect=/admin/content-analytics');
    }
    */
  }, [setLocation]);

  return (
    <MainLayout>
      <Helmet>
        <title>Content Analytics | Elevion</title>
        <meta name="description" content="Content engagement analytics dashboard for Elevion" />
        <meta name="robots" content="noindex,nofollow" />
        <html lang={t('language_code')} />
      </Helmet>
      <LanguageMetaTags currentPath="/admin/content-analytics" />
      
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
          
          <h1 className="text-3xl font-bold">Content Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track content performance and engagement metrics with AI-powered insights
          </p>
        </div>
        
        <ContentEngagementAnalytics />
      </div>
    </MainLayout>
  );
}