import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import {
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  Link as LinkIcon,
  Check,
  Share2
} from 'lucide-react';

export interface SocialShareButtonsProps {
  url: string;
  title?: string;
  className?: string;
  variant?: 'default' | 'compact';
  showCopyLink?: boolean;
}

export function SocialShareButtons({
  url,
  title = 'Check this out!',
  className = '',
  variant = 'default',
  showCopyLink = true
}: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  
  // Ensure URL is absolute
  const absoluteUrl = url.startsWith('http') ? url : `https://elevion.dev${url.startsWith('/') ? url : `/${url}`}`;
  
  // Encode components for sharing
  const encodedUrl = encodeURIComponent(absoluteUrl);
  const encodedTitle = encodeURIComponent(title);
  
  // Generate share URLs
  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedTitle}%0A%0A${encodedUrl}`
  };
  
  // Copy URL to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(absoluteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  // For compact view, use a dropdown
  if (variant === 'compact') {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className={className}>
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="end">
          <div className="grid gap-1">
            <Button variant="ghost" size="sm" className="justify-start" onClick={() => window.open(shareUrls.twitter, '_blank')}>
              <Twitter className="h-4 w-4 mr-2 text-blue-400" />
              Twitter
            </Button>
            <Button variant="ghost" size="sm" className="justify-start" onClick={() => window.open(shareUrls.facebook, '_blank')}>
              <Facebook className="h-4 w-4 mr-2 text-blue-600" />
              Facebook
            </Button>
            <Button variant="ghost" size="sm" className="justify-start" onClick={() => window.open(shareUrls.linkedin, '_blank')}>
              <Linkedin className="h-4 w-4 mr-2 text-blue-700" />
              LinkedIn
            </Button>
            <Button variant="ghost" size="sm" className="justify-start" onClick={() => window.open(shareUrls.email, '_blank')}>
              <Mail className="h-4 w-4 mr-2 text-gray-500" />
              Email
            </Button>
            {showCopyLink && (
              <Button variant="ghost" size="sm" className="justify-start" onClick={copyToClipboard}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-4 w-4 mr-2 text-gray-500" />
                    Copy Link
                  </>
                )}
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }
  
  // Default view with individual buttons
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Button variant="outline" size="icon" className="rounded-full h-8 w-8" onClick={() => window.open(shareUrls.twitter, '_blank')}>
        <Twitter className="h-4 w-4 text-blue-400" />
        <span className="sr-only">Share on Twitter</span>
      </Button>
      
      <Button variant="outline" size="icon" className="rounded-full h-8 w-8" onClick={() => window.open(shareUrls.facebook, '_blank')}>
        <Facebook className="h-4 w-4 text-blue-600" />
        <span className="sr-only">Share on Facebook</span>
      </Button>
      
      <Button variant="outline" size="icon" className="rounded-full h-8 w-8" onClick={() => window.open(shareUrls.linkedin, '_blank')}>
        <Linkedin className="h-4 w-4 text-blue-700" />
        <span className="sr-only">Share on LinkedIn</span>
      </Button>
      
      <Button variant="outline" size="icon" className="rounded-full h-8 w-8" onClick={() => window.open(shareUrls.email, '_blank')}>
        <Mail className="h-4 w-4 text-gray-500" />
        <span className="sr-only">Share via Email</span>
      </Button>
      
      {showCopyLink && (
        <Button variant="outline" size="icon" className="rounded-full h-8 w-8" onClick={copyToClipboard}>
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <LinkIcon className="h-4 w-4 text-gray-500" />
          )}
          <span className="sr-only">Copy Link</span>
        </Button>
      )}
    </div>
  );
}

// Add default export to maintain compatibility with components that import this
export default SocialShareButtons;