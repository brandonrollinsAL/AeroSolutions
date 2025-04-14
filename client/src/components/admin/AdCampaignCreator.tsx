import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Loader2, LightbulbIcon, UsersIcon, DollarSignIcon, TargetIcon, ChevronRightIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

// Form schema validation
const formSchema = z.object({
  name: z.string().min(3, {
    message: "Campaign name must be at least 3 characters",
  }).max(100, {
    message: "Campaign name must be at most 100 characters",
  }),
  description: z.string().optional(),
  objective: z.string({
    required_error: "Please select a campaign objective",
  }),
  businessType: z.string({
    required_error: "Please select a business type",
  }),
  budget: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Budget must be a positive number",
  }),
  startDate: z.date({
    required_error: "Please select a start date",
  }),
  endDate: z.date().optional(),
});

// Campaign objectives
const campaignObjectives = [
  { value: "awareness", label: "Brand Awareness" },
  { value: "consideration", label: "Consideration" },
  { value: "conversion", label: "Conversion" },
  { value: "lead_generation", label: "Lead Generation" },
  { value: "website_traffic", label: "Website Traffic" },
];

// Business types
const businessTypes = [
  { value: "ecommerce", label: "E-commerce" },
  { value: "service_business", label: "Service Business" },
  { value: "local_business", label: "Local Business" },
  { value: "b2b", label: "B2B" },
  { value: "saas", label: "SaaS" },
  { value: "agency", label: "Agency" },
  { value: "nonprofit", label: "Nonprofit" },
  { value: "education", label: "Education" },
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Finance" },
  { value: "real_estate", label: "Real Estate" },
  { value: "food_beverage", label: "Food & Beverage" },
  { value: "travel", label: "Travel" },
  { value: "entertainment", label: "Entertainment" },
];

const AdCampaignCreator = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [targetAudience, setTargetAudience] = useState<any>(null);
  const [isLoadingAudience, setIsLoadingAudience] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [createdCampaign, setCreatedCampaign] = useState<any>(null);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      objective: "",
      businessType: "",
      budget: "",
      startDate: new Date(),
    },
  });

  // Generate target audience when business type changes
  const onBusinessTypeChange = async (value: string) => {
    form.setValue("businessType", value);
    
    try {
      setIsLoadingAudience(true);
      const response = await apiRequest("POST", "/api/targeted-ads/audience", { 
        businessType: value 
      });
      
      const data = await response.json();
      setTargetAudience(data);
    } catch (error) {
      console.error("Error generating target audience:", error);
      toast({
        title: "Error",
        description: "Failed to generate target audience",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAudience(false);
    }
  };

  // Create campaign with AI
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      const response = await apiRequest("POST", "/api/targeted-ads", {
        ...values,
        budget: parseFloat(values.budget),
        startDate: values.startDate.toISOString(),
        endDate: values.endDate ? values.endDate.toISOString() : undefined,
      });
      
      const data = await response.json();
      setCreatedCampaign(data);
      setCreateStep(2);
      
      toast({
        title: "Campaign Created",
        description: "Your targeted ad campaign has been created successfully!",
      });
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Create Targeted Ad Campaign</h2>
          <p className="text-muted-foreground">
            Use AI to generate targeted ad campaigns for external platforms
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 mb-6">
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
          createStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          1
        </div>
        <div className="h-px w-12 bg-border" />
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
          createStep >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          2
        </div>
      </div>
      
      {createStep === 1 && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>
                Enter the basic information for your targeted ad campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Summer Sale 2025" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Promote our summer sale with targeted ads" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="objective"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Objective</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an objective" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {campaignObjectives.map((objective) => (
                              <SelectItem key={objective.value} value={objective.value}>
                                {objective.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          This helps the AI optimize your ad content
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="businessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Type</FormLabel>
                        <Select onValueChange={onBusinessTypeChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a business type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {businessTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Used to generate targeted audience segments
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Budget ($)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSignIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-8" placeholder="500" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid gap-4 grid-cols-2">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Start Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>End Date (Optional)</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                disabled={(date) => date <= (form.getValues("startDate") || new Date())}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            Leave blank for ongoing campaigns
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full mt-6" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Campaign...
                      </>
                    ) : (
                      <>
                        Create Campaign with AI
                        <LightbulbIcon className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Target Audience</CardTitle>
              <CardDescription>
                AI-generated audience targeting based on your business type
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAudience ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">Generating target audience...</p>
                </div>
              ) : form.getValues("businessType") ? (
                targetAudience ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium flex items-center mb-2">
                        <UsersIcon className="h-4 w-4 mr-2 text-primary" />
                        Demographics
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {targetAudience.demographics && Object.entries(targetAudience.demographics).map(([key, value]: [string, any]) => (
                          <div key={key} className="space-y-1">
                            <p className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                            <p>{Array.isArray(value) ? value.join(', ') : value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-medium flex items-center mb-2">
                        <TargetIcon className="h-4 w-4 mr-2 text-primary" />
                        Interests
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {targetAudience.interests?.map((interest: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-medium flex items-center mb-2">
                        <TargetIcon className="h-4 w-4 mr-2 text-primary" />
                        Behaviors
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {targetAudience.behaviors?.map((behavior: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs">
                            {behavior}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-medium flex items-center mb-2">
                        <TargetIcon className="h-4 w-4 mr-2 text-primary" />
                        Platforms
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {targetAudience.platforms?.map((platform: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs">
                            {platform}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <TargetIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                    <p className="text-muted-foreground">
                      No target audience generated yet.
                    </p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <UsersIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                  <p className="text-muted-foreground">
                    Select a business type to generate a targeted audience profile
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      
      {createStep === 2 && createdCampaign && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="bg-green-50 dark:bg-green-950/20 rounded-t-lg">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center mr-3">
                  <svg 
                    className="h-5 w-5 text-green-600 dark:text-green-400" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-green-700 dark:text-green-400">Campaign Created Successfully!</CardTitle>
                  <CardDescription>
                    Your AI-generated campaign is ready to be reviewed and launched
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Campaign Name</h3>
                    <p className="text-base">{createdCampaign.campaign.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Objective</h3>
                    <p className="text-base capitalize">{createdCampaign.campaign.objective}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Budget</h3>
                    <p className="text-base">${createdCampaign.campaign.budget}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                    <p className="text-base capitalize">{createdCampaign.campaign.status}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Generated Ad Content</h3>
                  {createdCampaign.creatives && createdCampaign.creatives.length > 0 && (
                    <Card className="border-dashed">
                      <CardContent className="p-4">
                        <div className="grid gap-3">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Headline</p>
                            <p className="text-base font-medium">{createdCampaign.creatives[0].headline}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Description</p>
                            <p className="text-base">{createdCampaign.creatives[0].description}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Call to Action</p>
                            <p className="text-base">{createdCampaign.creatives[0].callToAction}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setCreateStep(1)}>
                Create Another Campaign
              </Button>
              <Button>
                View Campaign Details
                <ChevronRightIcon className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdCampaignCreator;