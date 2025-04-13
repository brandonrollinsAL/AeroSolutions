import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Bookmark, Share2, ThumbsUp, RefreshCw } from 'lucide-react';

interface BusinessContentProps {
  title?: string;
  showRefreshButton?: boolean;
}

const BusinessContentFeed = ({ title = "Business Insights", showRefreshButton = true }: BusinessContentProps) => {
  const [businessContent, setBusinessContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [contentList, setContentList] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchBusinessContent = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('GET', '/api/content/fetch-business');
      const data = await response.json();
      
      if (data.success) {
        setBusinessContent(data.businessContent);
        
        // Parse the numbered list into array items
        const contentItems = data.businessContent.split(/\d+\.\s+/).filter(Boolean);
        setContentList(contentItems);
      } else {
        toast({
          title: "Error fetching content",
          description: data.error || "Unable to fetch business content",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching business content:', error);
      toast({
        title: "Connection Error",
        description: "Unable to fetch business content. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessContent();
  }, []);

  const handleRefresh = () => {
    fetchBusinessContent();
  };

  const handleAction = (action: 'like' | 'save' | 'share', contentIndex: number) => {
    // In a production app, this would make an API call to record the action
    toast({
      title: `Content ${action === 'like' ? 'liked' : action === 'save' ? 'saved' : 'shared'}`,
      description: `You ${action === 'like' ? 'liked' : action === 'save' ? 'saved' : 'shared'} "${contentList[contentIndex].split('**')[1] || 'this content'}"`,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-slate-800">{title}</h2>
        {showRefreshButton && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4">
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {contentList.map((content, index) => {
            // Extract title from markdown format if present
            const titleMatch = content.match(/\*\*(.*?)\*\*/);
            const title = titleMatch ? titleMatch[1] : `Business Content ${index + 1}`;
            
            // Clean up content by removing markdown formatting
            const cleanContent = content.replace(/\*\*(.*?)\*\*/g, '$1');
            
            return (
              <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-lg text-slate-800 mb-2">{title}</h3>
                <p className="text-slate-600 mb-3">{cleanContent}</p>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleAction('like', index)}
                      className="flex items-center gap-1"
                    >
                      <ThumbsUp className="h-4 w-4" /> Like
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleAction('save', index)}
                      className="flex items-center gap-1"
                    >
                      <Bookmark className="h-4 w-4" /> Save
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleAction('share', index)}
                      className="flex items-center gap-1"
                    >
                      <Share2 className="h-4 w-4" /> Share
                    </Button>
                  </div>
                  <Badge variant="outline">{`Content ${index + 1}`}</Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BusinessContentFeed;