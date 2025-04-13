import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BlogPost as BlogPostType } from '@/lib/types';
import { Calendar, User, ArrowRight, Shield } from 'lucide-react';
import PostSentimentIndicator from './PostSentimentIndicator';
import BlogSeoAnalysis from './BlogSeoAnalysis';
import { motion } from 'framer-motion';
import ProtectedImage from './ProtectedImage';
import { apiRequest } from '@/lib/queryClient';

interface BlogPostProps {
  post: BlogPostType;
  displayMode?: 'card' | 'full';
}

export default function BlogPostComponent({ post, displayMode = 'card' }: BlogPostProps) {
  const [watermarkedContent, setWatermarkedContent] = useState<string | null>(null);
  const [isContentProtected, setIsContentProtected] = useState<boolean>(false);
  
  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };
  
  // Load watermarked content if in full post view
  useEffect(() => {
    if (displayMode === 'full' && post.content && !watermarkedContent) {
      // Request watermarked content from the server
      const fetchWatermarkedContent = async () => {
        try {
          const response = await apiRequest('POST', '/api/content/watermark', {
            content: post.content,
            contentId: post.id,
            contentType: 'blog'
          });
          
          const data = await response.json();
          if (data.success && data.watermarkedContent) {
            setWatermarkedContent(data.watermarkedContent);
            setIsContentProtected(true);
          } else {
            // Fallback to original content if watermarking fails
            setWatermarkedContent(post.content);
            setIsContentProtected(false);
          }
        } catch (error) {
          console.error('Error fetching watermarked content:', error);
          setWatermarkedContent(post.content);
          setIsContentProtected(false);
        }
      };
      
      fetchWatermarkedContent();
    }
  }, [post.id, post.content, displayMode, watermarkedContent]);
  
  // Card view for blog listings
  if (displayMode === 'card') {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
        className="h-full"
      >
        <Card className="h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow duration-200">
          <div className="relative h-48 overflow-hidden">
            <ProtectedImage 
              src={post.image || '/images/placeholder-blog.jpg'} 
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              watermark={true}
            />
            <div className="absolute top-3 right-3 flex gap-2">
              <PostSentimentIndicator postId={typeof post.id === 'number' ? post.id.toString() : post.id} />
              <BlogSeoAnalysis postId={typeof post.id === 'number' ? post.id.toString() : post.id} displayMode="icon" />
            </div>
          </div>
          
          <CardContent className="flex flex-col flex-grow p-5">
            <div className="flex items-center text-sm text-gray-500 mb-2 space-x-4">
              <div className="flex items-center">
                <Calendar size={14} className="mr-1" />
                <span>{post.date}</span>
              </div>
              <div className="flex items-center">
                <User size={14} className="mr-1" />
                <span>{post.author}</span>
              </div>
            </div>
            
            <h3 className="text-xl font-semibold mb-2 line-clamp-2">{post.title}</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 flex-grow">{post.excerpt}</p>
            
            <Link href={`/blog/${post.id}`}>
              <Button variant="outline" size="sm" className="mt-auto w-full text-sm flex items-center justify-center gap-1">
                Read more <ArrowRight size={14} />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
  
  // Full post view for individual blog post pages
  return (
    <div className="blog-post-content">
      <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
      
      <div className="flex flex-wrap items-center gap-3 md:gap-5 mb-6 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center">
          <Calendar size={16} className="mr-1.5" />
          <span>{post.date}</span>
        </div>
        <div className="flex items-center">
          <User size={16} className="mr-1.5" />
          <span>{post.author}</span>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <PostSentimentIndicator postId={post.id.toString()} />
          <BlogSeoAnalysis postId={post.id.toString()} displayMode="icon" />
          {isContentProtected && (
            <div className="flex items-center text-emerald-600 dark:text-emerald-400" title="Content is protected">
              <Shield size={16} className="mr-1" />
              <span className="text-xs">Protected</span>
            </div>
          )}
        </div>
      </div>
      
      {post.image && (
        <div className="mb-8 rounded-lg overflow-hidden">
          <ProtectedImage 
            src={post.image} 
            alt={post.title}
            className="w-full h-auto object-cover max-h-[500px]"
            watermark={true}
          />
        </div>
      )}
      
      <div className="blog-content" dangerouslySetInnerHTML={{ __html: watermarkedContent || post.content || '' }}></div>
    </div>
  );
}