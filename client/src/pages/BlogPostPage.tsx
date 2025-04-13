import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import BlogPostComponent from '@/components/BlogPost';
import { BlogPost as BlogPostType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import BlogSeoAnalysis from '@/components/BlogSeoAnalysis';
import { motion } from 'framer-motion';

// Fallback blog posts for reliability
const fallbackPosts: BlogPostType[] = [
  {
    id: 1,
    title: "The Future of Web Development in 2025",
    excerpt: "Explore the cutting-edge technologies and methodologies shaping web development in 2025, from AI-driven design to serverless architectures.",
    content: `
      <h2>The Evolution of Web Development</h2>
      <p>The web development landscape continues to evolve at an unprecedented pace, with new frameworks, tools, and methodologies emerging regularly. As we look ahead to 2025, several key trends are poised to reshape how websites and web applications are built, deployed, and maintained.</p>
      
      <h3>AI-Driven Development</h3>
      <p>Artificial intelligence is no longer just a buzzword in web development; it's becoming an integral part of the development process. From code completion and bug detection to automated testing and even UI design, AI tools are enhancing developer productivity and code quality.</p>
      
      <p>Smart assistants can now understand project requirements and generate entire components or suggest architectural improvements. This shift doesn't eliminate the need for skilled developers but rather transforms their role to focus more on creative problem-solving and strategic thinking.</p>
      
      <h3>The Rise of Serverless Architectures</h3>
      <p>Serverless computing continues its upward trajectory, allowing developers to build and run applications without thinking about servers. This approach reduces operational complexity, improves scalability, and often lowers costs for web applications of all sizes.</p>
      
      <p>Function-as-a-Service (FaaS) platforms are becoming more sophisticated, offering better debugging tools, simplified deployment processes, and improved integration with development workflows.</p>
      
      <h3>Web Assembly and the Performance Revolution</h3>
      <p>WebAssembly (Wasm) is finally delivering on its promise to bring near-native performance to web applications. More developers are leveraging Wasm to run complex computations directly in the browser, enabling advanced applications that were previously only possible on desktop platforms.</p>
      
      <p>From graphics-intensive games to professional-grade photo and video editing tools, WebAssembly is expanding what's possible in the browser and blurring the line between web and native applications.</p>
      
      <h2>Developer Experience Takes Center Stage</h2>
      <p>The focus on developer experience (DX) has never been stronger. Modern frameworks and tools are increasingly designed with developer happiness and productivity in mind, acknowledging that better DX leads to better products.</p>
      
      <p>This trend is evident in the growing popularity of meta-frameworks that provide opinionated, batteries-included development environments with sensible defaults and streamlined workflows.</p>
      
      <h3>Micro-Frontends Go Mainstream</h3>
      <p>The micro-frontend architecture pattern is gaining widespread adoption as organizations seek to break down monolithic frontend applications into smaller, more manageable pieces. This approach allows different teams to work independently on separate parts of an application using their preferred technologies.</p>
      
      <p>Improved tooling and standardized patterns are making micro-frontends more accessible to teams of all sizes, not just large enterprises.</p>
      
      <h2>Conclusion</h2>
      <p>As we navigate the evolving landscape of web development, staying informed about emerging trends and technologies is crucial. By embracing these advancements while maintaining a focus on performance, accessibility, and user experience, developers can create web applications that meet the increasingly sophisticated expectations of users in 2025 and beyond.</p>
    `,
    image: "/images/web-dev-future.jpg",
    date: "April 10, 2025",
    author: "Alex Morgan"
  },
  {
    id: 2,
    title: "Optimizing Web Performance for Core Web Vitals",
    excerpt: "Learn practical strategies for improving your website's Core Web Vitals metrics and boosting your search rankings.",
    content: `
      <h2>Why Core Web Vitals Matter</h2>
      <p>Core Web Vitals have become essential metrics for measuring user experience on the web. As search engines increasingly prioritize user-centric performance indicators, optimizing for these metrics is no longer optional for businesses that want to maintain or improve their search visibility.</p>
      
      <p>The three primary Core Web Vitals metrics—Largest Contentful Paint (LCP), First Input Delay (FID), and Cumulative Layout Shift (CLS)—provide a comprehensive picture of a page's loading performance, interactivity, and visual stability.</p>
      
      <h3>Improving Largest Contentful Paint (LCP)</h3>
      <p>LCP measures the time it takes for the largest content element in the viewport to become visible. To improve this metric:</p>
      
      <ul>
        <li>Optimize and properly size images using modern formats like WebP or AVIF</li>
        <li>Implement effective caching strategies</li>
        <li>Use content delivery networks (CDNs) to serve static assets</li>
        <li>Minimize render-blocking resources by deferring non-critical JavaScript and CSS</li>
      </ul>
      
      <p>Remember that the largest element is often an image, video, or large text block. Prioritizing the loading of these elements can significantly improve your LCP score.</p>
      
      <h3>Reducing First Input Delay (FID)</h3>
      <p>FID measures the time from when a user first interacts with your page to when the browser can respond to that interaction. To reduce FID:</p>
      
      <ul>
        <li>Break up long tasks into smaller, asynchronous tasks</li>
        <li>Defer or remove non-critical third-party scripts</li>
        <li>Use a web worker for complex calculations and operations</li>
        <li>Minimize unused JavaScript and CSS</li>
      </ul>
      
      <p>JavaScript execution is the main cause of high FID scores, so optimizing how and when your JavaScript runs is crucial.</p>
      
      <h3>Minimizing Cumulative Layout Shift (CLS)</h3>
      <p>CLS measures the unexpected layout shifts that occur during page loading. To minimize CLS:</p>
      
      <ul>
        <li>Always include size attributes on images and video elements</li>
        <li>Reserve space for ad elements and embeds</li>
        <li>Avoid inserting content above existing content unless in response to user interaction</li>
        <li>Use transform animations instead of animations that trigger layout changes</li>
      </ul>
      
      <p>Layout shifts are particularly frustrating for users, often leading to accidental clicks and a poor user experience.</p>
      
      <h2>Measuring and Monitoring Core Web Vitals</h2>
      <p>Implementing optimizations is only half the battle. Continuously measuring and monitoring your Core Web Vitals is essential for maintaining good performance over time:</p>
      
      <ul>
        <li>Use field data from the Chrome User Experience Report (CrUX) to understand real-user experiences</li>
        <li>Incorporate lab testing tools like Lighthouse and WebPageTest into your development workflow</li>
        <li>Set up monitoring with performance budgets and alerts when metrics degrade</li>
        <li>Segment your analysis by device type, connection speed, and geographic location</li>
      </ul>
      
      <h2>Conclusion</h2>
      <p>Optimizing for Core Web Vitals requires a holistic approach to web performance. By focusing on these user-centric metrics, you're not just improving your search rankings—you're providing a better experience for your users, which can lead to increased engagement, conversions, and customer satisfaction.</p>
      
      <p>Remember that performance optimization is an ongoing process, not a one-time effort. Regularly testing and refining your website will ensure it continues to meet both user expectations and search engine requirements in an evolving digital landscape.</p>
    `,
    image: "/images/core-web-vitals.jpg",
    date: "April 5, 2025",
    author: "Samantha Lee"
  },
];

export default function BlogPostPage() {
  const { postId } = useParams();
  const { toast } = useToast();
  const [showSeoAnalysis, setShowSeoAnalysis] = useState(false);
  
  // Fetch blog post data
  const { data: post, isLoading, error } = useQuery<BlogPostType>({
    queryKey: ['/api/blog/post', postId],
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });
  
  // If there's an error, use fallback data
  useEffect(() => {
    if (error) {
      console.error("Error fetching blog post:", error);
      toast({
        title: "Couldn't load post",
        description: "Using cached version instead",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  // Find appropriate fallback post if needed
  const fallbackPost = fallbackPosts.find(p => p.id.toString() === postId) || fallbackPosts[0];
  const currentPost = error || !post ? fallbackPost : post;
  
  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-10 px-4 sm:px-6">
        <div className="mb-8">
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-6 w-1/2" />
        </div>
        <Skeleton className="h-64 w-full mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="container max-w-4xl mx-auto py-10 px-4 sm:px-6"
    >
      {/* Back to blog button */}
      <div className="mb-8">
        <Link href="/blog">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft size={16} />
            <span>Back to all posts</span>
          </Button>
        </Link>
      </div>
      
      {/* Main blog post content */}
      <article className="prose dark:prose-invert lg:prose-lg max-w-none">
        <BlogPostComponent post={currentPost} displayMode="full" />
        
        {/* Share and SEO analysis buttons */}
        <div className="flex flex-wrap gap-4 justify-between items-center mt-8 pt-6 border-t dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 size={16} />
              <span>Share</span>
            </Button>
            
            <Button 
              variant={showSeoAnalysis ? "default" : "outline"} 
              size="sm"
              onClick={() => setShowSeoAnalysis(!showSeoAnalysis)}
              className="gap-2"
            >
              {showSeoAnalysis ? "Hide SEO Analysis" : "Show SEO Analysis"}
            </Button>
          </div>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Published: {currentPost.date}
          </div>
        </div>
      </article>
      
      {/* SEO Analysis */}
      {showSeoAnalysis && (
        <div className="mt-8">
          <BlogSeoAnalysis postId={postId || "1"} displayMode="full" />
        </div>
      )}
    </motion.div>
  );
}