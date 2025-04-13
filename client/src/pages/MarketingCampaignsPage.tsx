import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CheckCircle2, Loader2, Calendar, Mail, Share2, TrendingUp, BarChart3, 
  Target, Users, Clock, AlertCircle, Check
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Checkbox } from '@/components/ui/checkbox';

// Campaign form schema
const campaignFormSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters').max(100),
  industry: z.string().min(2, 'Industry must be at least 2 characters'),
  target: z.string().min(2, 'Target audience must be at least 2 characters'),
  goal: z.string().min(5, 'Campaign goal must be at least 5 characters'),
  season: z.string().min(2, 'Season or time period must be at least 2 characters'),
  tone: z.string().min(2, 'Tone must be at least 2 characters'),
  channelTypes: z.array(z.string()).min(1, 'Select at least one channel type')
});

// Email form schema
const emailFormSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters').max(100),
  campaignName: z.string().min(2, 'Campaign name must be at least 2 characters'),
  target: z.string().min(2, 'Target audience must be at least 2 characters'),
  objective: z.string().min(5, 'Email objective must be at least 5 characters'),
  keyPoints: z.string().min(5, 'Key points must be at least 5 characters'),
  tone: z.string().min(2, 'Tone must be at least 2 characters')
});

// Social post form schema
const socialPostFormSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters').max(100),
  platform: z.string().min(2, 'Platform must be at least 2 characters'),
  campaignName: z.string().min(2, 'Campaign name must be at least 2 characters'),
  objective: z.string().min(5, 'Post objective must be at least 5 characters'),
  tone: z.string().min(2, 'Tone must be at least 2 characters'),
  keyPoints: z.string().min(5, 'Key points must be at least 5 characters'),
  hashtags: z.boolean().default(true),
  includeEmoji: z.boolean().default(true)
});

interface CampaignResponse {
  campaignName: string;
  campaignDescription: string;
  keyMessaging: string[];
  channelContent: Record<string, {
    content: string;
    headline: string;
    callToAction: string;
  }>;
  timeline: string;
  kpis: string[];
  seasonalTips: string[];
}

interface EmailResponse {
  subject: string;
  preheader: string;
  greeting: string;
  bodyContent: string;
  callToAction: string;
  signature: string;
}

interface SocialPostResponse {
  content: string;
  hashtags: string[];
  callToAction: string;
  suggestedImageDescription: string;
}

