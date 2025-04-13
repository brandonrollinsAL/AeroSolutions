import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FaTwitter, FaFacebookF, FaLinkedinIn, FaInstagram } from 'react-icons/fa';
import { TbNews } from 'react-icons/tb';
import { HiTrendingUp, HiOutlineBookmark, HiOutlineHeart, HiOutlineShare, HiLightningBolt } from 'react-icons/hi';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import SocialShareButtons from './SocialShareButtons';

interface Post {
  id: number;
  title?: string;
  content: string;
  author?: string;
  authorId?: number;
  tags?: string[];
  category?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface FeedResponse {
  success: boolean;
  feed: Post[];
  rankedPosts?: Post[];
  trending: Post[];
  similarPosts?: Post[];
  reasoning?: string;
  preferences?: string;
  message?: string;
  cached?: boolean;
  fallback?: boolean;
}

interface PostSuggestionResponse {
  success: boolean;
  suggestion: string;
  source: 'generic' | 'activity-based' | 'fallback';
  error?: string;
}

interface SocialFeedProps {
  className?: string;
  initialTab?: string;
  type?: string;
  username?: string;
  limit?: number;
  height?: number;
  userId?: number;
}

const SocialFeed: React.FC<SocialFeedProps> = ({ 
  className = '',
  initialTab = 'personalized',
  type,
  username = 'elevion',
  limit = 5,
  height = 500,
  userId,
}) => {
  const [activeTab, setActiveTab] = useState(type || initialTab);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const feedHeight = `${height}px`;
  const { toast } = useToast();
  
  // Fetch personalized feed data
  const { data: personalizedData, isLoading: isPersonalizedLoading } = useQuery<FeedResponse>({
    queryKey: ['/api/feed/personalized'],
    enabled: activeTab === 'personalized',
  });

  // Fetch trending feed data
  const { data: trendingData, isLoading: isTrendingLoading } = useQuery<FeedResponse>({
    queryKey: ['/api/feed/trending'],
    enabled: activeTab === 'trending',
  });
  
  // Fetch post suggestions if userId is provided
  const { data: suggestionData, isLoading: isSuggestionLoading } = useQuery<PostSuggestionResponse>({
    queryKey: ['/api/feed/suggest-post', userId],
    enabled: !!userId, // Only fetch if userId is provided
  });

  // Record user engagement with the content
  const recordEngagement = async (postId: number, action: string) => {
    try {
      await fetch('/api/feed/record-engagement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          action,
        }),
      });
      
