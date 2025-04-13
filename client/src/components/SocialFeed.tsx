import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Calendar, MoreHorizontal, Calendar as CalendarIcon, Check, Edit2, RefreshCcw, ExternalLink, Twitter, Instagram, Linkedin, Facebook, Share2, ThumbsUp, MessageSquare, Clock, SendHorizontal, AlertCircle, Info } from 'lucide-react';
import { format, formatDistance } from 'date-fns';
import { PostSentimentIndicator } from './PostSentimentIndicator';
import { SocialShareButtons } from './SocialShareButtons';

interface SocialFeedProps {
  showFilters?: boolean;
  platformId?: number;
  status?: string;
  limit?: number;
}

export function SocialFeed({ 
  showFilters = false, 
  platformId,
  status,
  limit = 10
}: SocialFeedProps) {
  // State for filters
  const [selectedPlatform, setSelectedPlatform] = useState<string>(platformId ? String(platformId) : 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>(status || 'all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(limit);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Format query params
  const queryParams = new URLSearchParams({
    platform: selectedPlatform,
    status: selectedStatus,
    page: String(currentPage),
    pageSize: String(pageSize),
    sortBy,
    sortOrder
  });
  
  // Fetch social platforms for filter dropdown
  const { 
    data: platforms, 
    isLoading: platformsLoading 
  } = useQuery({
    queryKey: ['/api/social/platforms'],
  });
  
  // Fetch social posts with filters
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: [`/api/social/posts?${queryParams.toString()}`],
  });
  
  // Platform icon mapping
  const getPlatformIcon = (platformName: string) => {
    switch (platformName?.toLowerCase()) {
      case 'twitter':
        return <Twitter className="h-4 w-4" />;
      case 'instagram':
        return <Instagram className="h-4 w-4" />;
      case 'linkedin':
        return <Linkedin className="h-4 w-4" />;
      case 'facebook':
        return <Facebook className="h-4 w-4" />;
      default:
        return <Share2 className="h-4 w-4" />;
    }
  };
  
  // Status badge color mapping
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'posted':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Posted</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Scheduled</Badge>;
      case 'draft':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Draft</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Processing</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">{status}</Badge>;
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy h:mm a');
  };
  
  // Calculate time ago for relative time display
  const timeAgo = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return formatDistance(date, new Date(), { addSuffix: true });
  };
  
  // Filter posts by search query
  const filteredPosts = data?.posts?.filter((post: any) => {
    if (!searchQuery) return true;
    
    return post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (post.platform?.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
           (post.hashTags || []).some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
  });
  
  // Calculate stats based on metrics in posts
  const calculateEngagementStats = () => {
    if (!data?.posts?.length) {
      return { totalPosts: 0, totalLikes: 0, totalShares: 0, totalComments: 0, avgEngagement: 0 };
    }
    
    const stats = data.posts.reduce((acc: any, post: any) => {
      if (post.metrics) {
        acc.totalLikes += post.metrics.likes || 0;
        acc.totalShares += post.metrics.shares || 0;
        acc.totalComments += post.metrics.comments || 0;
        if (post.metrics.engagement) {
          acc.engagementSum += post.metrics.engagement;
          acc.engagementCount += 1;
        }
      }
      return acc;
    }, { totalLikes: 0, totalShares: 0, totalComments: 0, engagementSum: 0, engagementCount: 0 });
    
    return {
      totalPosts: data.posts.length,
      totalLikes: stats.totalLikes,
      totalShares: stats.totalShares,
      totalComments: stats.totalComments,
      avgEngagement: stats.engagementCount > 0 
        ? Math.round((stats.engagementSum / stats.engagementCount) * 100) / 100
        : 0
    };
  };
  
  const engagementStats = calculateEngagementStats();
  
  return (
    <div className="w-full">
      {showFilters && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Filter Posts</CardTitle>
            <CardDescription>
              Find and sort your social media content
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Select
                    value={selectedPlatform}
                    onValueChange={(value) => {
                      setSelectedPlatform(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger id="platform">
                      <SelectValue placeholder="Select Platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Platforms</SelectItem>
                      {platforms?.map((platform: any) => (
                        <SelectItem key={platform.id} value={String(platform.id)}>
                          {platform.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={selectedStatus}
                    onValueChange={(value) => {
                      setSelectedStatus(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="posted">Posted</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Search by content or hashtags"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <RadioGroup
                    value={sortBy}
                    onValueChange={(value) => {
                      setSortBy(value);
                      setCurrentPage(1);
                    }}
                    className="flex flex-row space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="createdAt" id="sort-created" />
                      <Label htmlFor="sort-created">Created Date</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="scheduledTime" id="sort-scheduled" />
                      <Label htmlFor="sort-scheduled">Scheduled Date</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="postedAt" id="sort-posted" />
                      <Label htmlFor="sort-posted">Posted Date</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <RadioGroup
                    value={sortOrder}
                    onValueChange={(value) => {
                      setSortOrder(value);
                      setCurrentPage(1);
                    }}
                    className="flex flex-row space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="desc" id="sort-desc" />
                      <Label htmlFor="sort-desc">Newest First</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="asc" id="sort-asc" />
                      <Label htmlFor="sort-asc">Oldest First</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
                <div className="bg-slate-50 p-3 rounded-md">
                  <div className="text-sm text-muted-foreground">Posts</div>
                  <div className="text-xl font-semibold">{engagementStats.totalPosts}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-md">
                  <div className="text-sm text-muted-foreground">Likes</div>
                  <div className="text-xl font-semibold">{engagementStats.totalLikes}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-md">
                  <div className="text-sm text-muted-foreground">Shares</div>
                  <div className="text-xl font-semibold">{engagementStats.totalShares}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-md">
                  <div className="text-sm text-muted-foreground">Comments</div>
                  <div className="text-xl font-semibold">{engagementStats.totalComments}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-md">
                  <div className="text-sm text-muted-foreground">Avg. Engagement</div>
                  <div className="text-xl font-semibold">{engagementStats.avgEngagement}%</div>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="justify-between border-t px-6 py-3">
            <div className="flex items-center text-sm text-muted-foreground">
              {isLoading ? 'Loading...' : `Showing ${filteredPosts?.length || 0} of ${data?.pagination?.totalItems || 0} posts`}
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <AlertCircle className="h-10 w-10 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load social posts</h3>
            <p className="text-muted-foreground text-center mb-4">
              There was an error retrieving your social media content.
            </p>
            <Button variant="secondary" onClick={() => refetch()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* No posts state */}
      {!isLoading && !error && (!data?.posts || data.posts.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Info className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No posts found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery 
                ? `No posts matching "${searchQuery}" were found.` 
                : "You don't have any social media posts yet."}
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => {
                setSearchQuery('');
                setSelectedPlatform('all');
                setSelectedStatus('all');
              }}>
                Clear Filters
              </Button>
              <Button>
                Create New Post
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Post feed */}
      {!isLoading && !error && filteredPosts && filteredPosts.length > 0 && (
        <div className="grid gap-6">
          {filteredPosts.map((post: any) => (
            <Card key={post.id} className="overflow-hidden">
              <CardHeader className="pb-2 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {getPlatformIcon(post.platform?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{post.platform?.displayName || 'Unknown Platform'}</span>
                        {getStatusBadge(post.status)}
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        {post.status === 'posted' && post.postedAt && (
                          <>
                            <span>{timeAgo(post.postedAt)}</span>
                            <span className="mx-1">•</span>
                            <span>{formatDate(post.postedAt)}</span>
                          </>
                        )}
                        
                        {post.status === 'scheduled' && post.scheduledTime && (
                          <>
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            <span>Scheduled for {formatDate(post.scheduledTime)}</span>
                          </>
                        )}
                        
                        {!post.postedAt && !post.scheduledTime && (
                          <>
                            <span>{timeAgo(post.createdAt)}</span>
                            <span className="mx-1">•</span>
                            <span>{formatDate(post.createdAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {post.status === 'posted' && post.metrics && (
                      <PostSentimentIndicator 
                        engagement={post.metrics.engagement} 
                        likes={post.metrics.likes}
                        comments={post.metrics.comments}
                        shares={post.metrics.shares}
                      />
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pb-3">
                <p className="whitespace-pre-line">{post.content}</p>
                
                {/* Hashtags */}
                {post.hashTags && post.hashTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {post.hashTags.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {/* Media content */}
                {post.mediaUrls && post.mediaUrls.length > 0 && (
                  <div className={`grid gap-2 mt-3 ${post.mediaUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {post.mediaUrls.map((url: string, index: number) => (
                      <div key={index} className="relative aspect-video bg-muted rounded-md overflow-hidden">
                        <img
                          src={url}
                          alt={`Post media ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Post metrics */}
                {post.status === 'posted' && post.metrics && (
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      <span>{post.metrics.likes || 0}</span>
                    </div>
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      <span>{post.metrics.comments || 0}</span>
                    </div>
                    <div className="flex items-center">
                      <Share2 className="h-4 w-4 mr-1" />
                      <span>{post.metrics.shares || 0}</span>
                    </div>
                    {post.metrics.impressions && (
                      <div className="flex items-center ml-auto">
                        <span>{post.metrics.impressions.toLocaleString()} views</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex justify-between pt-1 pb-3">
                <div className="flex gap-2">
                  {post.status === 'draft' && (
                    <Button variant="outline" size="sm">
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                  
                  {post.status === 'scheduled' && (
                    <Button variant="outline" size="sm">
                      <Calendar className="h-4 w-4 mr-1" />
                      Reschedule
                    </Button>
                  )}
                  
                  {post.status === 'posted' && post.platform?.name && (
                    <Button variant="outline" size="sm" asChild>
                      <a href="#" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View on {post.platform.displayName}
                      </a>
                    </Button>
                  )}
                </div>
                
                {post.status === 'posted' && (
                  <SocialShareButtons
                    url={`https://elevion.dev/social-posts/${post.id}`}
                    title={post.content.substring(0, 100)}
                    variant="compact"
                  />
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Pagination controls */}
      {!isLoading && !error && data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {data.pagination.totalPages}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(data.pagination.totalPages, prev + 1))}
            disabled={currentPage === data.pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

// Add default export to maintain compatibility with components that import this
export default SocialFeed;