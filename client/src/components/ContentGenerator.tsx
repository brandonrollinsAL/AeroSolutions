import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2, Copy, Check, Download, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Define form schema
const contentFormSchema = z.object({
  contentType: z.enum(['blog_post', 'industry_insight', 'email_template']),
  topic: z.string().min(3, 'Topic must be at least 3 characters'),
  industry: z.string().min(2, 'Industry must be at least 2 characters'),
  targetAudience: z.string().optional(),
  tone: z.enum(['professional', 'conversational', 'technical', 'inspirational']),
  keyPoints: z.string().optional(),
  wordCount: z.string(),
  includeCallToAction: z.boolean().optional(),
});

type ContentFormValues = z.infer<typeof contentFormSchema>;

// Word count options
const wordCountOptions = [
  { value: '300', label: 'Short (~300 words)' },
  { value: '600', label: 'Medium (~600 words)' },
  { value: '1000', label: 'Long (~1000 words)' },
  { value: '1500', label: 'Extended (~1500 words)' },
];

// Tone options
const toneOptions = [
  { value: 'professional', label: 'Professional' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'technical', label: 'Technical' },
  { value: 'inspirational', label: 'Inspirational' },
];

// Content type options
const contentTypeOptions = [
  { 
    value: 'blog_post', 
    label: 'Blog Post',
    description: 'Informative article for your website blog' 
  },
  { 
    value: 'industry_insight', 
    label: 'Industry Insight',
    description: 'In-depth analysis of trends and developments' 
  },
  { 
    value: 'email_template', 
    label: 'Email Template',
    description: 'Professional email for marketing or communication' 
  },
];

const ContentGenerator: React.FC = () => {
  const { toast } = useToast();
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  // Form setup
  const form = useForm<ContentFormValues>({
    resolver: zodResolver(contentFormSchema),
    defaultValues: {
      contentType: 'blog_post',
      topic: '',
      industry: '',
      targetAudience: '',
      tone: 'professional',
      keyPoints: '',
      wordCount: '600',
      includeCallToAction: true,
    },
  });

  // Content generation mutation
  const generateMutation = useMutation({
    mutationFn: async (values: ContentFormValues) => {
      const response = await apiRequest('POST', '/api/content/generate', values);
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setGeneratedContent(data.content);
        toast({
          title: 'Content generated successfully',
          description: `Your ${form.getValues().contentType.replace('_', ' ')} has been created.`,
        });
      } else {
        toast({
          title: 'Content generation failed',
          description: data.message || 'There was an error generating content.',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate content. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Save content mutation
  const saveMutation = useMutation({
    mutationFn: async (values: { content: string; title: string; type: string }) => {
      const response = await apiRequest('POST', '/api/content/save', values);
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Content saved successfully',
          description: 'Your content has been saved to the Content Hub.',
        });
        // Invalidate content queries to refresh the list
        queryClient.invalidateQueries({ queryKey: ['/api/content/list'] });
      } else {
        toast({
          title: 'Failed to save content',
          description: data.message || 'There was an error saving your content.',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save content. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: ContentFormValues) => {
    generateMutation.mutate(values);
  };

  // Copy to clipboard function
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent).then(
      () => {
        setIsCopied(true);
        toast({
          title: 'Copied to clipboard',
          description: 'Content has been copied to your clipboard.',
        });
        setTimeout(() => setIsCopied(false), 2000);
      },
      (err) => {
        toast({
          title: 'Copy failed',
          description: 'Failed to copy content. Please try again.',
          variant: 'destructive',
        });
      }
    );
  };

  // Download content function
  const downloadContent = () => {
    const element = document.createElement('a');
    const title = form.getValues().topic.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const contentType = form.getValues().contentType.replace('_', '-');
    const file = new Blob([generatedContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${contentType}-${title}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Save content function
  const saveContent = () => {
    saveMutation.mutate({
      content: generatedContent,
      title: form.getValues().topic,
      type: form.getValues().contentType,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Content Generator</CardTitle>
          <CardDescription>
            Generate high-quality content optimized for your target audience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="contentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contentTypeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex flex-col">
                              <span>{option.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {option.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic/Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Benefits of Responsive Web Design" {...field} />
                    </FormControl>
                    <FormDescription>
                      Clear and specific topics produce better results
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. E-commerce, Healthcare" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetAudience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Audience (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Small business owners" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select tone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {toneOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="wordCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Length</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select length" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {wordCountOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="keyPoints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Points (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter specific points to include, one per line"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Add key points you want covered in the content
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="includeCallToAction"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Include Call to Action</FormLabel>
                      <FormDescription>
                        Add a relevant call to action at the end of the content
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Content'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="lg:max-h-[800px] flex flex-col">
        <CardHeader>
          <CardTitle>Generated Content</CardTitle>
          <CardDescription>
            Generated content with Elevion branding (Poppins headings, Lato body text)
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-auto">
          {generateMutation.isPending ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
              <p className="text-muted-foreground text-center">
                Generating your content...<br />
                This may take a moment.
              </p>
            </div>
          ) : generatedContent ? (
            <div 
              className="prose prose-blue max-w-none"
              dangerouslySetInnerHTML={{ __html: generatedContent }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <p className="text-muted-foreground mb-4">
                Complete the form and click "Generate Content" to create your content.
              </p>
              <p className="text-xs text-muted-foreground">
                Content will be styled with Elevion branding: Poppins for headings and Lato for body text.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t bg-muted/50 p-3">
          <div className="flex flex-wrap gap-2 w-full">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyToClipboard} 
              disabled={!generatedContent || isCopied}
              className="flex-1"
            >
              {isCopied ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadContent} 
              disabled={!generatedContent}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={saveContent} 
              disabled={!generatedContent || saveMutation.isPending}
              className="flex-1"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Save to Content Hub'
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ContentGenerator;