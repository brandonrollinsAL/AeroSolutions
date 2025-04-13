import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, Copy, Check, RefreshCw } from 'lucide-react';

interface AdSuggestionResponse {
  headline: string;
  subheadline: string;
  body: string;
  callToAction: string;
  targetKeywords: string[];
  suggestedImageConcept: string;
  toneAndStyle: string;
}

const MarketplaceAdGenerator: React.FC = () => {
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    targetAudience: ''
  });
  const [adSuggestion, setAdSuggestion] = useState<AdSuggestionResponse | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Mutation for generating ad suggestions
  const adMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/marketplace/suggest-ad', formData);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        setAdSuggestion(data.data);
        toast({
          title: 'Ad Generated',
          description: data.cached ? 'Retrieved from cache' : 'Fresh AI-generated content',
        });
      } else if (data.fallback) {
        setAdSuggestion(data.data);
        toast({
          title: 'Basic Ad Template Generated',
          description: 'Using a fallback template as AI generation failed',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Failed to Generate Ad',
          description: data.error || 'Unknown error occurred',
          variant: 'destructive'
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to generate ad content. Please try again.',
        variant: 'destructive'
      });
      console.error('Ad generation error:', error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName) {
      toast({
        title: 'Missing Information',
        description: 'Please enter a business name',
        variant: 'destructive'
      });
      return;
    }
    adMutation.mutate();
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({
      title: 'Copied!',
      description: `${field} copied to clipboard`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Marketplace Business Ad Generator</CardTitle>
          <CardDescription>
            Generate professional ad content for your marketplace listing using AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name <span className="text-red-500">*</span></Label>
              <Input
                id="businessName"
                name="businessName"
                placeholder="e.g., Sunshine Bakery"
                value={formData.businessName}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type</Label>
              <Input
                id="businessType"
                name="businessType"
                placeholder="e.g., Restaurant, Retail, Consulting"
                value={formData.businessType}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Textarea
                id="targetAudience"
                name="targetAudience"
                placeholder="e.g., Young professionals, parents, local community"
                value={formData.targetAudience}
                onChange={handleInputChange}
                className="min-h-[80px]"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={adMutation.isPending || !formData.businessName.trim()}
            >
              {adMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Ad Content'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {adSuggestion && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Generated Ad Content</CardTitle>
              <CardDescription>
                Use this content for your premium marketplace listing
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => adMutation.mutate()}
              disabled={adMutation.isPending}
              title="Generate new version"
            >
              {adMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Ad Content</TabsTrigger>
                <TabsTrigger value="details">Ad Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Headline</Label>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(adSuggestion.headline, 'Headline')}
                    >
                      {copiedField === 'Headline' ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="rounded-md bg-slate-50 p-3 font-semibold text-lg">
                    {adSuggestion.headline}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Subheadline</Label>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(adSuggestion.subheadline, 'Subheadline')}
                    >
                      {copiedField === 'Subheadline' ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="rounded-md bg-slate-50 p-3 text-slate-600">
                    {adSuggestion.subheadline}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Body</Label>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(adSuggestion.body, 'Body')}
                    >
                      {copiedField === 'Body' ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="rounded-md bg-slate-50 p-3 text-slate-700 whitespace-pre-line">
                    {adSuggestion.body}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Call to Action</Label>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(adSuggestion.callToAction, 'Call to Action')}
                    >
                      {copiedField === 'Call to Action' ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="rounded-md bg-primary text-white p-3 font-medium text-center">
                    {adSuggestion.callToAction}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="details" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Target Keywords</Label>
                  <div className="flex flex-wrap gap-2">
                    {adSuggestion.targetKeywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  <Label>Suggested Image Concept</Label>
                  <div className="rounded-md bg-slate-50 p-3 text-slate-700">
                    {adSuggestion.suggestedImageConcept}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Tone and Style</Label>
                  <div className="rounded-md bg-slate-50 p-3 text-slate-700">
                    {adSuggestion.toneAndStyle}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => copyToClipboard(
                `${adSuggestion.headline}\n\n${adSuggestion.subheadline}\n\n${adSuggestion.body}\n\n${adSuggestion.callToAction}`,
                'Full Ad'
              )}
            >
              {copiedField === 'Full Ad' ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Full Ad
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default MarketplaceAdGenerator;