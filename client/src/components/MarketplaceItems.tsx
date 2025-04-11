import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag, ShoppingCart, Search } from "lucide-react";
import { queryClient, apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

const MarketplaceItems: React.FC = () => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch marketplace items
  const { data: items, isLoading, error } = useQuery({
    queryKey: ['/api/marketplace'],
    refetchOnWindowFocus: false,
  });

  // Purchase item
  const handlePurchase = async (itemId: number) => {
    try {
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to purchase this item",
          variant: "destructive",
        });
        return;
      }

      // Redirect to purchase page
      window.location.href = `/marketplace/purchase?itemId=${itemId}`;
    } catch (error) {
      console.error('Error purchasing item:', error);
      toast({
        title: "Purchase Error",
        description: "Failed to process purchase request",
        variant: "destructive",
      });
    }
  };

  // Filter items by category and search query
  const filteredItems = React.useMemo(() => {
    if (!items?.data) return [];
    
    return items.data.filter((item: any) => {
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesSearch = searchQuery === '' || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });
  }, [items, categoryFilter, searchQuery]);

  // Extract unique categories for the filter
  const categories = React.useMemo(() => {
    if (!items?.data) return [];
    const uniqueCategories = new Set(items.data.map((item: any) => item.category));
    return Array.from(uniqueCategories);
  }, [items]);

  if (isLoading) {
    return (
      <div>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Skeleton className="h-10 w-full md:w-1/4" />
          <Skeleton className="h-10 w-full md:w-2/4" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="flex flex-col">
              <CardHeader>
                <Skeleton className="h-40 w-full rounded-md mb-2" />
                <Skeleton className="h-6 w-3/4 mb-1" />
                <Skeleton className="h-5 w-1/2" />
              </CardHeader>
              <CardContent className="flex-grow">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-10 w-1/3" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <h3 className="text-xl font-bold text-red-500">Error Loading Marketplace</h3>
        <p className="mt-2">Failed to fetch marketplace items. Please try again later.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-1/4">
          <Select
            value={categoryFilter}
            onValueChange={setCategoryFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full md:w-2/4 relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search marketplace..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium">No items found</h3>
          <p className="text-muted-foreground mt-2">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredItems.map((item: any) => (
            <Card key={item.id} className="flex flex-col transition-all duration-300 hover:shadow-lg border-opacity-50 hover:border-primary overflow-hidden">
              {item.images && item.images.length > 0 && (
                <div className="h-40 overflow-hidden">
                  <img 
                    src={item.images[0]} 
                    alt={item.name}
                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <CardHeader className={item.images && item.images.length > 0 ? "pt-4" : "pt-6"}>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-bold">{item.name}</CardTitle>
                  <Badge variant="outline" className="ml-2 font-normal">
                    {item.category}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2 mt-1">
                  {item.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow pt-0">
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.map((tag: string, index: number) => (
                      <div key={index} className="flex items-center text-xs bg-secondary/50 text-secondary-foreground rounded-full px-2 py-1">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between items-center pt-2">
                <div className="text-lg font-bold text-primary">
                  ${parseFloat(item.price).toFixed(2)}
                </div>
                <Button
                  onClick={() => handlePurchase(item.id)}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Purchase
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketplaceItems;