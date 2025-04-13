import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Clock, Image as ImageIcon } from 'lucide-react';

/**
 * WebsiteImageSuggestions Component
 * 
 * Uses AI to suggest appropriate images for a client's website based on their business type
 */
export default function WebsiteImageSuggestions() {
  const [businessType, setBusinessType] = useState('');
  const [submittedBusinessType, setSubmittedBusinessType] = useState('');
  const { toast } = useToast();

  // Query for image suggestions
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['/api/mockups/suggest-images', submittedBusinessType],
    queryFn: () => {
      if (!submittedBusinessType) return Promise.resolve(null);
      return apiRequest('POST', '/api/mockups/suggest-images', { businessType: submittedBusinessType })
        .then(res => res.json());
    },
    enabled: !!submittedBusinessType,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessType.trim()) {
      toast({
        title: "Business type required",
        description: "Please enter a business type to get image suggestions",
        variant: "destructive",
      });
      return;
    }
    setSubmittedBusinessType(businessType.trim());
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Get AI-Suggested Images for Your Website</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enter your business type to receive professional image suggestions tailored to your industry.
                Our AI will recommend images that resonate with your target audience and enhance your brand identity.
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <Input
                placeholder="e.g., Cafe, Real Estate Agency, Law Firm, Fitness Studio"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Generating...' : 'Get Image Suggestions'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground animate-pulse" />
            <p className="text-sm text-muted-foreground">
              Generating image suggestions for {submittedBusinessType}...
            </p>
          </div>
          <Skeleton className="h-[300px] w-full" />
        </div>
      )}

      {isError && (
        <div className="p-4 border border-destructive/50 rounded-md bg-destructive/10">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <p className="font-medium">Error generating image suggestions</p>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'An unknown error occurred. Please try again.'}
          </p>
        </div>
      )}

      {!isLoading && !isError && data && data.images && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">
                Image Suggestions for {submittedBusinessType}
              </h3>
            </div>
            <div className="text-xs text-muted-foreground">
              {data.source === 'cache' ? 'Cached result' : 'Fresh suggestions'}
            </div>
          </div>

          <div className="prose prose-slate max-w-none dark:prose-invert">
            <div dangerouslySetInnerHTML={{ __html: formatMarkdown(data.images) }} />
          </div>

          <div className="bg-accent/40 p-4 rounded-md mt-6">
            <h4 className="text-sm font-medium mb-2">Implementation Tips:</h4>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Use high-quality, authentic images rather than generic stock photos when possible</li>
              <li>Ensure images are optimized for fast loading (compress without losing quality)</li>
              <li>Add alt text to all images for better accessibility and SEO</li>
              <li>Consider using a consistent style and color treatment across all images</li>
              <li>Proper licensing is crucial - make sure you have rights to use any images</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Simple function to format markdown for dangerouslySetInnerHTML
 * In a production app, use a proper markdown parser
 */
function formatMarkdown(markdown: string): string {
  return markdown
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium mt-5 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
    .replace(/^([0-9]+)\. (.*$)/gim, '<li class="ml-4">$2</li>')
    .replace(/\n/gim, '<br>')
    .replace(/<\/li><br>/gim, '</li>')
    .replace(/<\/h1><br>/gim, '</h1>')
    .replace(/<\/h2><br>/gim, '</h2>')
    .replace(/<\/h3><br>/gim, '</h3>')
    .replace(/<\/strong><br>/gim, '</strong><br>')
    .replace(/<br><li/gim, '<li');
}