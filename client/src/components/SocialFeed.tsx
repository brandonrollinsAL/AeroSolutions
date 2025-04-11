import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FaTwitter, FaFacebookF, FaLinkedinIn, FaInstagram } from 'react-icons/fa';
import { Skeleton } from '@/components/ui/skeleton';

interface SocialFeedProps {
  className?: string;
  initialTab?: string;
  type?: string;
  username?: string;
  limit?: number;
  height?: number;
}

const SocialFeed: React.FC<SocialFeedProps> = ({ 
  className = '',
  initialTab = 'twitter',
  type,
  username = 'aerosolutions',
  limit = 5,
  height = 500,
}) => {
  const [activeTab, setActiveTab] = useState(type || initialTab);
  const [isLoading, setIsLoading] = useState(true);
  const feedHeight = `${height}px`;

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
            <TabsList className="grid grid-cols-4 h-14">
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
      
      <div className="text-center mt-3 text-xs text-muted-foreground">
        Follow us on social media to stay updated with our latest aviation technology solutions and industry insights.
      </div>
    </div>
  );
};

const FeedSkeleton = ({ height = 500 }) => (
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