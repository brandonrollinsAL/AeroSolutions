import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Share2, 
  Plus, 
  Calendar, 
  Clock, 
  Twitter, 
  Instagram, 
  Facebook, 
  Linkedin,
  MessageSquare,
  BarChart2,
  Settings2,
  Sparkles,
  FileText,
  Image,
  Video,
  Link,
  CalendarClock,
  CalendarCheck,
  Pencil,
  ArrowUpRight,
  Loader2
} from 'lucide-react';

import { SocialFeed } from '@/components/SocialFeed';
import { PlatformDetailModal } from '@/components/PlatformDetailModal';

export default function SocialMediaPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('feed');
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);
  
  // Fetch social platforms
  const { data: platforms, isLoading: platformsLoading } = useQuery({
    queryKey: ['/api/social/platforms'],
  });
  
  // Platform icon mapping
  const getPlatformIcon = (platformName: string) => {
    switch (platformName?.toLowerCase()) {
      case 'twitter':
        return <Twitter className="h-5 w-5" />;
      case 'instagram':
        return <Instagram className="h-5 w-5" />;
      case 'linkedin':
        return <Linkedin className="h-5 w-5" />;
      case 'facebook':
        return <Facebook className="h-5 w-5" />;
      default:
        return <Share2 className="h-5 w-5" />;
    }
  };
  
  // Platform color mapping
  const getPlatformColor = (platformName: string) => {
    switch (platformName?.toLowerCase()) {
      case 'twitter':
        return 'bg-blue-500/10 text-blue-600';
      case 'instagram':
        return 'bg-purple-500/10 text-purple-600';
      case 'linkedin':
        return 'bg-blue-700/10 text-blue-800';
      case 'facebook':
        return 'bg-blue-600/10 text-blue-700';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };
  
  return (
    <div className="container py-8">
      <Helmet>
        <title>Social Media Manager | Elevion</title>
      </Helmet>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Social Media Manager</h1>
          <p className="text-muted-foreground mt-1">
            Manage all your social media content from one place
          </p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <Button 
            variant="default" 
            size="sm"
            className="flex-1 md:flex-none"
            onClick={() => setCreatePostModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Post
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="flex-1 md:flex-none"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="flex-1 md:flex-none"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Generate
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-12 gap-6">
        {/* Main content area */}
        <div className="col-span-12 lg:col-span-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="feed">
                <FileText className="h-4 w-4 mr-2" />
                Posts
              </TabsTrigger>
              <TabsTrigger value="calendar">
                <CalendarClock className="h-4 w-4 mr-2" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="scheduled">
                <CalendarCheck className="h-4 w-4 mr-2" />
                Scheduled
              </TabsTrigger>
              <TabsTrigger value="drafts">
                <Pencil className="h-4 w-4 mr-2" />
                Drafts
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart2 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="feed" className="space-y-6">
              <SocialFeed showFilters={true} />
            </TabsContent>
            
            <TabsContent value="calendar">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-10 space-y-3">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-2" />
                    <h3 className="text-lg font-medium">Calendar View Coming Soon</h3>
                    <p className="text-muted-foreground text-center max-w-md">
                      Calendar view will allow you to see and manage all your scheduled posts in a visual calendar.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="scheduled">
              <SocialFeed status="scheduled" showFilters={false} />
            </TabsContent>
            
            <TabsContent value="drafts">
              <SocialFeed status="draft" showFilters={false} />
            </TabsContent>
            
            <TabsContent value="analytics">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-10 space-y-3">
                    <BarChart2 className="h-12 w-12 text-muted-foreground mb-2" />
                    <h3 className="text-lg font-medium">Analytics Overview Coming Soon</h3>
                    <p className="text-muted-foreground text-center max-w-md">
                      Comprehensive analytics across all your social platforms will be available soon.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Connected Platforms</CardTitle>
              <CardDescription>
                Manage your social media accounts
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {platformsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {platforms?.length > 0 ? (
                    platforms.map((platform: any) => (
                      <PlatformDetailModal key={platform.id} platform={platform}>
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              {platform.icon ? (
                                <AvatarImage src={platform.icon} alt={platform.displayName} />
                              ) : (
                                <AvatarFallback className={getPlatformColor(platform.name)}>
                                  {getPlatformIcon(platform.name)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <div className="font-medium flex items-center">
                                {platform.displayName}
                                {platform.isActive && (
                                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                                    Connected
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {platform.apiConfig?.bufferProfileId ? 'Via Buffer' : 'Direct Connection'}
                              </div>
                            </div>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </PlatformDetailModal>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No platforms connected</p>
                    </div>
                  )}
                </>
              )}
              
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Connect Platform
              </Button>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Useful shortcuts for social media management
              </CardDescription>
            </CardHeader>
            
            <CardContent className="grid gap-2">
              <Button variant="outline" className="justify-start">
                <Image className="h-4 w-4 mr-2 text-blue-500" />
                Upload New Media
              </Button>
              <Button variant="outline" className="justify-start">
                <Video className="h-4 w-4 mr-2 text-purple-500" />
                Create Short Video
              </Button>
              <Button variant="outline" className="justify-start">
                <MessageSquare className="h-4 w-4 mr-2 text-green-500" />
                Engagement Monitor
              </Button>
              <Button variant="outline" className="justify-start">
                <Link className="h-4 w-4 mr-2 text-amber-500" />
                Link Shortener
              </Button>
              <Button variant="outline" className="justify-start">
                <Settings2 className="h-4 w-4 mr-2 text-gray-500" />
                Preferences
              </Button>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle>AI Content Assistant</CardTitle>
              <CardDescription>
                Generate optimized social media content
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="rounded-md border p-3">
                <h4 className="font-semibold mb-1">Content Suggestions</h4>
                <p className="text-sm text-muted-foreground mb-2">Get AI-powered post ideas based on trending topics in your industry</p>
                <Button size="sm" className="w-full">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Ideas
                </Button>
              </div>
              
              <div className="rounded-md border p-3">
                <h4 className="font-semibold mb-1">Repurpose Content</h4>
                <p className="text-sm text-muted-foreground mb-2">Convert existing content into different formats for each platform</p>
                <Button size="sm" variant="outline" className="w-full">
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Start Repurposing
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}