import { useState } from "react";
import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";
import { Platform } from "@/lib/types";
import PlatformDetailModal from "./PlatformDetailModal";

export default function Platforms() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  
  const platforms: Platform[] = [
    {
      id: 1,
      name: "WebCraft",
      description: "Professional website design and development for small businesses with responsive layouts.",
      image: "/images/aviation-cockpit.jpeg",
      tags: ["Web Design", "Responsive", "Small Business"]
    },
    {
      id: 2,
      name: "EcomPro",
      description: "Complete e-commerce solution for online stores with payment processing and inventory management.",
      image: "/images/aviation-tech.jpeg",
      tags: ["E-commerce", "Online Store", "Sales"]
    },
    {
      id: 3,
      name: "ContentHub",
      description: "Content management system allowing easy updates and publishing for non-technical users.",
      image: "/images/aviation-controls.jpeg",
      tags: ["CMS", "Content", "Publishing"]
    },
    {
      id: 4,
      name: "AnalyticEdge",
      description: "Business intelligence dashboard with visitor tracking and performance monitoring.",
      image: "/images/aviation-cockpit.jpeg",
      tags: ["Analytics", "Business Intelligence", "Reporting"]
    },
    {
      id: 5,
      name: "AppForge",
      description: "Mobile app development platform for iOS and Android with seamless website integration.",
      image: "/images/aviation-tech.jpeg",
      tags: ["Mobile Apps", "iOS", "Android"]
    },
    {
      id: 6,
      name: "IntegrateX",
      description: "API integration platform connecting your website with third-party services and tools.",
      image: "/images/aviation-controls.jpeg",
      tags: ["API", "Integration", "Automation"]
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
  
  const handleLearnMore = (platform: Platform) => {
    setSelectedPlatform(platform);
  };

  return (
    <section id="platforms" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeIn}
          custom={0}
        >
          <h2 className="text-3xl font-bold font-montserrat text-primary mb-4">Our Platforms</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Innovative solutions we've developed to transform your online presence and business growth.</p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {platforms.map((platform, index) => (
            <motion.div 
              key={platform.id}
              className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={fadeIn}
              custom={index + 1}
            >
              <div className="h-48 overflow-hidden relative bg-gray-100">
                {/* Low-quality image placeholder */}
                <div 
                  className="absolute inset-0 bg-cover bg-center blur-sm scale-105 transition-opacity duration-300 opacity-100"
                  style={{
                    backgroundImage: `url("${platform.image.replace('.jpeg', '-tiny.jpeg')}")`,
                  }}
                  aria-hidden="true"
                />
                {/* Optimized image loading with WebP format */}
                <img 
                  src={platform.image} 
                  alt={`${platform.name} platform`} 
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105 relative z-10" 
                  loading="lazy"
                  width="400"
                  height="250"
                  decoding="async"
                  onLoad={(e) => {
                    // Hide placeholder when the main image loads
                    const target = e.target as HTMLImageElement;
                    if (target.parentElement) {
                      const placeholder = target.parentElement.querySelector('div');
                      if (placeholder) {
                        placeholder.classList.add('opacity-0');
                      }
                    }
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/images/avatar-placeholder.jpeg"; // Fallback image
                  }}
                />
                {/* Visual indicator while loading */}
                <div className="absolute inset-0 flex items-center justify-center z-0">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold font-montserrat text-primary mb-2">{platform.name}</h3>
                <p className="text-gray-600 mb-4">{platform.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {platform.tags.map((tag, idx) => (
                    <span key={idx} className="bg-gray-100 text-luxury text-xs font-semibold px-3 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <button 
                  onClick={() => handleLearnMore(platform)}
                  className="inline-flex items-center text-luxury font-semibold hover:underline"
                >
                  Learn more
                  <FaArrowRight className="ml-2" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
        
        <motion.div 
          className="mt-16 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeIn}
          custom={8}
        >
          <a href="#contact" className="inline-block bg-black hover:bg-black/90 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg">
            Get Custom Platform Development
          </a>
        </motion.div>
      </div>
      
      {/* Platform Detail Modal */}
      <PlatformDetailModal 
        platform={selectedPlatform} 
        isOpen={!!selectedPlatform} 
        onClose={() => setSelectedPlatform(null)} 
      />
    </section>
  );
}
