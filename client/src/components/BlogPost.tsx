import React from 'react';
import { useParams, Link } from 'wouter';
import { FaCalendarAlt, FaUser, FaArrowLeft, FaTwitter, FaLinkedin, FaFacebookF } from "react-icons/fa";
import { motion } from "framer-motion";
import { BlogPost as BlogPostType } from "@/lib/types";
import SocialShareButtons from "@/components/SocialShareButtons";
import PostSentimentIndicator from "@/components/PostSentimentIndicator";
import BlogSeoAnalysis from "@/components/BlogSeoAnalysis";

// Mock blog post data - In production, this would come from an API or database
const blogPostsData: Record<string, BlogPostType> = {
  "1": {
    id: 1,
    title: "Why Full-Stack Development is the Future of Aviation Software",
    excerpt: "Explore how integrated full-stack development is transforming the aviation industry with cohesive, end-to-end solutions...",
    content: `
      <h2>The Evolution of Aviation Software</h2>
      <p>For decades, the aviation industry has relied on disparate software systems to manage everything from flight operations to maintenance scheduling. These siloed solutions often led to inefficiencies, data inconsistencies, and integration headaches.</p>
      
      <p>Today, the industry is witnessing a paradigm shift toward fully integrated, full-stack development approaches. This shift is not just a technological trend but a strategic necessity in an increasingly connected and data-driven aviation ecosystem.</p>
      
      <h2>Benefits of Full-Stack Integration</h2>
      <p>Full-stack developers bring a unique perspective to aviation software, capable of understanding both the user-facing interfaces and the complex backend systems that power them. This holistic approach enables:</p>
      
      <ul>
        <li><strong>Enhanced real-time data processing</strong> - Critical for operations where seconds matter</li>
        <li><strong>Seamless integration across platforms</strong> - From mobile applications used by flight crews to desktop systems used by maintenance teams</li>
        <li><strong>Improved efficiency and reduced costs</strong> - Through consolidated codebases and streamlined development processes</li>
        <li><strong>Enhanced safety protocols</strong> - By ensuring consistent data handling throughout all systems</li>
      </ul>
      
      <h2>The Technical Foundation for Innovation</h2>
      <p>As aviation continues to digitize operations, full-stack development provides the technical foundation needed for innovation. Modern JavaScript frameworks, cloud-native architectures, and API-first approaches are enabling aviation software to become more responsive, reliable, and scalable than ever before.</p>
      
      <p>The future belongs to integrated solutions that can adapt quickly to changing requirements while maintaining the rigorous safety and reliability standards that the aviation industry demands.</p>
    `,
    image: "https://images.unsplash.com/photo-1493037821234-0c274eda13d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    date: "June 15, 2023",
    author: "Brandon Rollins"
  },
  "2": {
    id: 2,
    title: "How AI is Revolutionizing Aviation Operations and Safety",
    excerpt: "Discover the transformative impact of artificial intelligence on flight operations, maintenance predictions, and safety...",
    content: `
      <h2>The AI Revolution in Aviation</h2>
      <p>Artificial intelligence is transforming every aspect of aviation operations, from predictive maintenance to flight path optimization and safety protocols. This isn't science fiction—it's happening right now in hangars, control towers, and cockpits around the world.</p>
      
      <h2>Predictive Maintenance: The End of Unexpected Failures</h2>
      <p>AI systems are now capable of analyzing vast amounts of flight data to predict maintenance needs before failures occur. By processing information from thousands of sensors across an aircraft, machine learning algorithms can identify patterns that human analysts might miss.</p>
      
      <p>The result? Maintenance becomes proactive rather than reactive, reducing unscheduled downtime and potentially preventing serious incidents before they can occur.</p>
      
      <h2>Flight Optimization and Efficiency</h2>
      <p>Modern AI systems are optimizing flight paths for fuel efficiency, taking into account complex variables like weather patterns, aircraft performance data, and even jet stream positioning. These optimizations can reduce fuel consumption by 3-5%, representing massive cost savings and environmental benefits across a fleet.</p>
      
      <h2>Enhanced Safety Through Pattern Recognition</h2>
      <p>Perhaps the most important application of AI in aviation is in safety enhancement. By analyzing flight data from millions of flights, AI can identify subtle anomalies and potential safety concerns that might otherwise go unnoticed.</p>
      
      <p>From pilot decision support tools to automated safety monitoring systems, AI is creating redundant layers of protection throughout aviation operations.</p>
      
      <h2>The Future: Autonomous Systems and Beyond</h2>
      <p>While fully autonomous commercial aircraft remain on the horizon, increasingly automated systems are already supplementing human capabilities in the cockpit and on the ground. These advancements are creating safer skies and more efficient operations across the entire aviation ecosystem.</p>
    `,
    image: "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    date: "May 28, 2023",
    author: "Brandon Rollins"
  },
  "3": {
    id: 3,
    title: "The Case for No Upfront Payment in Software Development",
    excerpt: "Why our unique payment model benefits clients and drives higher quality outcomes in custom software projects...",
    content: `
      <h2>Rethinking Software Development Payment Models</h2>
      <p>Traditional software development payment models often place significant risk on clients. Large upfront payments, hourly billing with uncertain totals, and projects that drag on without clear deliverables are unfortunately common experiences for many organizations.</p>
      
      <p>Our approach is fundamentally different: no upfront payment, with compensation tied directly to delivered value rather than time spent.</p>
      
      <h2>Aligning Incentives for Better Results</h2>
      <p>By aligning payment with deliverables rather than time, we create a true partnership where our success depends entirely on your satisfaction. This approach:</p>
      
      <ul>
        <li><strong>Reduces client risk</strong> - You only pay for completed work that meets your requirements</li>
        <li><strong>Ensures accountability</strong> - Our team is motivated to deliver high-quality results efficiently</li>
        <li><strong>Increases transparency</strong> - Clear deliverables and fixed payments eliminate billing surprises</li>
        <li><strong>Focuses on value</strong> - The emphasis shifts from hours worked to business value delivered</li>
      </ul>
      
      <h2>The Client Experience</h2>
      <p>Our clients appreciate the transparency and shared commitment to project success. Rather than feeling like they're purchasing time, they understand they're investing in outcomes - functioning software that delivers real business value.</p>
      
      <p>This approach has led to stronger, more collaborative relationships and consistently better project outcomes.</p>
      
      <h2>Why This Works for Both Parties</h2>
      <p>This payment model works because it forces discipline on both sides: clients must clearly define what they want, and we must accurately estimate and efficiently deliver those requirements. The result is a more focused development process with less waste and better alignment between technical implementation and business needs.</p>
    `,
    image: "https://images.unsplash.com/photo-1618761714954-0b8cd0026356?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    date: "May 12, 2023",
    author: "Brandon Rollins"
  }
};

