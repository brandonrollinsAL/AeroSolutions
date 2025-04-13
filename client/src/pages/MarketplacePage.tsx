import React from 'react';
import { Helmet } from 'react-helmet';
import MainLayout from '@/layouts/MainLayout';
import MarketplaceItems from '@/components/MarketplaceItems';
import Advertisement from '@/components/Advertisement';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ChartBar, MessageSquare, ShoppingCart, PlusCircle } from 'lucide-react';

const MarketplacePage: React.FC = () => {
  return (
    <MainLayout>
      <Helmet>
        <title>Business Marketplace | Elevion Web Development</title>
        <meta 
          name="description" 
          content="Discover premium web tools, digital services, and small business solutions in our marketplace. Find specialized web development resources to grow your online presence." 
        />
        <meta name="keywords" content="web development marketplace, small business tools, digital services, web solutions" />
      </Helmet>

      <div className="container mx-auto py-10 px-4 md:px-6">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-3/4">
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">Elevion Marketplace</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Discover premium tools, software, and services designed to help small businesses succeed in the digital landscape.
            </p>
            
            <div className="flex flex-wrap gap-3 mb-8">
              <Link href="/marketplace">
                <Button variant="outline" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  All Services
                </Button>
              </Link>
              <Link href="/marketplace/analytics">
                <Button variant="outline" className="flex items-center gap-2">
                  <ChartBar className="h-4 w-4" />
                  Service Analytics
                </Button>
              </Link>
              <Link href="/marketplace/ad-generator">
                <Button variant="outline" className="flex items-center gap-2 bg-primary/5 border-primary/20">
                  <MessageSquare className="h-4 w-4" />
                  Generate Ad Content
                </Button>
              </Link>
              <Link href="/marketplace/create">
                <Button variant="outline" className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  List Your Service
                </Button>
              </Link>
            </div>

            <MarketplaceItems />
            
            <div className="mt-16">
              <Advertisement type="banner" position="inline" className="mx-auto" />
            </div>
          </div>
          
          <div className="w-full md:w-1/4 space-y-6">
            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Seller Information</h3>
              <p className="text-sm text-muted-foreground mb-4">
                All products in our marketplace are curated and verified by our team to ensure quality and relevance for small businesses.
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
                <li className="text-sm hover:text-primary transition-colors cursor-pointer">Website Templates</li>
                <li className="text-sm hover:text-primary transition-colors cursor-pointer">Marketing Tools</li>
                <li className="text-sm hover:text-primary transition-colors cursor-pointer">E-commerce Solutions</li>
                <li className="text-sm hover:text-primary transition-colors cursor-pointer">SEO Services</li>
                <li className="text-sm hover:text-primary transition-colors cursor-pointer">Content Creation</li>
                <li className="text-sm hover:text-primary transition-colors cursor-pointer">AI Tools</li>
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