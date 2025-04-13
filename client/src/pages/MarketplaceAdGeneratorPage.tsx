import React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import MainLayout from '@/layouts/MainLayout';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Home, ShoppingBag, MessageSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import MarketplaceAdGenerator from '@/components/MarketplaceAdGenerator';

const MarketplaceAdGeneratorPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">
                  <Home className="h-4 w-4 mr-1" />
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/marketplace">
                  <ShoppingBag className="h-4 w-4 mr-1" />
                  Marketplace
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/marketplace/ad-generator">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Ad Generator
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
            Marketplace Ad Generator
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Create compelling, AI-generated ad content for your premium marketplace listings to attract more customers and increase engagement.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <MarketplaceAdGenerator />
        </div>
      </div>
    </MainLayout>
  );
};

export default MarketplaceAdGeneratorPage;