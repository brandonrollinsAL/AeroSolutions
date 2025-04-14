import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import MainLayout from '@/layouts/MainLayout';
import MarketplaceItems from '@/components/MarketplaceItems';
import Advertisement from '@/components/Advertisement';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  ChartBar, 
  MessageSquare, 
  ShoppingCart, 
  PlusCircle, 
  Search,
  Filter,
  Layers
} from 'lucide-react';
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  getPopularCategories, 
  marketplaceCategories, 
  MarketplaceCategory 
} from '@/data/marketplaceCategories';

const MarketplacePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // Get popular categories
  const popularCategories = getPopularCategories();
  
  // Filter categories based on search
  const filteredCategories = marketplaceCategories.filter(category => 
    searchQuery.length === 0 || 
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (category.subcategories || []).some(sub => 
      sub.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

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
            
            <div className="mb-8">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10 pr-4 h-10"
                  placeholder="Search for categories, services, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between mb-4">
                  <TabsList>
                    <TabsTrigger value="all" className="flex items-center gap-1">
                      <Layers className="h-4 w-4" />
                      <span>All Categories</span>
                    </TabsTrigger>
                    <TabsTrigger value="popular" className="flex items-center gap-1">
                      <Filter className="h-4 w-4" />
                      <span>Popular</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="all" className="mt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredCategories.length > 0 ? (
                      filteredCategories.map((category) => (
                        <CategoryCard key={category.id} category={category} />
                      ))
                    ) : (
                      <div className="col-span-3 py-10 text-center">
                        <p className="text-muted-foreground">No categories found matching your search.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="popular" className="mt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredCategories.length > 0 ? (
                      filteredCategories
                        .filter(category => category.popular)
                        .map((category) => (
                          <CategoryCard key={category.id} category={category} />
                        ))
                    ) : (
                      <div className="col-span-3 py-10 text-center">
                        <p className="text-muted-foreground">No popular categories found matching your search.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-bold text-primary mb-6">Marketplace Listings</h2>
              <MarketplaceItems />
            </div>
            
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
                {popularCategories.slice(0, 6).map((category) => (
                  <li key={category.id} className="flex items-center gap-2 text-sm hover:text-primary transition-colors cursor-pointer">
                    {React.createElement(category.icon, { className: "h-4 w-4" })}
                    <span>{category.name}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <Advertisement type="sidebar" position="sidebar" />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

// Category Card Component
const CategoryCard: React.FC<{ category: MarketplaceCategory }> = ({ category }) => {
  return (
    <Link href={`/marketplace/category/${category.id}`}>
      <Card className="h-full transition-all duration-300 hover:shadow-md hover:border-primary/50 cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-full mt-1">
              {React.createElement(category.icon, { className: "h-5 w-5 text-primary" })}
            </div>
            <div>
              <h3 className="font-medium text-base">{category.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {category.description}
              </p>
              
              {category.subcategories && category.subcategories.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {category.subcategories.slice(0, 3).map((subcategory, index) => (
                    <span key={index} className="text-xs bg-secondary/50 text-secondary-foreground px-2 py-0.5 rounded-full">
                      {subcategory}
                    </span>
                  ))}
                  {category.subcategories.length > 3 && (
                    <span className="text-xs bg-secondary/30 text-secondary-foreground px-2 py-0.5 rounded-full">
                      +{category.subcategories.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default MarketplacePage;