const BlogPost: React.FC = () => {
  const { postId } = useParams();
  
  if (!postId || !blogPostsData[postId]) {
    return (
      <div className="container mx-auto py-20 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Blog Post Not Found</h2>
          <p className="mb-6">The blog post you are looking for doesn't exist or has been removed.</p>
          <Link href="/#blog" className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors">
            Return to Blog
          </Link>
        </div>
      </div>
    );
  }
  
  const post = blogPostsData[postId];
  
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };
  
  return (
    <div className="pt-20 pb-24 bg-white">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="mb-8"
        >
          <Link href="/#blog" className="inline-flex items-center text-primary hover:underline mb-6">
            <FaArrowLeft className="mr-2" />
            Back to Blog
          </Link>
          
          <div className="bg-gray-50 rounded-xl overflow-hidden shadow-lg">
            <div className="h-72 overflow-hidden">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/images/aviation-tech.jpeg"; // Fallback image
                }}
              />
            </div>
            
            <div className="p-8">
              <div className="flex items-center text-sm text-gray-500 mb-4 flex-wrap gap-3">
                <div className="flex items-center">
                  <FaCalendarAlt className="mr-2" />
                  <span>{post.date}</span>
                </div>
                <span>|</span>
                <div className="flex items-center">
                  <FaUser className="mr-2" />
                  <span>{post.author}</span>
                </div>
                <span>|</span>
                <PostSentimentIndicator 
                  postId={post.id} 
                  customLabel="Sentiment:" 
                  size="md"
                />
              </div>
              
              <h1 className="text-3xl font-bold text-primary mb-6">{post.title}</h1>
              
              <div className="mb-8">
                <div 
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: post.content || '' }}
                />
              </div>
              
              <div className="border-t pt-6 mt-8">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <span className="font-medium text-gray-700 mr-3">Share this article:</span>
                    <SocialShareButtons
                      url={`https://elevion.dev/blog/${post.id}`}
                      title={post.title}
                      description={post.excerpt}
                      className="inline-flex space-x-3"
                    />
                  </div>
                  
                  <Link href="/#blog" className="text-primary hover:underline">
                    More Articles
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="mt-12"
        >
          <h2 className="text-2xl font-bold text-primary mb-6">SEO Analysis</h2>
          <div className="bg-gray-50 rounded-xl overflow-hidden shadow-lg p-1">
            <BlogSeoAnalysis
              postId={postId}
              displayMode="full"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BlogPost;