import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, MessageSquareText, BrainCircuit } from 'lucide-react';

// Define the form schema
const feedbackSchema = z.object({
  message: z.string().min(10, {
    message: 'Feedback must be at least 10 characters.',
  }),
  source: z.string().default('website'),
  category: z.string().optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

// Feedback categories
const feedbackCategories = [
  { value: 'general', label: 'General Feedback' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'bug_report', label: 'Bug Report' },
  { value: 'usability', label: 'Usability' },
  { value: 'performance', label: 'Performance' },
  { value: 'other', label: 'Other' },
];

export function FeedbackForm() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [analyzingFeedback, setAnalyzingFeedback] = useState(false);
  const { toast } = useToast();

  // Initialize form
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      message: '',
      source: 'website',
      category: 'general',
      rating: 5,
    },
  });

  // Handle form submission
  const onSubmit = async (data: FeedbackFormValues) => {
    setLoading(true);
    
    try {
      // Submit feedback to API
      const response = await apiRequest('POST', '/api/feedback', data);
      
      if (response.ok) {
        const result = await response.json();
        
        toast({
          title: 'Thank you for your feedback!',
          description: 'Your input helps us improve our services.',
        });
        
        // Reset form
        form.reset();
        
        // Auto-analyze the feedback
        setAnalyzingFeedback(true);
        const feedbackId = result.data?.id;
        
        if (feedbackId) {
          analyzeFeedback(feedbackId);
        }
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit feedback');
      }
    } catch (error: any) {
      toast({
        title: 'Error submitting feedback',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Analyze feedback with xAI
  const analyzeFeedback = async (feedbackId: number) => {
    try {
      const response = await apiRequest('POST', '/api/feedback/analyze-feedback', {
        feedbackId,
      });
      
      if (response.ok) {
        const analysisResults = await response.json();
        setAnalysis(analysisResults);
      } else {
        throw new Error('Failed to analyze feedback');
      }
    } catch (error: any) {
      toast({
        title: 'Analysis failed',
        description: error.message || 'Could not analyze your feedback',
        variant: 'destructive',
      });
    } finally {
      setAnalyzingFeedback(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquareText className="h-5 w-5" />
          Share Your Feedback
        </CardTitle>
        <CardDescription>
          We value your input! Tell us what you think about our platform.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Feedback</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your thoughts, suggestions, or report any issues..."
                      className="min-h-[120px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Be as specific as possible to help us understand your feedback better.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        {feedbackCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
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
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating (1-5)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      5 = Excellent, 1 = Poor
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Feedback
            </Button>
          </form>
        </Form>
      </CardContent>

      {analyzingFeedback && !analysis && (
        <CardFooter className="flex flex-col space-y-2 border-t pt-4">
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Analyzing your feedback with xAI...</span>
          </div>
        </CardFooter>
      )}

      {analysis && (
        <CardFooter className="flex flex-col space-y-4 border-t pt-4">
          <div className="flex items-center space-x-2">
            <BrainCircuit className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">AI Feedback Analysis</h3>
          </div>
          
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium">Sentiment:</p>
              <div className="flex gap-2 mt-1">
                <div className="flex-1 bg-green-100 dark:bg-green-950 rounded px-2 py-1">
                  Positive: {analysis.sentiment?.positive || 0}%
                </div>
                <div className="flex-1 bg-red-100 dark:bg-red-950 rounded px-2 py-1">
                  Negative: {analysis.sentiment?.negative || 0}%
                </div>
                <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded px-2 py-1">
                  Neutral: {analysis.sentiment?.neutral || 0}%
                </div>
              </div>
            </div>
            
            {analysis.key_themes && (
              <div>
                <p className="font-medium">Key Themes:</p>
                <ul className="list-disc list-inside mt-1">
                  {analysis.key_themes.map((theme: string, i: number) => (
                    <li key={i}>{theme}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysis.recommendations && (
              <div>
                <p className="font-medium">Recommendations:</p>
                <ul className="list-disc list-inside mt-1">
                  {analysis.recommendations.map((rec: string, i: number) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysis.summary && (
              <div>
                <p className="font-medium">Summary:</p>
                <p className="mt-1 text-muted-foreground">{analysis.summary}</p>
              </div>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

export default FeedbackForm;