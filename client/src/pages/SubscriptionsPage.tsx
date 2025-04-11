import React from 'react';
import { Helmet } from 'react-helmet';
import MainLayout from '@/layouts/MainLayout';
import SubscriptionPlans from '@/components/SubscriptionPlans';
import Advertisement from '@/components/Advertisement';

const SubscriptionsPage: React.FC = () => {
  return (
    <MainLayout>
      <Helmet>
        <title>Premium Subscriptions | Aero Solutions</title>
        <meta 
          name="description" 
          content="Enhance your aviation experience with premium subscriptions from Aero Solutions. Access exclusive features, priority support, and advanced tools." 
        />
        <meta name="keywords" content="aviation subscriptions, premium aviation services, aero solutions membership" />
      </Helmet>

      <div className="container mx-auto py-10 px-4 md:px-6">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-3/4">
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">Premium Subscriptions</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Elevate your aviation experience with our premium subscription plans. 
              Gain access to exclusive features, priority support, and advanced tools.
            </p>

            <SubscriptionPlans />
            
            <div className="mt-10">
              <h2 className="text-2xl font-semibold mb-4">Why Subscribe?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card p-6 rounded-lg border shadow-sm">
                  <h3 className="text-xl font-medium text-primary mb-2">Advanced Features</h3>
                  <p className="text-muted-foreground">
                    Unlock powerful tools and capabilities not available in standard versions.
                  </p>
                </div>
                <div className="bg-card p-6 rounded-lg border shadow-sm">
                  <h3 className="text-xl font-medium text-primary mb-2">Priority Support</h3>
                  <p className="text-muted-foreground">
                    Get faster response times and dedicated assistance for your queries.
                  </p>
                </div>
                <div className="bg-card p-6 rounded-lg border shadow-sm">
                  <h3 className="text-xl font-medium text-primary mb-2">Exclusive Content</h3>
                  <p className="text-muted-foreground">
                    Access premium content, guides, and resources created by industry experts.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-16">
              <Advertisement type="banner" position="inline" className="mx-auto" />
            </div>
          </div>
          
          <div className="w-full md:w-1/4 space-y-6">
            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Subscription FAQ</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">How do I cancel my subscription?</h4>
                  <p className="text-sm text-muted-foreground">
                    You can cancel anytime from your account dashboard. Your benefits continue until the end of your billing period.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Are there any hidden fees?</h4>
                  <p className="text-sm text-muted-foreground">
                    No, the price you see is the price you pay. No setup fees or hidden charges.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Can I switch plans?</h4>
                  <p className="text-sm text-muted-foreground">
                    Yes, you can upgrade or downgrade your subscription at any time.
                  </p>
                </div>
              </div>
            </div>
            
            <Advertisement type="sidebar" position="sidebar" />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SubscriptionsPage;