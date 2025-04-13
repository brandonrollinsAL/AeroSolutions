import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Calendar, Clock, Filter, MoreHorizontal, Check, X, Pencil, CheckCircle, XCircle, AlertTriangle, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, addDays, addMinutes, isValid } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Twitter post status types
type PostStatus = 'draft' | 'scheduled' | 'processing' | 'posted' | 'failed' | 'cancelled' | 'missed';

// Twitter post interface
interface TwitterPost {
  id: number;
  content: string;
  status: PostStatus;
  scheduledTime: string | null;
  postedAt: string | null;
  externalId: string | null;
  errorMessage: string | null;
  articleId: number | null;
  mediaUrls: string[];
  metrics: {
    impressions?: number;
    likes?: number;
    retweets?: number;
    replies?: number;
    clicks?: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Statistics interface
interface TwitterStats {
  draft: number;
  scheduled: number;
  processing: number;
  posted: number;
  failed: number;
  cancelled: number;
  missed: number;
  total: number;
}

const TwitterDashboard: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('scheduled');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [newPostContent, setNewPostContent] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState<boolean>(false);
  const [editingPost, setEditingPost] = useState<TwitterPost | null>(null);
  const [isAutoScheduleModalOpen, setIsAutoScheduleModalOpen] = useState<boolean>(false);
  const [autoScheduleConfig, setAutoScheduleConfig] = useState({
    days: 7,
    postsPerDay: 2,
    startDate: format(addDays(new Date(), 1), 'yyyy-MM-dd')
  });
  const [credentialsStatus, setCredentialsStatus] = useState<{
    ready: boolean;
    message: string;
    missingCredentials?: string[];
  }>({ ready: false, message: 'Checking Twitter API credentials...' });

  // Load credentials status on component mount
  useEffect(() => {
    apiRequest('GET', '/api/twitter/credentials-check')
      .then(res => res.json())
      .then(data => {
        setCredentialsStatus({
          ready: data.ready,
          message: data.message,
          missingCredentials: data.missingCredentials
        });
      })
      .catch(error => {
        setCredentialsStatus({
          ready: false,
          message: 'Failed to check Twitter credentials',
          missingCredentials: ['Error checking credentials']
        });
        console.error('Error checking Twitter credentials:', error);
      });
  }, []);

  // Query for Twitter stats
  const { data: stats, isLoading: isStatsLoading } = useQuery<TwitterStats>({
    queryKey: ['/api/twitter/stats'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/twitter/stats');
      const data = await res.json();
      return data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Query for posts by status (default to scheduled)
  const { data: postsByStatus, isLoading: isPostsLoading, refetch: refetchPosts } = useQuery<TwitterPost[]>({
    queryKey: ['/api/twitter/by-status', activeTab],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/twitter/by-status/${activeTab}`);
      const data = await res.json();
      return data.data;
    },
    enabled: activeTab !== 'date',
    staleTime: 1000 * 60, // 1 minute
  });

  // Query for posts by date
  const { data: postsByDate, isLoading: isDatePostsLoading, refetch: refetchDatePosts } = useQuery<TwitterPost[]>({
    queryKey: ['/api/twitter/by-date', selectedDate],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/twitter/by-date?date=${selectedDate}`);
      const data = await res.json();
      return data.data;
    },
    enabled: activeTab === 'date' && !!selectedDate,
    staleTime: 1000 * 60, // 1 minute
  });

  // Mutation for scheduling a new tweet
  const scheduleMutation = useMutation({
    mutationFn: async (postData: { content: string; scheduledTime: string; articleId?: number }) => {
      const res = await apiRequest('POST', '/api/twitter/schedule', postData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/twitter/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/twitter/by-status', 'scheduled'] });
      if (activeTab === 'date' && selectedDate) {
        queryClient.invalidateQueries({ queryKey: ['/api/twitter/by-date', selectedDate] });
      }
      
      toast({
        title: 'Tweet Scheduled',
        description: 'Your tweet has been scheduled successfully',
        variant: 'default'
      });
      
      // Clear form and close modal
      setNewPostContent('');
      setScheduledTime('');
      setScheduledDate('');
      setIsNewPostModalOpen(false);
      setEditingPost(null);
    },
    onError: (error) => {
      toast({
        title: 'Failed to Schedule Tweet',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    },
  });

  // Mutation for cancelling a scheduled tweet
  const cancelMutation = useMutation({
    mutationFn: async (tweetId: number) => {
      const res = await apiRequest('DELETE', `/api/twitter/scheduled/${tweetId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/twitter/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/twitter/by-status', activeTab] });
      if (activeTab === 'date' && selectedDate) {
        queryClient.invalidateQueries({ queryKey: ['/api/twitter/by-date', selectedDate] });
      }
      
      toast({
        title: 'Tweet Cancelled',
        description: 'The scheduled tweet has been cancelled',
        variant: 'default'
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Cancel Tweet',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    },
  });

  // Mutation for rescheduling a tweet
  const rescheduleMutation = useMutation({
    mutationFn: async ({ tweetId, scheduledTime }: { tweetId: number, scheduledTime: string }) => {
      const res = await apiRequest('PATCH', `/api/twitter/reschedule/${tweetId}`, { scheduledTime });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/twitter/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/twitter/by-status', activeTab] });
      if (activeTab === 'date' && selectedDate) {
        queryClient.invalidateQueries({ queryKey: ['/api/twitter/by-date', selectedDate] });
      }
      
      toast({
        title: 'Tweet Rescheduled',
        description: 'The tweet has been rescheduled successfully',
        variant: 'default'
      });
      
      setEditingPost(null);
    },
    onError: (error) => {
      toast({
        title: 'Failed to Reschedule Tweet',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    },
  });

  // Mutation for auto-scheduling tweets
  const autoScheduleMutation = useMutation({
    mutationFn: async (config: { days: number; postsPerDay: number; startDate?: string }) => {
      const res = await apiRequest('POST', '/api/twitter/auto-schedule', config);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/twitter/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/twitter/by-status', 'scheduled'] });
      
      toast({
        title: 'Tweets Auto-Scheduled',
        description: `Successfully scheduled ${data.data.count} tweets from recent content`,
        variant: 'default'
      });
      
      setIsAutoScheduleModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Failed to Auto-Schedule Tweets',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    },
  });

  // Function to handle scheduling a new post
  const handleSchedulePost = () => {
    if (!newPostContent.trim()) {
      toast({
        title: 'Tweet Content Required',
        description: 'Please enter content for your tweet',
        variant: 'destructive'
      });
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      toast({
        title: 'Schedule Time Required',
        description: 'Please select both a date and time for your tweet',
        variant: 'destructive'
      });
      return;
    }

    // Combine date and time into ISO string
    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    
    if (!isValid(scheduledDateTime) || scheduledDateTime <= new Date()) {
      toast({
        title: 'Invalid Schedule Time',
        description: 'Please select a future date and time',
        variant: 'destructive'
      });
      return;
    }

    if (editingPost) {
      // Reschedule an existing tweet
      rescheduleMutation.mutate({
        tweetId: editingPost.id,
        scheduledTime: scheduledDateTime.toISOString()
      });
    } else {
      // Schedule a new tweet
      scheduleMutation.mutate({
        content: newPostContent,
        scheduledTime: scheduledDateTime.toISOString()
      });
    }
  };

  // Function to handle editing a post
  const handleEditPost = (post: TwitterPost) => {
    setEditingPost(post);
    setNewPostContent(post.content);
    
    if (post.scheduledTime) {
      const date = parseISO(post.scheduledTime);
      setScheduledDate(format(date, 'yyyy-MM-dd'));
      setScheduledTime(format(date, 'HH:mm'));
    }
    
    setIsNewPostModalOpen(true);
  };

  // Function to handle cancelling a post
  const handleCancelPost = (id: number) => {
    if (confirm('Are you sure you want to cancel this scheduled tweet?')) {
      cancelMutation.mutate(id);
    }
  };

  // Function to handle auto-scheduling tweets
  const handleAutoSchedule = () => {
    const { days, postsPerDay, startDate } = autoScheduleConfig;
    
    if (days < 1 || days > 30) {
      toast({
        title: 'Invalid Days Value',
        description: 'Days must be between 1 and 30',
        variant: 'destructive'
      });
      return;
    }

    if (postsPerDay < 1 || postsPerDay > 5) {
      toast({
        title: 'Invalid Posts Per Day',
        description: 'Posts per day must be between 1 and 5',
        variant: 'destructive'
      });
      return;
    }

    if (startDate) {
      const startDateObj = new Date(`${startDate}T09:00:00`);
      if (!isValid(startDateObj)) {
        toast({
          title: 'Invalid Start Date',
          description: 'Please select a valid start date',
          variant: 'destructive'
        });
        return;
      }
    }

    autoScheduleMutation.mutate({
      days,
      postsPerDay,
      startDate: startDate ? new Date(`${startDate}T09:00:00`).toISOString() : undefined
    });
  };

  // Function to render status badge
  const renderStatusBadge = (status: PostStatus) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'scheduled':
        return <Badge variant="secondary">Scheduled</Badge>;
      case 'processing':
        return <Badge variant="default" className="bg-blue-500">Processing</Badge>;
      case 'posted':
        return <Badge variant="default" className="bg-green-500">Posted</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'cancelled':
        return <Badge variant="default" className="bg-yellow-500">Cancelled</Badge>;
      case 'missed':
        return <Badge variant="default" className="bg-orange-500">Missed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Function to render status icon
  const renderStatusIcon = (status: PostStatus) => {
    switch (status) {
      case 'draft':
        return <Pencil className="h-4 w-4 text-gray-500" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'posted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-yellow-500" />;
      case 'missed':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

  // Render posts table
  const renderPostsTable = (posts: TwitterPost[] | undefined, isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!posts || posts.length === 0) {
      return (
        <div className="flex flex-col justify-center items-center h-64 text-muted-foreground">
          <p>No tweets found</p>
          {activeTab === 'scheduled' && (
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => setIsNewPostModalOpen(true)}
            >
              Schedule a new tweet
            </Button>
          )}
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead>Content</TableHead>
            <TableHead className="w-[180px]">Scheduled Time</TableHead>
            <TableHead className="w-[180px]">Posted Time</TableHead>
            <TableHead className="w-[150px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <TableRow key={post.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {renderStatusIcon(post.status)}
                  {renderStatusBadge(post.status)}
                </div>
              </TableCell>
              <TableCell className="max-w-md">
                <div className="truncate">
                  {post.content}
                </div>
                {post.errorMessage && (
                  <div className="text-xs text-red-500 mt-1">
                    Error: {post.errorMessage}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {post.scheduledTime && (
                  <div className="text-sm">
                    <div>{format(parseISO(post.scheduledTime), 'MMM d, yyyy')}</div>
                    <div className="text-muted-foreground">{format(parseISO(post.scheduledTime), 'h:mm a')}</div>
                  </div>
                )}
              </TableCell>
              <TableCell>
                {post.postedAt && (
                  <div className="text-sm">
                    <div>{format(parseISO(post.postedAt), 'MMM d, yyyy')}</div>
                    <div className="text-muted-foreground">{format(parseISO(post.postedAt), 'h:mm a')}</div>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {post.status === 'scheduled' && (
                      <>
                        <DropdownMenuItem onClick={() => handleEditPost(post)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCancelPost(post.id)}>
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </DropdownMenuItem>
                      </>
                    )}
                    {['missed', 'failed', 'cancelled'].includes(post.status) && (
                      <DropdownMenuItem onClick={() => handleEditPost(post)}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reschedule
                      </DropdownMenuItem>
                    )}
                    {post.externalId && (
                      <DropdownMenuItem
                        onClick={() => window.open(`https://twitter.com/i/status/${post.externalId}`, '_blank')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        View on X
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  // Display Twitter API credentials check warning if needed
  if (!credentialsStatus.ready) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-amber-500 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Twitter API Not Configured
          </CardTitle>
          <CardDescription>
            Twitter API credentials are missing or invalid. The Twitter posting functionality will be disabled.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800">
            <p className="mb-2 font-medium">Missing Twitter API credentials:</p>
            <ul className="list-disc pl-5 space-y-1">
              {credentialsStatus.missingCredentials?.map((cred) => (
                <li key={cred}>{cred}</li>
              ))}
            </ul>
            <p className="mt-4">
              These credentials are required to connect to the Twitter (X) API for posting and scheduling tweets.
              Please contact your administrator to set up the required environment variables.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="outline" onClick={() => window.open('https://developer.twitter.com/en', '_blank')}>
            Learn more about Twitter API
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Scheduled</CardTitle>
            <CardDescription>Pending tweets</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{isStatsLoading ? '-' : stats?.scheduled || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Posted</CardTitle>
            <CardDescription>Successfully sent</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{isStatsLoading ? '-' : stats?.posted || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Failed</CardTitle>
            <CardDescription>Error during posting</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{isStatsLoading ? '-' : stats?.failed || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Total</CardTitle>
            <CardDescription>All posts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{isStatsLoading ? '-' : stats?.total || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="default"
            onClick={() => setIsNewPostModalOpen(true)}
          >
            Schedule New Tweet
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsAutoScheduleModalOpen(true)}
          >
            Auto-Schedule from Content
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'date' && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
            </div>
          )}
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => activeTab === 'date' ? refetchDatePosts() : refetchPosts()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="scheduled" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid grid-cols-7 md:w-auto w-full">
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="posted">Posted</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          <TabsTrigger value="missed">Missed</TabsTrigger>
          <TabsTrigger value="date">By Date</TabsTrigger>
        </TabsList>
        <TabsContent value="scheduled">
          {renderPostsTable(postsByStatus, isPostsLoading)}
        </TabsContent>
        <TabsContent value="posted">
          {renderPostsTable(postsByStatus, isPostsLoading)}
        </TabsContent>
        <TabsContent value="failed">
          {renderPostsTable(postsByStatus, isPostsLoading)}
        </TabsContent>
        <TabsContent value="draft">
          {renderPostsTable(postsByStatus, isPostsLoading)}
        </TabsContent>
        <TabsContent value="cancelled">
          {renderPostsTable(postsByStatus, isPostsLoading)}
        </TabsContent>
        <TabsContent value="missed">
          {renderPostsTable(postsByStatus, isPostsLoading)}
        </TabsContent>
        <TabsContent value="date">
          {selectedDate ? (
            renderPostsTable(postsByDate, isDatePostsLoading)
          ) : (
            <div className="flex justify-center items-center h-64 text-muted-foreground">
              Please select a date
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Schedule New Tweet Modal */}
      <Dialog open={isNewPostModalOpen} onOpenChange={setIsNewPostModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPost ? 'Edit Scheduled Tweet' : 'Schedule New Tweet'}
            </DialogTitle>
            <DialogDescription>
              {editingPost 
                ? 'Edit tweet content or reschedule it for a different time.' 
                : 'Compose your tweet and schedule it for posting.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="tweetContent" className="text-sm font-medium">
                Tweet Content <span className="text-xs text-muted-foreground">({newPostContent.length}/280)</span>
              </label>
              <Textarea
                id="tweetContent"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What's happening?"
                rows={4}
                maxLength={280}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="scheduledDate" className="text-sm font-medium">
                  Date
                </label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="scheduledTime" className="text-sm font-medium">
                  Time
                </label>
                <Input
                  id="scheduledTime"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsNewPostModalOpen(false);
              setEditingPost(null);
              setNewPostContent('');
              setScheduledDate('');
              setScheduledTime('');
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSchedulePost}
              disabled={!newPostContent || !scheduledDate || !scheduledTime || scheduleMutation.isPending || rescheduleMutation.isPending}
            >
              {(scheduleMutation.isPending || rescheduleMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingPost ? 'Update Tweet' : 'Schedule Tweet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto-Schedule Modal */}
      <Dialog open={isAutoScheduleModalOpen} onOpenChange={setIsAutoScheduleModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Auto-Schedule Tweets</DialogTitle>
            <DialogDescription>
              Automatically schedule tweets for your recent content hub articles.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="days" className="text-sm font-medium">
                Number of Days
              </label>
              <Input
                id="days"
                type="number"
                value={autoScheduleConfig.days}
                onChange={(e) => setAutoScheduleConfig({
                  ...autoScheduleConfig,
                  days: parseInt(e.target.value)
                })}
                min={1}
                max={30}
              />
              <p className="text-xs text-muted-foreground">
                Number of days to schedule tweets for (1-30)
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="postsPerDay" className="text-sm font-medium">
                Posts Per Day
              </label>
              <Input
                id="postsPerDay"
                type="number"
                value={autoScheduleConfig.postsPerDay}
                onChange={(e) => setAutoScheduleConfig({
                  ...autoScheduleConfig,
                  postsPerDay: parseInt(e.target.value)
                })}
                min={1}
                max={5}
              />
              <p className="text-xs text-muted-foreground">
                Number of posts to schedule per day (1-5)
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="startDate" className="text-sm font-medium">
                Start Date
              </label>
              <Input
                id="startDate"
                type="date"
                value={autoScheduleConfig.startDate}
                onChange={(e) => setAutoScheduleConfig({
                  ...autoScheduleConfig,
                  startDate: e.target.value
                })}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
              <p className="text-xs text-muted-foreground">
                When to start scheduling (defaults to tomorrow)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAutoScheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAutoSchedule}
              disabled={autoScheduleMutation.isPending}
            >
              {autoScheduleMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Auto-Schedule Tweets
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TwitterDashboard;