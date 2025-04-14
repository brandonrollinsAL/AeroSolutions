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
 * WebsiteColorSuggestions Component
 *
 * Allows users to get AI-generated color scheme suggestions for their website
 * based on their business type
 */
export default function WebsiteColorSuggestions() {
  const [businessType, setBusinessType] = useState<string>('');
  const [customBusinessType, setCustomBusinessType] = useState<string>('');
  const [colorSuggestions, setColorSuggestions] = useState<string | null>(null);
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

  // Mutation for getting color suggestions
  const colorSuggestionsMutation = useMutation({
    mutationFn: async () => {
      const type = businessType === 'custom' ? customBusinessType : 
        businessTypes.find(b => b.value === businessType)?.label || businessType;
      
      // Make sure we have a business type
      if (!type) {
        throw new Error('Please select a business type');
      }

      const response = await apiRequest('POST', '/api/mockups/suggest-website-colors', {
        businessType: type
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.colors) {
        setColorSuggestions(data.colors);
        toast({
          title: 'Color suggestions generated',
          description: `Color schemes for ${businessType === 'custom' ? customBusinessType : businessType} websites`,
        });
      } else {
        toast({
          title: 'Error generating color suggestions',
          description: data.message || 'Unknown error occurred',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error generating color suggestions',
        description: error.message || 'Failed to get color suggestions',
        variant: 'destructive',
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setColorSuggestions(null);
    colorSuggestionsMutation.mutate();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Website Color Suggestions</CardTitle>
        <CardDescription>
          Get AI-powered color scheme suggestions for your website based on your business type
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
            disabled={colorSuggestionsMutation.isPending || (!businessType || (businessType === 'custom' && !customBusinessType))}
          >
            {colorSuggestionsMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Suggestions...
              </>
            ) : (
              'Get Color Suggestions'
            )}
          </Button>
        </form>

        {colorSuggestions && (
          <div className="mt-6 p-4 border rounded-md bg-muted/50">
            <h3 className="text-lg font-medium mb-2">Color Scheme Suggestions</h3>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{colorSuggestions}</ReactMarkdown>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between text-xs text-muted-foreground">
        <p>Powered by Elevion AI</p>
        <p>Results may vary based on business type</p>
      </CardFooter>
    </Card>
  );
}