export default function MarketingCampaignsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('campaign');
  const [isGenerating, setIsGenerating] = useState(false);
  const [campaignResult, setCampaignResult] = useState<CampaignResponse | null>(null);
  const [emailResult, setEmailResult] = useState<EmailResponse | null>(null);
  const [socialPostResult, setSocialPostResult] = useState<SocialPostResponse | null>(null);
  
  // Campaign form
  const campaignForm = useForm<z.infer<typeof campaignFormSchema>>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      businessName: 'Elevion',
      industry: 'Web Development',
      target: 'Small business owners',
      goal: 'Generate leads and increase brand awareness',
      season: 'Spring 2025',
      tone: 'Professional yet approachable',
      channelTypes: ['email', 'social', 'blog']
    }
  });
  
  // Email form
  const emailForm = useForm<z.infer<typeof emailFormSchema>>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      businessName: 'Elevion',
      campaignName: 'Spring Web Development Promotion',
      target: 'Small business owners looking to upgrade their website',
      objective: 'Promote our web development services and generate leads',
      keyPoints: 'Cost-effective, responsive design, SEO optimization, fast delivery',
      tone: 'Professional yet approachable'
    }
  });
  
  // Social post form
  const socialPostForm = useForm<z.infer<typeof socialPostFormSchema>>({
    resolver: zodResolver(socialPostFormSchema),
    defaultValues: {
      businessName: 'Elevion',
      platform: 'Twitter',
      campaignName: 'Spring Web Development Promotion',
      objective: 'Drive traffic to our website and generate interest in our services',
      tone: 'Professional yet conversational',
      keyPoints: 'Modern web design, affordable rates, responsive design, quick turnaround',
      hashtags: true,
      includeEmoji: true
    }
  });
  
  const onSubmitCampaign = async (data: z.infer<typeof campaignFormSchema>) => {
    setIsGenerating(true);
    setCampaignResult(null);
    
    try {
      // Convert keyPoints to array
      const keyPointsArray = data.keyPoints 
        ? (data.keyPoints as unknown as string).split(',').map(item => item.trim()) 
        : [];
      
      const response = await apiRequest('POST', '/api/marketing/generate-campaign', {
        ...data,
        keyPoints: keyPointsArray
      });
      
      if (response.ok) {
        const result = await response.json();
        setCampaignResult(result);
        toast({
          title: "Campaign generated",
          description: "Your marketing campaign has been created successfully.",
          variant: "success",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate campaign');
      }
    } catch (error) {
      toast({
        title: "Generation failed",
        description: error.message || "An error occurred while generating your campaign.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const onSubmitEmail = async (data: z.infer<typeof emailFormSchema>) => {
    setIsGenerating(true);
    setEmailResult(null);
    
    try {
      // Convert keyPoints to array
      const keyPointsArray = data.keyPoints.split(',').map(item => item.trim());
      
      const response = await apiRequest('POST', '/api/marketing/generate-email', {
        ...data,
        keyPoints: keyPointsArray
      });
      
      if (response.ok) {
        const result = await response.json();
        setEmailResult(result);
        toast({
          title: "Email generated",
          description: "Your marketing email has been created successfully.",
          variant: "success",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate email');
      }
    } catch (error) {
      toast({
        title: "Generation failed",
        description: error.message || "An error occurred while generating your email.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const onSubmitSocialPost = async (data: z.infer<typeof socialPostFormSchema>) => {
    setIsGenerating(true);
    setSocialPostResult(null);
    
    try {
      // Convert keyPoints to array
      const keyPointsArray = data.keyPoints.split(',').map(item => item.trim());
      
      const response = await apiRequest('POST', '/api/marketing/generate-social-post', {
        ...data,
        keyPoints: keyPointsArray
      });
      
      if (response.ok) {
        const result = await response.json();
        setSocialPostResult(result);
        toast({
          title: "Social post generated",
          description: "Your social media post has been created successfully.",
          variant: "success",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate social post');
      }
    } catch (error) {
      toast({
        title: "Generation failed",
        description: error.message || "An error occurred while generating your social post.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="container py-8 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Marketing Campaign Generator</h1>
        <p className="text-muted-foreground">
          Create powerful, strategic marketing campaigns powered by AI analytics
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
          <TabsTrigger value="campaign">Campaign</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="social">Social Post</TabsTrigger>
        </TabsList>
        
        {/* Campaign Generator */}
        <TabsContent value="campaign" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Campaign Form */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
                <CardDescription>
                  Enter the details for your marketing campaign
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...campaignForm}>
                  <form onSubmit={campaignForm.handleSubmit(onSubmitCampaign)} className="space-y-4">
                    <FormField
                      control={campaignForm.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your business name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={campaignForm.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry</FormLabel>
                          <FormControl>
                            <Input placeholder="Web Development, Marketing, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={campaignForm.control}
                      name="target"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Audience</FormLabel>
                          <FormControl>
                            <Input placeholder="Small business owners, marketing managers, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={campaignForm.control}
                      name="goal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaign Goal</FormLabel>
                          <FormControl>
                            <Input placeholder="Increase website traffic, generate leads, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={campaignForm.control}
                      name="season"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Season/Time Period</FormLabel>
                          <FormControl>
                            <Input placeholder="Spring 2025, Holiday Season, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={campaignForm.control}
                      name="tone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tone</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a tone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Professional yet approachable">Professional yet approachable</SelectItem>
                              <SelectItem value="Casual and friendly">Casual and friendly</SelectItem>
                              <SelectItem value="Formal and authoritative">Formal and authoritative</SelectItem>
                              <SelectItem value="Inspirational and motivating">Inspirational and motivating</SelectItem>
                              <SelectItem value="Urgent and compelling">Urgent and compelling</SelectItem>
                              <SelectItem value="Educational and informative">Educational and informative</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={campaignForm.control}
                      name="channelTypes"
                      render={() => (
                        <FormItem>
                          <div className="mb-2">
                            <FormLabel>Channel Types</FormLabel>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { id: 'email', label: 'Email Marketing' },
                              { id: 'social', label: 'Social Media' },
                              { id: 'blog', label: 'Blog Content' },
                              { id: 'landing', label: 'Landing Page' },
                              { id: 'ads', label: 'Paid Advertising' },
                              { id: 'video', label: 'Video Content' }
                            ].map((channel) => (
                              <FormField
                                key={channel.id}
                                control={campaignForm.control}
                                name="channelTypes"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={channel.id}
                                      className="flex flex-row items-start space-x-2 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(channel.id)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, channel.id])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== channel.id
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal">
                                        {channel.label}
                                      </FormLabel>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Campaign...
                        </>
                      ) : (
                        <>
                          Generate Campaign
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {/* Campaign Results */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Results</CardTitle>
                <CardDescription>
                  Your AI-generated marketing campaign
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[500px] overflow-y-auto">
                {isGenerating ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Creating your marketing campaign...
                      </p>
                    </div>
                  </div>
                ) : campaignResult ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center">
                        <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
                        {campaignResult.campaignName}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {campaignResult.campaignDescription}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center">
                        <Target className="mr-2 h-4 w-4 text-primary" />
                        Key Messaging Points
                      </h4>
                      <ul className="space-y-2">
                        {campaignResult.keyMessaging.map((message, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                            <span className="text-sm">{message}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center">
                        <BarChart3 className="mr-2 h-4 w-4 text-primary" />
                        Channel Content
                      </h4>
                      <div className="space-y-4">
                        {Object.entries(campaignResult.channelContent).map(([channel, content]) => (
                          <div key={channel} className="border rounded-md p-3">
                            <h5 className="font-medium text-sm capitalize mb-2">{channel}</h5>
                            <div className="space-y-2">
                              <p className="text-sm font-medium">{content.headline}</p>
                              <p className="text-sm text-muted-foreground">{content.content}</p>
                              <p className="text-sm text-primary">{content.callToAction}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-primary" />
                        Timeline
                      </h4>
                      <p className="text-sm">{campaignResult.timeline}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center">
                        <TrendingUp className="mr-2 h-4 w-4 text-primary" />
                        Key Performance Indicators
                      </h4>
                      <ul className="space-y-2">
                        {campaignResult.kpis.map((kpi, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                            <span className="text-sm">{kpi}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {campaignResult.seasonalTips && campaignResult.seasonalTips.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-primary" />
                          Seasonal Tips
                        </h4>
                        <ul className="space-y-2">
                          {campaignResult.seasonalTips.map((tip, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Check className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                              <span className="text-sm">{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <h3 className="mt-4 text-lg font-medium">No Campaign Generated</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Fill out the form and click "Generate Campaign" to create a marketing campaign.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Email Generator */}
        <TabsContent value="email" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Email Form */}
            <Card>
              <CardHeader>
                <CardTitle>Email Details</CardTitle>
                <CardDescription>
                  Create a marketing email for your campaign
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-4">
                    <FormField
                      control={emailForm.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your business name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={emailForm.control}
                      name="campaignName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaign Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Spring Promotion, Holiday Sale, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={emailForm.control}
                      name="target"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Audience</FormLabel>
                          <FormControl>
                            <Input placeholder="Small business owners, marketing managers, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={emailForm.control}
                      name="objective"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Objective</FormLabel>
                          <FormControl>
                            <Input placeholder="Promote service, announce feature, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={emailForm.control}
                      name="keyPoints"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Key Points (comma separated)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Point 1, Point 2, Point 3"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={emailForm.control}
                      name="tone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tone</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a tone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Professional yet approachable">Professional yet approachable</SelectItem>
                              <SelectItem value="Casual and friendly">Casual and friendly</SelectItem>
                              <SelectItem value="Formal and authoritative">Formal and authoritative</SelectItem>
                              <SelectItem value="Inspirational and motivating">Inspirational and motivating</SelectItem>
                              <SelectItem value="Urgent and compelling">Urgent and compelling</SelectItem>
                              <SelectItem value="Educational and informative">Educational and informative</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Email...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Generate Email
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {/* Email Results */}
            <Card>
              <CardHeader>
                <CardTitle>Email Preview</CardTitle>
                <CardDescription>
                  Your AI-generated marketing email
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[500px] overflow-y-auto">
                {isGenerating ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Creating your marketing email...
                      </p>
                    </div>
                  </div>
                ) : emailResult ? (
                  <div className="space-y-4 border rounded-md p-6 bg-card">
                    <div className="border-b pb-2">
                      <h3 className="font-semibold">Subject: {emailResult.subject}</h3>
                      <p className="text-xs text-muted-foreground">Preheader: {emailResult.preheader}</p>
                    </div>
                    
                    <div className="space-y-4">
                      <p>{emailResult.greeting},</p>
                      
                      <div className="whitespace-pre-line">
                        {emailResult.bodyContent}
                      </div>
                      
                      <div className="my-4">
                        <Button>
                          {emailResult.callToAction}
                        </Button>
                      </div>
                      
                      <div className="border-t pt-4 text-sm">
                        {emailResult.signature}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <Mail className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <h3 className="mt-4 text-lg font-medium">No Email Generated</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Fill out the form and click "Generate Email" to create an email.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Social Post Generator */}
        <TabsContent value="social" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Social Post Form */}
            <Card>
              <CardHeader>
                <CardTitle>Social Post Details</CardTitle>
                <CardDescription>
                  Create a social media post for your campaign
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...socialPostForm}>
                  <form onSubmit={socialPostForm.handleSubmit(onSubmitSocialPost)} className="space-y-4">
                    <FormField
                      control={socialPostForm.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your business name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={socialPostForm.control}
                      name="platform"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Platform</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a platform" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Twitter">Twitter</SelectItem>
                              <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                              <SelectItem value="Facebook">Facebook</SelectItem>
                              <SelectItem value="Instagram">Instagram</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={socialPostForm.control}
                      name="campaignName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaign Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Spring Promotion, Holiday Sale, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={socialPostForm.control}
                      name="objective"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Post Objective</FormLabel>
                          <FormControl>
                            <Input placeholder="Drive traffic, increase engagement, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={socialPostForm.control}
                      name="tone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tone</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a tone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Professional yet conversational">Professional yet conversational</SelectItem>
                              <SelectItem value="Casual and friendly">Casual and friendly</SelectItem>
                              <SelectItem value="Formal and authoritative">Formal and authoritative</SelectItem>
                              <SelectItem value="Inspirational and motivating">Inspirational and motivating</SelectItem>
                              <SelectItem value="Urgent and compelling">Urgent and compelling</SelectItem>
                              <SelectItem value="Educational and informative">Educational and informative</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={socialPostForm.control}
                      name="keyPoints"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Key Points (comma separated)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Point 1, Point 2, Point 3"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={socialPostForm.control}
                        name="hashtags"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Include Hashtags</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={socialPostForm.control}
                        name="includeEmoji"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Include Emoji</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Post...
                        </>
                      ) : (
                        <>
                          <Share2 className="mr-2 h-4 w-4" />
                          Generate Post
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {/* Social Post Results */}
            <Card>
              <CardHeader>
                <CardTitle>Social Post Preview</CardTitle>
                <CardDescription>
                  Your AI-generated social media post
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[500px] overflow-y-auto">
                {isGenerating ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Creating your social media post...
                      </p>
                    </div>
                  </div>
                ) : socialPostResult ? (
                  <div className="space-y-6">
                    <div className="border rounded-lg p-4 bg-card">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{socialPostForm.getValues().businessName}</p>
                          <p className="text-xs text-muted-foreground flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Just now
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-sm whitespace-pre-line mb-3">
                        {socialPostResult.content}
                      </p>
                      
                      {socialPostResult.hashtags && socialPostResult.hashtags.length > 0 && (
                        <p className="text-sm text-primary font-medium mb-3">
                          {socialPostResult.hashtags.join(' ')}
                        </p>
                      )}
                      
                      <div className="rounded-md border border-dashed h-40 flex items-center justify-center bg-muted/50 mb-3">
                        <div className="text-center px-4">
                          <p className="text-xs text-muted-foreground">
                            {socialPostResult.suggestedImageDescription}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>0 Likes</span>
                        <span>0 Comments</span>
                        <span>0 Shares</span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Call to Action</h4>
                      <p className="text-sm">{socialPostResult.callToAction}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Suggested Image</h4>
                      <p className="text-sm">{socialPostResult.suggestedImageDescription}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <Share2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <h3 className="mt-4 text-lg font-medium">No Post Generated</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Fill out the form and click "Generate Post" to create a social media post.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}