      // Show success notification for engagement
      if (action === 'like') {
        toast({
          title: "Post liked",
          description: "Your preferences have been updated.",
          duration: 3000,
        });
      } else if (action === 'share') {
        toast({
          title: "Post shared",
          description: "Thank you for sharing!",
          duration: 3000,
        });
      } else if (action === 'bookmark') {
        toast({
          title: "Post saved",
          description: "Added to your bookmarks.",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error recording engagement:', error);
      toast({
        title: "Error",
        description: "Failed to record your interaction.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // Simulating load time for embedded content
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Reset loading state when tab changes
  useEffect(() => {
    setIsLoading(true);
  }, [activeTab]);

  return (
    <div className={`${className}`}>
      <Card className="overflow-hidden">
        {!type ? (
          <Tabs defaultValue={initialTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-6 h-14">
              <TabsTrigger value="personalized" className="flex items-center space-x-2">
                <TbNews className="h-4 w-4" />
                <span className="hidden sm:inline">For You</span>
              </TabsTrigger>
              <TabsTrigger value="trending" className="flex items-center space-x-2">
                <HiTrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Trending</span>
              </TabsTrigger>
              <TabsTrigger value="twitter" className="flex items-center space-x-2">
                <FaTwitter className="h-4 w-4" />
                <span className="hidden sm:inline">Twitter</span>
              </TabsTrigger>
              <TabsTrigger value="facebook" className="flex items-center space-x-2">
                <FaFacebookF className="h-4 w-4" />
                <span className="hidden sm:inline">Facebook</span>
              </TabsTrigger>
              <TabsTrigger value="linkedin" className="flex items-center space-x-2">
                <FaLinkedinIn className="h-4 w-4" />
                <span className="hidden sm:inline">LinkedIn</span>
              </TabsTrigger>
              <TabsTrigger value="instagram" className="flex items-center space-x-2">
                <FaInstagram className="h-4 w-4" />
                <span className="hidden sm:inline">Instagram</span>
              </TabsTrigger>
            </TabsList>
            
            <CardContent className="p-0">
              <TabsContent value="personalized" className="m-0">
                {isPersonalizedLoading ? (
                  <FeedSkeleton height={height} />
                ) : (
                  <div className="overflow-y-auto" style={{ maxHeight: feedHeight }}>
                    {personalizedData?.feed && personalizedData.feed.length > 0 ? (
                      <>
                        {personalizedData.feed.map((post: Post, index: number) => (
                          <PostCard 
                            key={post.id || index} 
                            post={post} 
                            onAction={(action: string) => recordEngagement(post.id, action)}
                          />
                        ))}
                        
                        {personalizedData.reasoning && (
                          <div className="p-4 bg-muted/30 text-xs text-muted-foreground">
                            <p className="font-semibold mb-1">Content recommendation reasoning:</p>
                            <p>{personalizedData.reasoning}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 h-full text-muted-foreground">
                        <TbNews className="h-12 w-12 mb-4 opacity-30" />
                        <p className="text-center">No personalized content available yet.</p>
                        <p className="text-center text-sm mt-2">Interact with more content to improve your recommendations.</p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="trending" className="m-0">
                {isTrendingLoading ? (
                  <FeedSkeleton height={height} />
                ) : (
                  <div className="overflow-y-auto" style={{ maxHeight: feedHeight }}>
                    {trendingData?.trending && trendingData.trending.length > 0 ? (
                      <>
                        {trendingData.trending.map((post: Post, index: number) => (
                          <PostCard 
                            key={post.id || index} 
                            post={post} 
                            onAction={(action: string) => recordEngagement(post.id, action)}
                          />
                        ))}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 h-full text-muted-foreground">
                        <HiTrendingUp className="h-12 w-12 mb-4 opacity-30" />
                        <p className="text-center">No trending content available right now.</p>
                        <p className="text-center text-sm mt-2">Check back soon for the latest popular posts.</p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="twitter" className="m-0">
                {isLoading ? (
                  <FeedSkeleton height={height} />
                ) : (
                  <div className={`relative h-[${feedHeight}] overflow-hidden`}>
                    <iframe 
                      className="w-full h-full border-0"
                      title="Twitter Feed"
                      src={`https://platform.twitter.com/widgets/timeline/profile?dnt=false&embedId=twitter-widget-0&frame=false&hideHeader=false&hideFooter=false&hideScrollBar=false&lang=en&maxHeight=${height}px&origin=https%3A%2F%2Faerosolutions.dev&sessionId=14e6a51ce8c8e4f83cbf8607640200b0ad31b789&showHeader=true&showReplies=false&transparent=false&userId=1594603974825263104`}
                      style={{ maxWidth: '100%', height: feedHeight }}
                    ></iframe>
                    <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="facebook" className="m-0">
                {isLoading ? (
                  <FeedSkeleton height={height} />
                ) : (
                  <div className={`relative h-[${feedHeight}] overflow-hidden`}>
                    <iframe 
                      className="w-full h-full border-0"
                      title="Facebook Feed"
                      src={`https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2F${username}&tabs=timeline&width=500&height=${height}&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId`}
                      style={{ maxWidth: '100%', height: feedHeight }}
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    ></iframe>
                    <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="linkedin" className="m-0">
                {isLoading ? (
                  <FeedSkeleton height={height} />
                ) : (
                  <div className={`relative h-[${feedHeight}] overflow-hidden flex items-center justify-center`}>
                    <iframe 
                      className="w-full h-full border-0"
                      title="LinkedIn Feed"
                      src="https://www.linkedin.com/embed/feed/update/urn:li:share:7068948797174386688"
                      style={{ maxWidth: '100%', height: feedHeight }}
                      frameBorder="0" allowFullScreen={true}
                    ></iframe>
                    <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="instagram" className="m-0">
                {isLoading ? (
                  <FeedSkeleton height={height} />
                ) : (
                  <div className={`relative h-[${feedHeight}] overflow-hidden`}>
                    <iframe 
                      className="w-full h-full border-0"
                      title="Instagram Feed"
                      src={`https://www.instagram.com/${username}/embed`}
                      style={{ maxWidth: '100%', height: feedHeight }}
                    ></iframe>
                    <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        ) : (
          <CardContent className="p-0">
            {isLoading ? (
              <FeedSkeleton height={height} />
            ) : (
              <>
                {type === 'twitter' && (
                  <div className={`relative h-[${feedHeight}] overflow-hidden`}>
                    <iframe 
                      className="w-full h-full border-0"
                      title="Twitter Feed"
                      src={`https://platform.twitter.com/widgets/timeline/profile?dnt=false&embedId=twitter-widget-0&frame=false&hideHeader=false&hideFooter=false&hideScrollBar=false&lang=en&maxHeight=${height}px&origin=https%3A%2F%2Faerosolutions.dev&sessionId=14e6a51ce8c8e4f83cbf8607640200b0ad31b789&showHeader=true&showReplies=false&transparent=false&userId=1594603974825263104`}
                      style={{ maxWidth: '100%', height: feedHeight }}
                    ></iframe>
                    <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>
                  </div>
                )}
                
                {type === 'facebook' && (
                  <div className={`relative h-[${feedHeight}] overflow-hidden`}>
                    <iframe 
                      className="w-full h-full border-0"
                      title="Facebook Feed"
                      src={`https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2F${username}&tabs=timeline&width=500&height=${height}&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId`}
                      style={{ maxWidth: '100%', height: feedHeight }}
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    ></iframe>
                    <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>
                  </div>
                )}
                
                {type === 'linkedin' && (
                  <div className={`relative h-[${feedHeight}] overflow-hidden flex items-center justify-center`}>
                    <iframe 
                      className="w-full h-full border-0"
                      title="LinkedIn Feed"
                      src="https://www.linkedin.com/embed/feed/update/urn:li:share:7068948797174386688"
                      style={{ maxWidth: '100%', height: feedHeight }}
                      frameBorder="0" allowFullScreen={true}
                    ></iframe>
                    <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>
                  </div>
                )}
                
                {type === 'instagram' && (
                  <div className={`relative h-[${feedHeight}] overflow-hidden`}>
                    <iframe 
                      className="w-full h-full border-0"
                      title="Instagram Feed"
                      src={`https://www.instagram.com/${username}/embed`}
                      style={{ maxWidth: '100%', height: feedHeight }}
                    ></iframe>
                    <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        )}
      </Card>
      
      {/* Post Suggestion Feature */}
      {userId && suggestionData && !showSuggestion && (
        <div className="mt-4">
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2 text-sm"
            onClick={() => setShowSuggestion(true)}
          >
            <HiLightningBolt className="h-4 w-4 text-amber-500" />
            Get Posting Ideas
          </Button>
        </div>
      )}
      
      {/* Post Suggestion Display */}
      {userId && suggestionData && showSuggestion && (
        <Card className="mt-4 bg-muted/20 border-dashed">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <HiLightningBolt className="h-5 w-5 text-amber-500" />
                <h4 className="font-semibold text-sm">Suggested Post Idea</h4>
              </div>
              <Badge 
                variant="outline" 
                className="text-xs"
              >
                {suggestionData.source === 'activity-based' ? 'Personalized' : 
                 suggestionData.source === 'generic' ? 'For Small Business' : 'Suggested'}
              </Badge>
            </div>
            
            <div className="bg-card p-3 rounded-md border border-border/50 my-2">
              <p className="text-sm italic">"{suggestionData.suggestion}"</p>
            </div>
            
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                onClick={() => setShowSuggestion(false)}
              >
                Hide
              </Button>
              
              <Button 
                variant="default" 
                size="sm" 
                className="text-xs"
                onClick={() => {
                  navigator.clipboard.writeText(suggestionData.suggestion);
                  toast({
                    title: "Copied to clipboard",
                    description: "Post idea copied to your clipboard",
                    duration: 3000,
                  });
                }}
              >
                Use This Idea
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="text-center mt-3 text-xs text-muted-foreground">
        Follow us on social media to stay updated with our latest web development insights and small business solutions.
      </div>
    </div>
  );
};

interface PostCardProps {
  post: Post;
  onAction: (action: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onAction }) => {
  const { title, content, author, category, imageUrl, tags, createdAt } = post;
  const formattedDate = createdAt ? formatDistanceToNow(new Date(createdAt), { addSuffix: true }) : '';

  return (
    <Card className="mb-4 overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            {title && <CardTitle className="text-lg mb-1">{title}</CardTitle>}
            <div className="flex items-center text-sm text-muted-foreground">
              {author && <span className="mr-2">{author}</span>}
              {formattedDate && <span className="text-xs">{formattedDate}</span>}
            </div>
          </div>
          {category && (
            <Badge variant="outline" className="text-xs">
              {category}
            </Badge>
          )}
        </div>
        
        <CardContent className="p-0 mb-3">
          <p className="text-sm mt-2">{content}</p>
        </CardContent>
        
        {imageUrl && (
          <div className="mb-4 rounded-md overflow-hidden">
            <img
              src={imageUrl}
              alt={title || "Post image"}
              className="w-full h-48 object-cover"
            />
          </div>
        )}
        
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        <CardFooter className="flex justify-between items-center p-0 pt-2 border-t">
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground"
              onClick={() => onAction('like')}
            >
              <HiOutlineHeart className="mr-1 h-4 w-4" />
              <span className="text-xs">Like</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground"
              onClick={() => onAction('bookmark')}
            >
              <HiOutlineBookmark className="mr-1 h-4 w-4" />
              <span className="text-xs">Save</span>
            </Button>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground"
            onClick={() => onAction('share')}
          >
            <HiOutlineShare className="mr-1 h-4 w-4" />
            <span className="text-xs">Share</span>
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
};

interface FeedSkeletonProps {
  height?: number;
}

const FeedSkeleton: React.FC<FeedSkeletonProps> = ({ height = 500 }) => (
  <div className="p-6 space-y-4" style={{ height: `${height}px` }}>
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[160px]" />
      </div>
    </div>
    
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
    
    <Skeleton className="h-48 w-full mt-6" />
    
    <div className="flex space-x-4 mt-6">
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-20" />
    </div>
    
    <div className="mt-8 border-t pt-8">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[160px]" />
        </div>
      </div>
      <div className="mt-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full mt-2" />
        <Skeleton className="h-4 w-2/3 mt-2" />
      </div>
    </div>
  </div>
);

export default SocialFeed;