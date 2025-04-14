import React, { useState } from 'react';
import { marketplaceCategories, MarketplaceCategory } from '@/data/marketplaceCategories';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, X } from 'lucide-react';

interface MarketplaceCategorySelectorProps {
  selectedCategory: string;
  onChange: (categoryId: string) => void;
  className?: string;
}

const MarketplaceCategorySelector: React.FC<MarketplaceCategorySelectorProps> = ({ 
  selectedCategory, 
  onChange,
  className = ''
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get the selected category object
  const selectedCategoryObj = marketplaceCategories.find(
    category => category.id === selectedCategory
  );

  // For filtered categories based on search query
  const filteredCategories = marketplaceCategories.filter(category => 
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.subcategories?.some(sub => 
      sub.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Split categories into popular and all
  const popularCategories = marketplaceCategories.filter(cat => cat.popular);

  // Handle category selection
  const handleSelectCategory = (category: MarketplaceCategory) => {
    onChange(category.id);
    setIsDialogOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <Button 
        variant="outline" 
        className={`flex items-center justify-between w-full h-10 px-3 py-2 ${className}`}
        onClick={() => setIsDialogOpen(true)}
      >
        <div className="flex items-center">
          {selectedCategoryObj ? (
            <>
              <span className="mr-2">
                {React.createElement(selectedCategoryObj.icon, { className: "h-4 w-4" })}
              </span>
              <span className="text-sm font-medium">
                {selectedCategoryObj.name}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">Select a category</span>
          )}
        </div>
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select a Category</DialogTitle>
          </DialogHeader>
          
          <div className="relative mb-4">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              className="pl-8 pr-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2 h-4 w-4 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {searchQuery ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category) => (
                  <Button
                    key={category.id}
                    variant="outline"
                    className="flex items-start justify-start h-auto p-3 text-left"
                    onClick={() => handleSelectCategory(category)}
                  >
                    <div className="mr-3 mt-0.5">
                      {React.createElement(category.icon, { className: "h-5 w-5" })}
                    </div>
                    <div>
                      <h3 className="font-medium">{category.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {category.description}
                      </p>
                    </div>
                  </Button>
                ))
              ) : (
                <div className="col-span-2 text-center p-4">
                  <p className="text-muted-foreground">No categories found</p>
                </div>
              )}
            </div>
          ) : (
            <Tabs defaultValue="popular">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="popular">Popular Categories</TabsTrigger>
                <TabsTrigger value="all">All Categories</TabsTrigger>
              </TabsList>
              
              <TabsContent value="popular" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {popularCategories.map((category) => (
                    <Button
                      key={category.id}
                      variant="outline"
                      className="flex items-start justify-start h-auto p-3 text-left"
                      onClick={() => handleSelectCategory(category)}
                    >
                      <div className="mr-3 mt-0.5">
                        {React.createElement(category.icon, { className: "h-5 w-5" })}
                      </div>
                      <div>
                        <h3 className="font-medium">{category.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {category.description}
                        </p>
                      </div>
                    </Button>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="all" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {marketplaceCategories.map((category) => (
                    <Button
                      key={category.id}
                      variant="outline"
                      className="flex items-start justify-start h-auto p-3 text-left"
                      onClick={() => handleSelectCategory(category)}
                    >
                      <div className="mr-3 mt-0.5">
                        {React.createElement(category.icon, { className: "h-5 w-5" })}
                      </div>
                      <div>
                        <h3 className="font-medium">{category.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {category.description}
                        </p>
                        {category.subcategories && category.subcategories.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {category.subcategories.slice(0, 3).map((subcategory, index) => (
                              <Badge key={index} variant="secondary" className="text-xs font-normal">
                                {subcategory}
                              </Badge>
                            ))}
                            {category.subcategories.length > 3 && (
                              <Badge variant="outline" className="text-xs font-normal">
                                +{category.subcategories.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MarketplaceCategorySelector;