import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { FaUsers, FaChartBar, FaRegCalendarAlt, FaExternalLinkAlt, FaLock, FaDatabase, FaGlobe, FaClipboard, FaUser, FaCode } from 'react-icons/fa';
import { Shield, Activity, BarChart } from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import LanguageMetaTags from '@/components/LanguageMetaTags';

export default function AdminDashboardPage() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  
  // Check if user is logged in and is admin
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLocation('/login?redirect=/admin');
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
      setLocation('/login?redirect=/admin');
    }
  }, [setLocation]);

  // Demo statistics - in a real app these would come from an API
  const stats = {
    clientPreviewsActive: 4,
    clientPreviewsExpired: 2,
    totalUsers: 245,
    activeSubscriptions: 128,
    marketplaceItems: 18,
    totalRevenue: 48750.25,
    activeAdvertisements: 7,
    averageConversionRate: 3.5,
  };

  return (
    <MainLayout>
      <Helmet>
        <title>Admin Dashboard | Aero Solutions</title>
        <meta name="description" content="Admin dashboard for Aero Solutions platform" />
        <meta name="robots" content="noindex,nofollow" />
        <html lang={t('language_code')} />
      </Helmet>
      <LanguageMetaTags />
      
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Shield className="mr-2 h-6 w-6 text-blue-600" />
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage, monitor, and control all aspects of the Aero Solutions platform
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button onClick={() => window.open('/', '_blank')}>
                <FaExternalLinkAlt className="mr-2 h-4 w-4" />
                View Site
              </Button>
            </div>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Client Previews</CardTitle>
                <FaUsers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.clientPreviewsActive}</div>
                <p className="text-xs text-muted-foreground">
                  Active ({stats.clientPreviewsExpired} expired)
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">User Accounts</CardTitle>
                <FaUser className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Total registered users
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
                <FaRegCalendarAlt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
                <p className="text-xs text-muted-foreground">
                  Active paid plans
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Total lifetime revenue
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Admin Actions Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-blue-100 shadow hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <FaLock className="mr-2 h-5 w-5 text-blue-600" />
                  Client Previews
                </CardTitle>
                <CardDescription>
                  Manage access codes for client platform demos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Active previews</span>
                    <span className="font-medium">{stats.clientPreviewsActive}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Expired previews</span>
                    <span className="font-medium">{stats.clientPreviewsExpired}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="default" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => setLocation('/admin/client-previews')}
                >
                  Manage Previews
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="border-blue-100 shadow hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <FaDatabase className="mr-2 h-5 w-5 text-blue-600" />
                  Content Management
                </CardTitle>
                <CardDescription>
                  Manage website content and platform data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Marketplace items</span>
                    <span className="font-medium">{stats.marketplaceItems}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Active advertisements</span>
                    <span className="font-medium">{stats.activeAdvertisements}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="default" 
                  className="w-full"
                  onClick={() => toast({
                    title: 'Coming Soon',
                    description: 'This feature is under development',
                  })}
                >
                  Manage Content
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="border-blue-100 shadow hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <FaChartBar className="mr-2 h-5 w-5 text-blue-600" />
                  Analytics
                </CardTitle>
                <CardDescription>
                  View platform usage and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Conversion rate</span>
                    <span className="font-medium">{stats.averageConversionRate}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>User engagement</span>
                    <span className="font-medium">High</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="default" 
                  className="w-full"
                  onClick={() => toast({
                    title: 'Coming Soon',
                    description: 'This feature is under development',
                  })}
                >
                  View Analytics
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Access</CardTitle>
              <CardDescription>Common administrative tasks and tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto flex flex-col items-center justify-center p-4 gap-2"
                  onClick={() => window.open('/client-preview/demo', '_blank')}
                >
                  <FaGlobe className="h-5 w-5 text-blue-600" />
                  <span className="text-sm">View Demo Preview</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto flex flex-col items-center justify-center p-4 gap-2"
                  onClick={() => {
                    navigator.clipboard.writeText('demo');
                    toast({
                      title: 'Copied!',
                      description: 'Demo access code copied to clipboard',
                    });
                  }}
                >
                  <FaClipboard className="h-5 w-5 text-blue-600" />
                  <span className="text-sm">Copy Demo Code</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto flex flex-col items-center justify-center p-4 gap-2"
                  onClick={() => setLocation('/admin/client-previews')}
                >
                  <FaCode className="h-5 w-5 text-blue-600" />
                  <span className="text-sm">Manage Access Codes</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto flex flex-col items-center justify-center p-4 gap-2"
                  onClick={() => {
                    localStorage.removeItem('token');
                    setLocation('/login');
                    toast({
                      title: 'Logged Out',
                      description: 'You have been logged out successfully',
                    });
                  }}
                >
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span className="text-sm">Logout</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}