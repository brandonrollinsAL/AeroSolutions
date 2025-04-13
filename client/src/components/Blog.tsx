import { motion } from "framer-motion";
import { FaCalendarAlt, FaUser, FaArrowRight, FaTwitter, FaLinkedin, FaFacebookF } from "react-icons/fa";
import { BlogPost } from "@/lib/types";
import SocialFeed from "@/components/SocialFeed";
import SocialShareButtons from "@/components/SocialShareButtons";
import PostSentimentIndicator from "@/components/PostSentimentIndicator";

export default function Blog() {
  const blogPosts: BlogPost[] = [
    {
      id: 1,
      title: "Why Full-Stack Development is the Future of Aviation Software",
      excerpt: "Explore how integrated full-stack development is transforming the aviation industry with cohesive, end-to-end solutions...",
      image: "https://images.unsplash.com/photo-1493037821234-0c274eda13d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      date: "June 15, 2023",
      author: "Brandon Rollins"
    },
    {
      id: 2,
      title: "How AI is Revolutionizing Aviation Operations and Safety",
      excerpt: "Discover the transformative impact of artificial intelligence on flight operations, maintenance predictions, and safety...",
      image: "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      date: "May 28, 2023",
      author: "Brandon Rollins"
    },
    {
      id: 3,
      title: "The Case for No Upfront Payment in Software Development",
      excerpt: "Why our unique payment model benefits clients and drives higher quality outcomes in custom software projects...",
      image: "https://images.unsplash.com/photo-1618761714954-0b8cd0026356?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      date: "May 12, 2023",
      author: "Brandon Rollins"
    }
  ];

  const fadeIn = {
    hidden: { opacity: 0, y: 40 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: custom * 0.1, duration: 0.5 }
    })
  };

  return (
    <section id="blog" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeIn}
          custom={0}
        >
          <h2 className="text-3xl font-bold font-montserrat text-primary mb-4">Latest Insights</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Stay updated with the latest trends and insights in aviation technology.</p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {blogPosts.map((post, index) => (
            <motion.div 
              key={post.id}
              className="bg-gray-50 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={fadeIn}
              custom={index + 1}
            >
              <div className="h-48 overflow-hidden">
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/images/aviation-tech.jpeg"; // Fallback image
                  }}
                />
              </div>
              <div className="p-6">
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <FaCalendarAlt className="mr-2" />
                  <span>{post.date}</span>
                  <span className="mx-2">|</span>
                  <FaUser className="mr-2" />
                  <span>{post.author}</span>
                  <span className="mx-2">|</span>
                  <PostSentimentIndicator 
                    postId={post.id} 
                    customLabel="" 
                    size="sm"
                  />
                </div>
                <h3 className="text-xl font-bold font-montserrat text-primary mb-3">{post.title}</h3>
                <p className="text-gray-600 mb-4">{post.excerpt}</p>
                <div className="flex justify-between items-center">
                  <a href="#" className="inline-flex items-center text-luxury font-semibold hover:underline">
                    Read more
                    <FaArrowRight className="ml-2" />
                  </a>
                  
                  <SocialShareButtons 
                    url={`https://aerosolutions.dev/blog/${post.id}`}
                    title={post.title}
                    description={post.excerpt}
                    className="flex space-x-2"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <motion.div 
          className="mt-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeIn}
          custom={4}
        >
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <SocialFeed
              initialTab="twitter"
              username="aerosolutions"
              limit={3}
              height={400}
              className="shadow-lg hover:shadow-xl transition-all duration-300"
            />
            <SocialFeed
              initialTab="linkedin"
              username="aerosolutions"
              height={400}
              className="shadow-lg hover:shadow-xl transition-all duration-300"
            />
          </div>
        </motion.div>
        
        <motion.div 
          className="mt-8 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeIn}
          custom={5}
        >
          <a href="#" className="inline-block bg-black hover:bg-black/90 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300">
            View all articles
          </a>
        </motion.div>
      </div>
    </section>
  );
}
