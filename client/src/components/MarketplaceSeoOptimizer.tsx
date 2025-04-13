import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Check, Search, RefreshCw, Code, Tag, FileText, ArrowRightCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface MarketplaceSeoOptimizerProps {
  itemId: number;
  name: string;
  description: string;
  category: string;
}

export default function MarketplaceSeoOptimizer({
  itemId,
  name,
  description,
  category
}: MarketplaceSeoOptimizerProps) {
  const [optimizeWhat, setOptimizeWhat] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('generated');
  const [seoData, setSeoData] = useState<{
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
    schemaMarkup?: string;
    focusKeyword?: string;
  }>({});
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Mutation for getting SEO optimizations
  const optimizeSeoMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/seo/optimize-marketplace-item', {
        itemId,
        optimizeWhat
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setSeoData({
          seoTitle: data.seoTitle,
          seoDescription: data.seoDescription,
          seoKeywords: data.seoKeywords,
          schemaMarkup: data.schemaMarkup,
          focusKeyword: data.focusKeyword
        });
        setDialogOpen(true);
        toast({
          title: 'SEO Optimization Ready',
          description: 'We\'ve generated optimized SEO content for your marketplace item.'
        });
      } else {
        toast({
          title: 'Optimization Failed',
          description: data.message || 'Failed to generate SEO optimizations.',
          variant: 'destructive'
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Optimization Failed',
        description: 'An error occurred while generating SEO optimizations.',
        variant: 'destructive'
      });
      console.error('SEO optimization error:', error);
    }
  });
  
  // Mutation for saving SEO data
  const saveSeoMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/seo/update-marketplace-seo/${itemId}`, seoData);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'SEO Data Saved',
          description: 'Your SEO optimizations have been applied to the marketplace item.',
          variant: 'default'
        });
        queryClient.invalidateQueries({ queryKey: ['/api/marketplace'] });
        setDialogOpen(false);
      } else {
        toast({
          title: 'Save Failed',
          description: data.message || 'Failed to save SEO data.',
          variant: 'destructive'
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Save Failed',
        description: 'An error occurred while saving SEO data.',
        variant: 'destructive'
      });
      console.error('SEO save error:', error);
    }
  });
  
  // Handle input change for SEO data fields
  const handleInputChange = (field: string, value: string) => {
    setSeoData((prev) => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Render skeleton loading state
  const renderSkeletonLoading = () => (
    <div className="space-y-4 p-5">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
  
  return (
    <>
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-blue-500" />
            SEO Optimization
          </CardTitle>
          <CardDescription>
            Optimize this marketplace item for better search engine visibility
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="optimize-what" className="text-sm font-medium mb-1 block">
              What would you like to optimize?
            </Label>
            <ToggleGroup 
              type="single" 
              value={optimizeWhat}
              onValueChange={(value) => value && setOptimizeWhat(value)}
              className="justify-start"
            >
              <ToggleGroupItem value="title" size="sm" className="gap-1">
                <Tag className="w-3.5 h-3.5" />
                <span className="text-xs">Title</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="description" size="sm" className="gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span className="text-xs">Description</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="schema" size="sm" className="gap-1">
                <Code className="w-3.5 h-3.5" />
                <span className="text-xs">Schema</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="all" size="sm" className="gap-1">
                <Check className="w-3.5 h-3.5" />
                <span className="text-xs">All</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardContent>
        <CardFooter className="pt-0 flex justify-end">
          <Button
            onClick={() => optimizeSeoMutation.mutate()}
            disabled={optimizeSeoMutation.isPending}
            className="bg-slate-blue-600 hover:bg-slate-blue-700 text-sm"
          >
            {optimizeSeoMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <ArrowRightCircle className="w-4 h-4 mr-2" />
                Generate SEO
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Search className="w-5 h-5 text-slate-blue-500" />
              SEO Optimization Results
            </DialogTitle>
            <DialogDescription>
              Review and apply the AI-generated SEO optimizations for your marketplace item.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="generated">AI Generated</TabsTrigger>
              <TabsTrigger value="custom">Customize</TabsTrigger>
            </TabsList>
            
            <TabsContent value="generated" className="mt-4">
              {optimizeSeoMutation.isPending ? (
                renderSkeletonLoading()
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  {seoData.focusKeyword && (
                    <div>
                      <Label className="text-sm font-medium text-slate-700 mb-1 block">
                        Focus Keyword
                      </Label>
                      <Badge variant="outline" className="bg-slate-blue-50 text-slate-blue-700 border-slate-blue-200">
                        {seoData.focusKeyword}
                      </Badge>
                    </div>
                  )}
                  
                  {seoData.seoTitle && (
                    <div>
                      <Label className="text-sm font-medium text-slate-700 mb-1 block">
                        SEO Title
                      </Label>
                      <div className="bg-slate-50 p-3 rounded-md border border-slate-200 text-slate-800">
                        {seoData.seoTitle}
                      </div>
                      <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                        <Check className="w-3 h-3 text-green-500" />
                        {seoData.seoTitle.length} characters (Recommended: 50-60)
                      </p>
                    </div>
                  )}
                  
                  {seoData.seoDescription && (
                    <div>
                      <Label className="text-sm font-medium text-slate-700 mb-1 block">
                        Meta Description
                      </Label>
                      <div className="bg-slate-50 p-3 rounded-md border border-slate-200 text-slate-700">
                        {seoData.seoDescription}
                      </div>
                      <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                        <Check className="w-3 h-3 text-green-500" />
                        {seoData.seoDescription.length} characters (Recommended: 150-160)
                      </p>
                    </div>
                  )}
                  
                  {seoData.seoKeywords && (
                    <div>
                      <Label className="text-sm font-medium text-slate-700 mb-1 block">
                        Keywords
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {seoData.seoKeywords.split(',').map((keyword, index) => (
                          <Badge key={index} variant="outline" className="bg-slate-50">
                            {keyword.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {seoData.schemaMarkup && (
                    <div>
                      <Label className="text-sm font-medium text-slate-700 mb-1 block">
                        Schema Markup
                      </Label>
                      <div className="bg-slate-900 text-slate-100 p-3 rounded-md border border-slate-700 font-mono text-xs overflow-auto max-h-48">
                        <pre>{seoData.schemaMarkup}</pre>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </TabsContent>
            
            <TabsContent value="custom" className="mt-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="seo-title" className="text-sm font-medium text-slate-700 mb-1 block">
                    SEO Title <span className="text-xs text-slate-500">(50-60 characters)</span>
                  </Label>
                  <Input
                    id="seo-title"
                    value={seoData.seoTitle || ''}
                    onChange={(e) => handleInputChange('seoTitle', e.target.value)}
                    className="w-full"
                    maxLength={70}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    {(seoData.seoTitle?.length || 0)} characters
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="seo-description" className="text-sm font-medium text-slate-700 mb-1 block">
                    Meta Description <span className="text-xs text-slate-500">(150-160 characters)</span>
                  </Label>
                  <Textarea
                    id="seo-description"
                    value={seoData.seoDescription || ''}
                    onChange={(e) => handleInputChange('seoDescription', e.target.value)}
                    className="w-full h-24"
                    maxLength={170}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    {(seoData.seoDescription?.length || 0)} characters
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="seo-keywords" className="text-sm font-medium text-slate-700 mb-1 block">
                    Keywords <span className="text-xs text-slate-500">(comma-separated)</span>
                  </Label>
                  <Input
                    id="seo-keywords"
                    value={seoData.seoKeywords || ''}
                    onChange={(e) => handleInputChange('seoKeywords', e.target.value)}
                    className="w-full"
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
                
                <div>
                  <Label htmlFor="focus-keyword" className="text-sm font-medium text-slate-700 mb-1 block">
                    Focus Keyword <span className="text-xs text-slate-500">(main keyword)</span>
                  </Label>
                  <Input
                    id="focus-keyword"
                    value={seoData.focusKeyword || ''}
                    onChange={(e) => handleInputChange('focusKeyword', e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <Label htmlFor="schema-markup" className="text-sm font-medium text-slate-700 mb-1 block">
                    Schema Markup <span className="text-xs text-slate-500">(JSON-LD)</span>
                  </Label>
                  <Textarea
                    id="schema-markup"
                    value={seoData.schemaMarkup || ''}
                    onChange={(e) => handleInputChange('schemaMarkup', e.target.value)}
                    className="w-full h-32 font-mono text-xs"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button
              onClick={() => saveSeoMutation.mutate()}
              disabled={saveSeoMutation.isPending}
              className="bg-slate-blue-600 hover:bg-slate-blue-700"
            >
              {saveSeoMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Apply SEO Optimizations'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}