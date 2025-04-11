import React from 'react';
import { Button } from '@/components/ui/button';
import { FaTwitter, FaFacebookF, FaLinkedinIn, FaEnvelope, FaPinterestP, FaRedditAlien, FaWhatsapp } from 'react-icons/fa';

interface SocialShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  image?: string;
  className?: string;
  platforms?: string[];
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Enhanced social sharing component with analytics tracking and comprehensive platform support
 */
const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({
  url,
  title,
  description = '',
  image = '',
  className = '',
  platforms = ['twitter', 'facebook', 'linkedin', 'email', 'pinterest', 'reddit', 'whatsapp'],
  size = 'md',
}) => {
  // Support for UTM tracking in shared URLs
  const getUrlWithUtm = (platform: string) => {
    try {
      const baseUrl = url;
      const utmUrl = new URL(baseUrl);
      
      // Add UTM parameters for tracking
      utmUrl.searchParams.append('utm_source', platform);
      utmUrl.searchParams.append('utm_medium', 'social');
      utmUrl.searchParams.append('utm_campaign', 'share');
      
      return encodeURIComponent(utmUrl.toString());
    } catch {
      // Fallback if URL is invalid
      return encodeURIComponent(url);
    }
  };
  
  // Handle click events and tracking
  const handleShareClick = (platform: string) => {
    // Track social share events - can be expanded with actual analytics
    console.log(`Shared on ${platform}`);
  };
  
  // Button size classes
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12"
  };
  
  // Icon size based on button size
  const iconSize = {
    sm: 14,
    md: 18,
    lg: 22
  };
  
  // Create share links for different platforms
  const getShareLink = (platform: string) => {
    const encodedUrl = getUrlWithUtm(platform);
    const encodedTitle = encodeURIComponent(title);
    const encodedDescription = encodeURIComponent(description);
    const encodedImage = encodeURIComponent(image);
    
    switch (platform) {
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
      case 'email':
        return `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`;
      case 'pinterest':
        return `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedImage}&description=${encodedTitle}`;
      case 'reddit':
        return `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
      case 'whatsapp':
        return `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
      default:
        return '';
    }
  };
  
  // Platform-specific icons with appropriate sizing
  const getIcon = (platform: string) => {
    // Get the numeric icon size value based on the selected size
    const currentSize = size; // Create a local variable to avoid reference errors
    const iconSizeValue = iconSize[currentSize as keyof typeof iconSize];
    
    switch (platform) {
      case 'twitter':
        return <FaTwitter size={iconSizeValue} />;
      case 'facebook':
        return <FaFacebookF size={iconSizeValue} />;
      case 'linkedin':
        return <FaLinkedinIn size={iconSizeValue} />;
      case 'email':
        return <FaEnvelope size={iconSizeValue} />;
      case 'pinterest':
        return <FaPinterestP size={iconSizeValue} />;
      case 'reddit':
        return <FaRedditAlien size={iconSizeValue} />;
      case 'whatsapp':
        return <FaWhatsapp size={iconSizeValue} />;
      default:
        return null;
    }
  };

  // Create a local variable for size to use in className
  const buttonSize = size;

  return (
    <div className={`flex space-x-2 ${className}`}>
      {platforms.map((platform) => (
        <Button
          key={platform}
          variant="outline"
          size="icon"
          className={`rounded-full ${sizeClasses[buttonSize as keyof typeof sizeClasses]} hover:bg-primary hover:text-primary-foreground transition-colors`}
          onClick={() => handleShareClick(platform)}
          asChild
        >
          <a
            href={getShareLink(platform)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Share on ${platform}`}
          >
            {getIcon(platform)}
          </a>
        </Button>
      ))}
    </div>
  );
};

export default SocialShareButtons;