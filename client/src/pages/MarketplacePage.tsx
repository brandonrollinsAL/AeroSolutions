import React from 'react';
import { Helmet } from 'react-helmet';
import MainLayout from '@/layouts/MainLayout';
import MarketplaceItems from '@/components/MarketplaceItems';
import Advertisement from '@/components/Advertisement';

const MarketplacePage: React.FC = () => {
  return (
    <MainLayout>
      <Helmet>
        <title>Aviation Marketplace | Aero Solutions</title>
        <meta 
          name="description" 
          content="Explore our aviation marketplace for premium tools, software, and services. Find specialized solutions for aviation professionals and enthusiasts." 
        />
        <meta name="keywords" content="aviation marketplace, aviation tools, aviation software, aviation services" />
      </Helmet>

      <div className="container mx-auto py-10 px-4 md:px-6">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-3/4">
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">Aviation Marketplace</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Discover premium tools, software, and services designed specifically for aviation professionals and enthusiasts.
            </p>

            <MarketplaceItems />
            
            <div className="mt-16">
              <Advertisement type="banner" position="inline" className="mx-auto" />
            </div>
          </div>
          
          <div className="w-full md:w-1/4 space-y-6">
            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Seller Information</h3>
              <p className="text-sm text-muted-foreground mb-4">
                All products in our marketplace are curated and verified by our team to ensure quality and relevance to the aviation industry.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Verified Sellers</span>
                  <span className="text-sm font-medium">100%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Secure Payments</span>
                  <span className="text-sm font-medium">Stripe</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Satisfaction</span>
                  <span className="text-sm font-medium">30-day Guarantee</span>
                </div>
              </div>
            </div>
            
            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Popular Categories</h3>
              <ul className="space-y-2">
                <li className="text-sm hover:text-primary transition-colors cursor-pointer">Flight Planning Tools</li>
                <li className="text-sm hover:text-primary transition-colors cursor-pointer">Aircraft Maintenance</li>
                <li className="text-sm hover:text-primary transition-colors cursor-pointer">Training Resources</li>
                <li className="text-sm hover:text-primary transition-colors cursor-pointer">Aviation Data</li>
                <li className="text-sm hover:text-primary transition-colors cursor-pointer">Flight Simulation</li>
                <li className="text-sm hover:text-primary transition-colors cursor-pointer">Pilot Accessories</li>
              </ul>
            </div>
            
            <Advertisement type="sidebar" position="sidebar" />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default MarketplacePage;