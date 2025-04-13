import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ListingDescriptionGenerator from './ListingDescriptionGenerator';

// Form validation schema
const createItemSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  price: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: 'Price must be a valid number',
  }),
  category: z.string().min(1, 'Please select a category'),
  tags: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  isAvailable: z.boolean().default(true),
});

type CreateItemFormValues = z.infer<typeof createItemSchema>;

const CreateMarketplaceItemForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [activeTab, setActiveTab] = useState('basicInfo');
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<CreateItemFormValues>({
    resolver: zodResolver(createItemSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      category: '',
      tags: [],
      images: [],
      isAvailable: true,
    },
  });

  const onSubmit = async (data: CreateItemFormValues) => {
    setIsSubmitting(true);
    setError(null);

    // Ensure price is a string (for Stripe compatibility)
    const formattedData = {
      ...data,
      price: data.price.toString(),
    };

    try {
      const response = await apiRequest('POST', '/api/marketplace', formattedData);
      
      if (response.ok) {
        const result = await response.json();
        
        // Invalidate the marketplace cache to refresh the listings
        queryClient.invalidateQueries({ queryKey: ['/api/marketplace'] });
        
        toast({
          title: "Listing created successfully",
          description: `Your item "${data.name}" has been added to the marketplace.`,
        });
        
        // Redirect to the marketplace page
        navigate('/marketplace');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create marketplace item');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      toast({
        title: "Error creating listing",
        description: err.message || 'Failed to create marketplace item',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (newTag && newTag.trim().length > 0) {
      const currentTags = form.getValues('tags') || [];
      if (!currentTags.includes(newTag.trim())) {
        form.setValue('tags', [...currentTags, newTag.trim()]);
        setNewTag('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags') || [];
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  const addImage = () => {
    if (newImageUrl && newImageUrl.trim().length > 0) {
      const currentImages = form.getValues('images') || [];
      if (!currentImages.includes(newImageUrl.trim())) {
        form.setValue('images', [...currentImages, newImageUrl.trim()]);
        setNewImageUrl('');
      }
    }
  };

  const removeImage = (imageToRemove: string) => {
    const currentImages = form.getValues('images') || [];
    form.setValue('images', currentImages.filter(image => image !== imageToRemove));
  };

  const handleDescriptionGenerated = (description: string) => {
    form.setValue('description', description);
    // Switch back to basic info tab
    setActiveTab('basicInfo');
    toast({
      title: "Description added",
      description: "The AI-generated description has been added to your listing form.",
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create Marketplace Listing</CardTitle>
        <CardDescription>
          Add a new service or product to the Elevion marketplace
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="basicInfo">Basic Information</TabsTrigger>
            <TabsTrigger value="aiDescription">AI Description Generator</TabsTrigger>
            <TabsTrigger value="additional">Additional Details</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <TabsContent value="basicInfo">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service/Product Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Responsive Website Design" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter a clear, descriptive name for your service or product
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Provide a detailed description of what you're offering..." 
                            className="min-h-[150px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Describe the benefits, features, and unique selling points of your offering.
                          You can use the AI Description Generator tab to help create compelling content.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (USD)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              placeholder="e.g., 99.99" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Enter the price in USD (no currency symbol needed)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="web_development">Web Development</SelectItem>
                              <SelectItem value="design">Design</SelectItem>
                              <SelectItem value="marketing">Digital Marketing</SelectItem>
                              <SelectItem value="content">Content Creation</SelectItem>
                              <SelectItem value="seo">SEO Services</SelectItem>
                              <SelectItem value="consulting">Consulting</SelectItem>
                              <SelectItem value="ecommerce">E-Commerce Solutions</SelectItem>
                              <SelectItem value="mobile">Mobile App Development</SelectItem>
                              <SelectItem value="other">Other Services</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the most appropriate category for your listing
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="isAvailable"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Availability</FormLabel>
                          <FormDescription>
                            Make this listing visible and available for purchase
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="aiDescription">
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4 mb-6">
                    <h3 className="text-base font-medium">AI-Powered Description Generator</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Generate a professional, compelling description for your service or product using our AI tool.
                      Simply enter your service name and click 'Generate'.
                    </p>
                  </div>
                  <ListingDescriptionGenerator onSelectDescription={handleDescriptionGenerated} />
                </div>
              </TabsContent>

              <TabsContent value="additional">
                <div className="space-y-6">
                  <div>
                    <FormLabel>Tags</FormLabel>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        placeholder="Add a tag (e.g., responsive, fast, premium)"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={addTag}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormDescription className="mt-2">
                      Add relevant tags to help users find your listing (press Enter or click the plus button)
                    </FormDescription>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {form.watch('tags')?.map((tag, index) => (
                        <div
                          key={index}
                          className="flex items-center bg-primary/10 text-primary rounded-full px-3 py-1"
                        >
                          <span className="text-sm">{tag}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 ml-1"
                            onClick={() => removeTag(tag)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <FormLabel>Images</FormLabel>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        placeholder="Add image URL"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addImage();
                          }
                        }}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={addImage}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormDescription className="mt-2">
                      Add image URLs for your listing (press Enter or click the plus button)
                    </FormDescription>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                      {form.watch('images')?.map((imageUrl, index) => (
                        <div
                          key={index}
                          className="relative rounded-md overflow-hidden aspect-video bg-muted"
                        >
                          <img
                            src={imageUrl}
                            alt={`Preview ${index}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'https://placehold.co/400x300/gray/white?text=Invalid+Image';
                            }}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 h-6 w-6 p-0"
                            onClick={() => removeImage(imageUrl)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <div className="mt-6 flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/marketplace')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : 'Create Listing'}
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CreateMarketplaceItemForm;