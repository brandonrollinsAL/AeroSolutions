import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SocialFeedProps {
  type: 'twitter' | 'instagram' | 'linkedin';
  username: string;
  limit?: number;
  width?: number | string;
  height?: number | string;
  className?: string;
}

const SocialFeed: React.FC<SocialFeedProps> = ({
  type,
  username,
  limit = 3,
  width = '100%',
  height = 500,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up any existing scripts or iframe content
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    // Load appropriate social media embed based on type
    if (type === 'twitter') {
      // Twitter embed
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      
      const twitterTimeline = document.createElement('a');
      twitterTimeline.className = 'twitter-timeline';
      twitterTimeline.setAttribute('data-height', height.toString());
      twitterTimeline.setAttribute('data-theme', 'light');
      twitterTimeline.setAttribute('data-tweet-limit', limit.toString());
      twitterTimeline.href = `https://twitter.com/${username}`;
      twitterTimeline.innerText = 'Tweets by ' + username;
      
      containerRef.current.appendChild(twitterTimeline);
      containerRef.current.appendChild(script);
    } 
    else if (type === 'instagram') {
      // Instagram embed (using their recommended approach)
      const script = document.createElement('script');
      script.src = '//www.instagram.com/embed.js';
      script.async = true;
      
      const instagramPost = document.createElement('blockquote');
      instagramPost.className = 'instagram-media';
      instagramPost.setAttribute('data-instgrm-captioned', '');
      instagramPost.setAttribute('data-instgrm-permalink', `https://www.instagram.com/${username}/`);
      
      containerRef.current.appendChild(instagramPost);
      containerRef.current.appendChild(script);
    }
    else if (type === 'linkedin') {
      // LinkedIn embed
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.linkedin.com/embed/feed/update/urn:li:share:${username}`;
      iframe.width = width.toString();
      iframe.height = height.toString();
      iframe.frameBorder = "0";
      iframe.allowFullscreen = true;
      
      containerRef.current.appendChild(iframe);
    }

    // Clean up
    return () => {
      if (containerRef.current) {
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
      }
    };
  }, [type, username, limit, width, height]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl">
          {type === 'twitter' && 'Twitter Feed'}
          {type === 'instagram' && 'Instagram Feed'}
          {type === 'linkedin' && 'LinkedIn Updates'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          ref={containerRef}
          className="w-full overflow-hidden"
          style={{ 
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height
          }}
        />
      </CardContent>
    </Card>
  );
};

export default SocialFeed;