import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Twitter, Instagram, Linkedin, Facebook, Share2, Check, AlertCircle, FileText, MessageSquare, Calendar, Clock, Zap } from 'lucide-react';

interface Platform {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  apiConfig?: {
    baseUrl?: string;
    endpoints?: Record<string, string>;
    authType?: string;
    scopes?: string[];
    characterLimit?: number;
    bufferProfileId?: string;
  };
}

interface PlatformDetailModalProps {
  platform: Platform;
  children: React.ReactNode;
}

// Platform icon mapping
const getPlatformIcon = (platformName: string) => {
  switch (platformName?.toLowerCase()) {
    case 'twitter':
      return <Twitter className="h-6 w-6" />;
    case 'instagram':
      return <Instagram className="h-6 w-6" />;
    case 'linkedin':
      return <Linkedin className="h-6 w-6" />;
    case 'facebook':
      return <Facebook className="h-6 w-6" />;
    default:
      return <Share2 className="h-6 w-6" />;
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

// Platform post recommendations
const getPlatformRecommendations = (platformName: string) => {
  switch (platformName?.toLowerCase()) {
    case 'twitter':
      return [
        { icon: <FileText className="h-4 w-4" />, text: 'Keep tweets concise and engaging' },
        { icon: <MessageSquare className="h-4 w-4" />, text: 'Use hashtags strategically (1-2 per tweet)' },
        { icon: <Clock className="h-4 w-4" />, text: 'Best times to post: 8-10am, 12pm, 6-9pm' },
      ];
    case 'instagram':
      return [
        { icon: <FileText className="h-4 w-4" />, text: 'Focus on high-quality visuals' },
        { icon: <MessageSquare className="h-4 w-4" />, text: 'Use 5-15 relevant hashtags per post' },
        { icon: <Clock className="h-4 w-4" />, text: 'Best times to post: 11am-1pm, 7-9pm' },
      ];
    case 'linkedin':
      return [
        { icon: <FileText className="h-4 w-4" />, text: 'Share professional, industry-relevant content' },
        { icon: <MessageSquare className="h-4 w-4" />, text: 'Keep articles between 1,000-2,000 words' },
        { icon: <Clock className="h-4 w-4" />, text: 'Best times to post: 8-10am, 12pm, 5-6pm on weekdays' },
      ];
    case 'facebook':
      return [
        { icon: <FileText className="h-4 w-4" />, text: 'Mix content types (text, images, videos)' },
        { icon: <MessageSquare className="h-4 w-4" />, text: 'Aim for 40-80 characters for highest engagement' },
        { icon: <Clock className="h-4 w-4" />, text: 'Best times to post: 1-3pm on weekdays, 12-1pm weekends' },
      ];
    default:
      return [
        { icon: <FileText className="h-4 w-4" />, text: 'Customize content for each platform' },
        { icon: <MessageSquare className="h-4 w-4" />, text: 'Use platform-specific features' },
        { icon: <Clock className="h-4 w-4" />, text: 'Post consistently during high engagement times' },
      ];
  }
};

export function PlatformDetailModal({ platform, children }: PlatformDetailModalProps) {
  const characterLimit = platform.apiConfig?.characterLimit 
    ? `${platform.apiConfig.characterLimit} characters` 
    : 'No specific limit';
  
  const isConnectedToBuffer = !!platform.apiConfig?.bufferProfileId;
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              {platform.icon ? (
                <AvatarImage src={platform.icon} alt={platform.displayName} />
              ) : (
                <AvatarFallback className={getPlatformColor(platform.name)}>
                  {getPlatformIcon(platform.name)}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <DialogTitle className="text-2xl">{platform.displayName}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                {platform.isActive ? (
                  <>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Check className="h-3 w-3 mr-1" /> Connected
                    </Badge>
                    
                    {isConnectedToBuffer && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Buffer Connected
                      </Badge>
                    )}
                  </>
                ) : (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    <AlertCircle className="h-3 w-3 mr-1" /> Not Connected
                  </Badge>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-1">
          <p className="text-sm text-muted-foreground">
            {platform.description || `Share and manage your content on ${platform.displayName}.`}
          </p>
        </div>
        
        <Separator />
        
        <div className="grid gap-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Platform Details</h4>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Character Limit</dt>
                <dd>{characterLimit}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Connection Status</dt>
                <dd className="flex items-center">
                  {platform.isActive ? (
                    <span className="flex items-center text-green-600">
                      <Check className="h-4 w-4 mr-1" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center text-amber-600">
                      <AlertCircle className="h-4 w-4 mr-1" /> Inactive
                    </span>
                  )}
                </dd>
              </div>
              {platform.apiConfig?.baseUrl && (
                <div className="col-span-2">
                  <dt className="text-muted-foreground">API Endpoint</dt>
                  <dd className="font-mono text-xs">{platform.apiConfig.baseUrl}</dd>
                </div>
              )}
            </dl>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Posting Recommendations</h4>
            <ul className="space-y-2">
              {getPlatformRecommendations(platform.name).map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <div className="mt-0.5 text-muted-foreground">{recommendation.icon}</div>
                  <span>{recommendation.text}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">AI Features</h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm">
                <Zap className="h-4 w-4 mt-0.5 text-purple-500" />
                <span>AI post generation optimized for {platform.displayName}</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Zap className="h-4 w-4 mt-0.5 text-purple-500" />
                <span>Smart scheduling based on audience activity patterns</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Zap className="h-4 w-4 mt-0.5 text-purple-500" />
                <span>Engagement analytics with sentiment analysis</span>
              </li>
            </ul>
          </div>
        </div>
        
        <DialogFooter className="flex flex-row justify-between sm:justify-between gap-2">
          <div>
            {platform.isActive ? (
              <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800">
                Disconnect
              </Button>
            ) : (
              <Button>
                Connect Account
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {isConnectedToBuffer && (
              <Button variant="outline" onClick={() => window.open('https://buffer.com', '_blank')}>
                <ExternalLink className="h-4 w-4 mr-1" />
                Open in Buffer
              </Button>
            )}
            <Button variant="outline">
              Configure Settings
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Add default export to maintain compatibility with components that import this
export default PlatformDetailModal;