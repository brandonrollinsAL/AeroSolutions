import React from 'react';
import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: 'website' | 'article' | 'product' | 'profile';
  ogImage?: string;
  ogImageWidth?: string;
  ogImageHeight?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  canonicalUrl?: string;
  noIndex?: boolean;
  children?: React.ReactNode;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogType = 'website',
  ogImage,
  ogImageWidth = '1200',
  ogImageHeight = '630',
  twitterTitle,
  twitterDescription,
  twitterImage,
  twitterCard = 'summary_large_image',
  canonicalUrl,
  noIndex = false,
  children,
}) => {
  // Default values for social media if not provided
  const ogTitleFinal = ogTitle || title;
  const ogDescriptionFinal = ogDescription || description;
  const twitterTitleFinal = twitterTitle || ogTitleFinal;
  const twitterDescriptionFinal = twitterDescription || ogDescriptionFinal;
  const twitterImageFinal = twitterImage || ogImage;
  
  useEffect(() => {
    // Set page title
    document.title = title;
    
    // Helper to create or update meta tags
    const setMetaTag = (name: string, content: string, property = false) => {
      const attributeName = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attributeName}="${name}"]`);
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attributeName, name);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };
    
    // Helper to create or update link tags
    const setLinkTag = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`);
      
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        document.head.appendChild(link);
      }
      
      link.setAttribute('href', href);
    };
    
    // Set basic meta tags
    setMetaTag('description', description);
    if (keywords) setMetaTag('keywords', keywords);
    
    // Set robots meta tag
    if (noIndex) {
      setMetaTag('robots', 'noindex, nofollow');
    } else {
      setMetaTag('robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    }
    
    // Set canonical URL
    if (canonicalUrl) {
      setLinkTag('canonical', canonicalUrl);
    }
    
    // Set OpenGraph meta tags
    setMetaTag('og:title', ogTitleFinal, true);
    setMetaTag('og:description', ogDescriptionFinal, true);
    setMetaTag('og:type', ogType, true);
    if (canonicalUrl) setMetaTag('og:url', canonicalUrl, true);
    if (ogImage) {
      setMetaTag('og:image', ogImage, true);
      setMetaTag('og:image:width', ogImageWidth, true);
      setMetaTag('og:image:height', ogImageHeight, true);
    }
    setMetaTag('og:site_name', 'Aero Solutions', true);
    
    // Set Twitter meta tags
    setMetaTag('twitter:card', twitterCard, true);
    setMetaTag('twitter:title', twitterTitleFinal, true);
    setMetaTag('twitter:description', twitterDescriptionFinal, true);
    if (twitterImageFinal) setMetaTag('twitter:image', twitterImageFinal, true);
    
    // Set other meta tags
    setMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=5');
    setMetaTag('theme-color', '#1E3A8A');
    
    // Set manifest
    setLinkTag('manifest', '/manifest.json');
    
    // Cleanup function to remove meta tags
    return () => {
      // No cleanup needed as we're just updating existing tags
    };
  }, [
    title, 
    description, 
    keywords, 
    noIndex, 
    canonicalUrl,
    ogTitleFinal,
    ogDescriptionFinal,
    ogType,
    ogImage,
    ogImageWidth,
    ogImageHeight,
    twitterTitleFinal,
    twitterDescriptionFinal,
    twitterCard,
    twitterImageFinal
  ]);
  
  return <>{children}</>;
};

export default SEOHead;