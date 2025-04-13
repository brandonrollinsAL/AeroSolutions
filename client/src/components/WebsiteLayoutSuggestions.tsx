import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { Loader2 } from 'lucide-react';

/**
 * WebsiteLayoutSuggestions Component
 *
 * Allows users to get AI-generated layout recommendations for their website
 * based on their business type
 */
export default function WebsiteLayoutSuggestions() {
  const [businessType, setBusinessType] = useState<string>('');
  const [customBusinessType, setCustomBusinessType] = useState<string>('');
  const [layoutSuggestions, setLayoutSuggestions] = useState<string | null>(null);
  const { toast } = useToast();

  // Common business types
  const businessTypes = [
    { value: 'retail', label: 'Retail Store' },
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'professional_service', label: 'Professional Service' },
    { value: 'healthcare', label: 'Healthcare Provider' },
    { value: 'education', label: 'Education' },
    { value: 'technology', label: 'Technology Company' },
    { value: 'financial', label: 'Financial Service' },
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'creative', label: 'Creative Agency' },
    { value: 'fitness', label: 'Fitness & Wellness' },
    { value: 'travel', label: 'Travel & Tourism' },
    { value: 'non_profit', label: 'Non-Profit Organization' },
    { value: 'custom', label: 'Other (specify)' }
  ];

  // Mutation for getting layout suggestions
  const layoutSuggestionsMutation = useMutation({
    mutationFn: async () => {
      const type = businessType === 'custom' ? customBusinessType : 
        businessTypes.find(b => b.value === businessType)?.label || businessType;
      
      // Make sure we have a business type
      if (!type) {
        throw new Error('Please select a business type');
      }

      const response = await apiRequest('POST', '/api/mockups/suggest-website-layout', {
        businessType: type
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.layout) {
        setLayoutSuggestions(data.layout);
        toast({
          title: 'Layout suggestions generated',
          description: `Layout recommendations for ${businessType === 'custom' ? customBusinessType : businessType} websites`,
        });
      } else {
        toast({
          title: 'Error generating layout suggestions',
          description: data.message || 'Unknown error occurred',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error generating layout suggestions',
        description: error.message || 'Failed to get layout suggestions',
        variant: 'destructive',
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLayoutSuggestions(null);
    layoutSuggestionsMutation.mutate();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Website Layout Recommendations</CardTitle>
        <CardDescription>
          Get AI-powered layout suggestions for your website based on your business type
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessType">Business Type</Label>
            <Select 
              value={businessType} 
              onValueChange={setBusinessType}
            >
              <SelectTrigger id="businessType">
                <SelectValue placeholder="Select your business type" />
              </SelectTrigger>
              <SelectContent>
                {businessTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {businessType === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="customBusinessType">Specify Your Business Type</Label>
              <Input
                id="customBusinessType"
                placeholder="e.g., Pet Grooming, Online Tutoring, etc."
                value={customBusinessType}
                onChange={(e) => setCustomBusinessType(e.target.value)}
                required={businessType === 'custom'}
              />
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={layoutSuggestionsMutation.isPending || (!businessType || (businessType === 'custom' && !customBusinessType))}
          >
            {layoutSuggestionsMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Layout Recommendations...
              </>
            ) : (
              'Get Layout Recommendations'
            )}
          </Button>
        </form>

        {layoutSuggestions && (
          <div className="mt-6 p-4 border rounded-md bg-muted/50">
            <h3 className="text-lg font-medium mb-2">Website Layout Recommendations</h3>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{layoutSuggestions}</ReactMarkdown>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between text-xs text-muted-foreground">
        <p>Powered by xAI Grok</p>
        <p>Results may vary based on business type</p>
      </CardFooter>
    </Card>
  );
}