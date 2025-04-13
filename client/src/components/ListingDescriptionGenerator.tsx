import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BrainCircuit, Copy, RefreshCw } from 'lucide-react';

interface ListingDescriptionGeneratorProps {
  onSelectDescription?: (description: string) => void;
}

const ListingDescriptionGenerator: React.FC<ListingDescriptionGeneratorProps> = ({ onSelectDescription }) => {
  const [serviceName, setServiceName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const generateDescription = async () => {
    if (!serviceName.trim()) {
      toast({
        title: "Service name required",
        description: "Please enter a service name to generate a description",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/marketplace/suggest-listing', {
        serviceName: serviceName.trim()
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.description) {
          setDescription(data.description);
          if (data.fallback) {
            toast({
              title: "Using fallback description",
              description: "We generated a basic description. Try again later for more customized content.",
              variant: "default"
            });
          } else if (data.cached) {
            toast({
              title: "Description retrieved",
              description: "This description was retrieved from cache for faster response.",
              variant: "default"
            });
          } else {
            toast({
              title: "Description generated",
              description: "AI-powered description has been created for your listing.",
              variant: "default"
            });
          }
        } else {
          toast({
            title: "Generation error",
            description: data.error || "Failed to generate description. Please try again.",
            variant: "destructive"
          });
        }
      } else {
        throw new Error('Failed to generate description');
      }
    } catch (error) {
      console.error('Error generating description:', error);
      toast({
        title: "Generation failed",
        description: "There was an error generating your description. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (description) {
      navigator.clipboard.writeText(description);
      setIsCopied(true);
      toast({
        title: "Copied!",
        description: "Description copied to clipboard",
      });
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleUseDescription = () => {
    if (description && onSelectDescription) {
      onSelectDescription(description);
      toast({
        title: "Description selected",
        description: "The generated description has been added to your listing",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-primary" />
          <CardTitle>AI Listing Description Generator</CardTitle>
        </div>
        <CardDescription>
          Enter your service name to generate a professional description for your marketplace listing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter service name (e.g., 'Responsive Website Design')"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={generateDescription} 
            disabled={isLoading || !serviceName.trim()}
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : 'Generate'}
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[85%]" />
            <Skeleton className="h-4 w-[90%]" />
          </div>
        ) : description ? (
          <div className="relative">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[200px] resize-y"
            />
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-2 right-2"
              onClick={copyToClipboard}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
            Generated description will appear here. The AI-powered description generator creates professional and compelling copy for your marketplace listings.
          </div>
        )}
      </CardContent>
      {description && onSelectDescription && (
        <CardFooter>
          <Button 
            onClick={handleUseDescription} 
            className="ml-auto"
          >
            Use This Description
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default ListingDescriptionGenerator;