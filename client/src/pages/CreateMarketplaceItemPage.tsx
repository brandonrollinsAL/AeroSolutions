import React from 'react';
import { Helmet } from 'react-helmet';
import MainLayout from '@/layouts/MainLayout';
import CreateMarketplaceItemForm from '@/components/CreateMarketplaceItemForm';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldCheck } from 'lucide-react';

const CreateMarketplaceItemPage: React.FC = () => {
  // Check if user is authenticated
  const isAuthenticated = localStorage.getItem('token') !== null;

  return (
    <MainLayout>
      <Helmet>
        <title>Create Marketplace Listing | Elevion</title>
        <meta 
          name="description" 
          content="Add your services or products to the Elevion marketplace. Reach potential clients and grow your business." 
        />
        <meta 
          name="keywords" 
          content="create listing, sell services, digital marketplace, web services marketplace" 
        />
      </Helmet>

      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">Create Marketplace Listing</h1>
            <p className="text-lg text-muted-foreground">
              Share your digital services or products with potential clients on the Elevion marketplace.
            </p>
          </div>

          {!isAuthenticated ? (
            <Alert variant="destructive" className="mb-6">
              <ShieldCheck className="h-4 w-4" />
              <AlertDescription>
                You must be logged in to create a marketplace listing. Please sign in or create an account.
              </AlertDescription>
            </Alert>
          ) : (
            <CreateMarketplaceItemForm />
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default CreateMarketplaceItemPage;