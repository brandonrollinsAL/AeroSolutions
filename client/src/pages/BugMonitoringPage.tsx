import React from 'react';
import BugMonitoringDashboard from '@/components/BugMonitoringDashboard';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Helmet } from 'react-helmet';

const BugMonitoringPage = () => {
  return (
    <>
      <Helmet>
        <title>Bug Monitoring | Elevion</title>
        <meta 
          name="description" 
          content="Detect, analyze and fix application issues with our AI-powered bug monitoring system" 
        />
      </Helmet>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <PageHeader
          title="Bug Monitoring"
          description="Detect, analyze and fix issues with our AI-powered monitoring system"
          breadcrumbs={[
            { title: 'Home', href: '/' },
            { title: 'Tools', href: '/tools' },
            { title: 'Bug Monitoring', href: '/bug-monitoring' }
          ]}
        />
        
        <BugMonitoringDashboard />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2">How It Works</h3>
              <p className="text-sm text-muted-foreground">
                Our bug monitoring system uses advanced AI to automatically detect issues in your application. 
                It analyzes error logs, user behavior patterns, and feedback to identify potential bugs before 
                they impact your business.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2">1</span>
                  <span>Error logs are automatically analyzed using AI pattern recognition</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2">2</span>
                  <span>User feedback is processed to identify reported issues</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2">3</span>
                  <span>AI suggests potential fixes and can even auto-fix certain issues</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2">4</span>
                  <span>Track and manage issues with the comprehensive dashboard</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2">Benefits</h3>
              <p className="text-sm text-muted-foreground">
                Our AI-powered bug monitoring system helps you maintain high-quality software while reducing 
                development and maintenance costs.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Early Detection</h4>
                  <p className="text-xs text-muted-foreground">Catch issues before users experience them</p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Auto Fixes</h4>
                  <p className="text-xs text-muted-foreground">AI can automatically fix certain types of bugs</p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Reduced Costs</h4>
                  <p className="text-xs text-muted-foreground">Lower maintenance costs through early detection</p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Comprehensive Analysis</h4>
                  <p className="text-xs text-muted-foreground">Analyze errors and user feedback in one place</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default BugMonitoringPage;