import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Clipboard, AlertCircle, RefreshCw, Copy } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

interface WebsiteCtaSuggestionsProps {
  defaultBusinessType?: string;
}

const WebsiteCtaSuggestions: React.FC<WebsiteCtaSuggestionsProps> = ({ defaultBusinessType = '' }) => {
  const [businessType, setBusinessType] = useState<string>(defaultBusinessType);
  const [searchQuery, setSearchQuery] = useState<string>(defaultBusinessType);
  const { toast } = useToast();

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['cta-suggestions', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) {
        throw new Error('Please enter a business type');
      }

      const response = await apiRequest('POST', '/api/mockups/suggest-cta', { businessType: searchQuery });
      return response.json();
    },
    enabled: !!searchQuery.trim(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessType.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a business type',
        variant: 'destructive',
      });
      return;
    }
    setSearchQuery(businessType);
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: 'Copied!',
          description: 'CTA suggestions copied to clipboard.',
        });
      },
      () => {
        toast({
          title: 'Failed to copy',
          description: 'Could not copy text to clipboard.',
          variant: 'destructive',
        });
      }
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clipboard className="h-5 w-5 text-electric-cyan" />
          CTA Suggestions Generator
        </CardTitle>
        <CardDescription>
          Generate effective call-to-action (CTA) suggestions based on business type
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="flex flex-col space-y-4 mb-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="md:col-span-3">
              <Label htmlFor="businessType">Business Type</Label>
              <Input
                id="businessType"
                placeholder="e.g., Restaurant, Law Firm, E-commerce..."
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading || isRefetching || !businessType.trim()}
              >
                {isLoading || isRefetching ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate CTAs'
                )}
              </Button>
            </div>
          </div>
        </form>

        {isError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'Failed to generate CTA suggestions'}
            </AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {!isLoading && data && data.ctas && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-medium">CTA Suggestions for {searchQuery}</h3>
                <p className="text-sm text-muted-foreground">
                  {data.source === 'cache' ? 'Retrieved from cache' : 'Freshly generated'}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleCopyToClipboard(data.ctas)}
                className="flex items-center gap-1"
              >
                <Copy className="h-4 w-4" />
                Copy All
              </Button>
            </div>
            
            <div className="prose prose-slate dark:prose-invert max-w-full">
              <ReactMarkdown>{data.ctas}</ReactMarkdown>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t px-6 py-4">
        <p className="text-sm text-muted-foreground">
          Powered by Grok AI
        </p>
        {data && (
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default WebsiteCtaSuggestions;