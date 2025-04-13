import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, RefreshCw, Share2 } from 'lucide-react';

interface SocialPostSuggestionsProps {
  userId: string;
  businessType?: string;
}

export function SocialPostSuggestions({ userId, businessType }: SocialPostSuggestionsProps) {
  const { toast } = useToast();
  const [selectedPost, setSelectedPost] = useState<string | null>(null);

  // Fetch social media post suggestions from the API
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['/api/marketplace/suggest-social-posts', userId],
    enabled: !!userId,
  });

  // Parse posts into an array
  const parsePosts = (postsText: string): string[] => {
    if (!postsText) return [];
    // Split by double newlines or numbered list entries
    return postsText.split(/\n\n|\d+\.\s+/).filter(post => post.trim().length > 0);
  };

  const socialPosts = data?.data?.posts ? parsePosts(data.data.posts) : [];

  // Handle copy to clipboard
  const handleCopy = (post: string) => {
    navigator.clipboard.writeText(post)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "Post content copied successfully!",
          duration: 3000,
        });
        setSelectedPost(post);
        setTimeout(() => setSelectedPost(null), 2000);
      })
      .catch(err => {
        toast({
          title: "Copy failed",
          description: "Failed to copy content. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      });
  };

  // Handle share
  const handleShare = (post: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'Social Media Post Suggestion',
        text: post,
      })
      .catch(err => {
        toast({
          title: "Share failed",
          description: "Failed to share content. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      });
    } else {
      handleCopy(post);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Social Media Post Suggestions</CardTitle>
          <CardDescription>Loading suggestions for your business...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Social Media Post Suggestions</CardTitle>
          <CardDescription>Unable to load suggestions at this time.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">There was an error fetching social media post suggestions. Please try again later.</p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Social Media Post Suggestions</CardTitle>
        <CardDescription>
          AI-generated post ideas for your {businessType || 'business'}
          {data?.cached && <span className="text-xs text-muted-foreground ml-2">(cached)</span>}
          {data?.fallback && <span className="text-xs text-amber-500 ml-2">(fallback suggestions)</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {socialPosts.length > 0 ? (
          socialPosts.map((post, index) => (
            <div key={index} className="relative">
              <Card className={`p-4 bg-muted/30 hover:bg-muted/50 transition-colors ${selectedPost === post ? 'border-primary/70' : ''}`}>
                <p className="whitespace-pre-line">{post}</p>
                <div className="flex mt-2 gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(post)}
                    className="flex items-center gap-1"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare(post)}
                    className="flex items-center gap-1"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Share</span>
                  </Button>
                </div>
              </Card>
              {index < socialPosts.length - 1 && <Separator className="my-4" />}
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">No social media post suggestions available. Try refreshing to generate new suggestions.</p>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => refetch()} 
          disabled={isRefetching}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          {isRefetching ? 'Generating...' : 'Refresh Suggestions'}
        </Button>
      </CardFooter>
    </Card>
  );
}