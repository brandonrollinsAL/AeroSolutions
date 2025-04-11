import React from 'react';
import { Button } from '@/components/ui/button';
import { Facebook, Twitter, Linkedin, Mail, Link as LinkIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SocialShareButtonsProps {
  url?: string;
  title?: string;
  description?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({
  url = window.location.href,
  title = document.title,
  description = '',
  className = '',
  variant = 'outline',
  size = 'icon',
}) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url)
      .then(() => {
        toast({
          title: "Link Copied!",
          description: "The link has been copied to your clipboard.",
        });
      })
      .catch(() => {
        toast({
          title: "Copy Failed",
          description: "Failed to copy link to clipboard.",
          variant: "destructive",
        });
      });
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Button
        variant={variant}
        size={size}
        onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank')}
        aria-label="Share on Facebook"
      >
        <Facebook className="h-4 w-4" />
      </Button>
      
      <Button
        variant={variant}
        size={size}
        onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, '_blank')}
        aria-label="Share on Twitter"
      >
        <Twitter className="h-4 w-4" />
      </Button>
      
      <Button
        variant={variant}
        size={size}
        onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, '_blank')}
        aria-label="Share on LinkedIn"
      >
        <Linkedin className="h-4 w-4" />
      </Button>
      
      <Button
        variant={variant}
        size={size}
        onClick={() => window.open(`mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`, '_blank')}
        aria-label="Share via Email"
      >
        <Mail className="h-4 w-4" />
      </Button>
      
      <Button
        variant={variant}
        size={size}
        onClick={copyToClipboard}
        aria-label="Copy Link"
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default SocialShareButtons;