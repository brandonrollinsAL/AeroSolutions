import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";
import { Platform } from "@/lib/types";

export default function Platforms() {
  const platforms: Platform[] = [
    {
      id: 1,
      name: "AeroSync",
      description: "Streamline aviation logistics with real-time syncing across all your operations.",
      image: "https://images.unsplash.com/photo-1559023994-0e8a395896f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80",
      tags: ["Real-time", "Logistics", "Aviation"]
    },
    {
      id: 2,
      name: "AeroFlight",
      description: "Comprehensive flight management system for private and commercial aviation.",
      image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80",
      tags: ["Flight Management", "Scheduling", "Analytics"]
    },
    {
      id: 3,
      name: "ExecSync",
      description: "Executive aviation management solution for private jet operations and charter services.",
      image: "https://images.unsplash.com/photo-1581092787765-e941def3bff7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      tags: ["Executive", "Private Jets", "Management"]
    },
    {
      id: 4,
      name: "SkyForge Legend",
      description: "Aviation training and simulation platform for pilots and ground crew.",
      image: "https://images.unsplash.com/photo-1531951657915-959c8141f265?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      tags: ["Training", "Simulation", "Education"]
    },
    {
      id: 5,
      name: "Stitchlet",
      description: "AI-powered data integration platform connecting disparate aviation systems.",
      image: "https://images.unsplash.com/photo-1576153192396-180ecef2a715?ixlib=rb-4.0.3&auto=format&fit=crop&w=1974&q=80",
      tags: ["Data Integration", "AI", "Automation"]
    },
    {
      id: 6,
      name: "AeroOps",
      description: "Comprehensive operations management system for airlines and aviation businesses.",
      image: "https://images.unsplash.com/photo-1626624340240-aadc087dd96c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      tags: ["Operations", "Management", "Efficiency"]
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
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Innovative solutions we've developed to transform the aviation and technology landscape.</p>
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
              <div className="h-48 overflow-hidden">
                <img 
                  src={platform.image} 
                  alt={`${platform.name} platform`} 
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold font-montserrat text-primary mb-2">{platform.name}</h3>
                <p className="text-gray-600 mb-4">{platform.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {platform.tags.map((tag, idx) => (
                    <span key={idx} className="bg-blue-100 text-primary text-xs font-semibold px-3 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <a href="#" className="inline-flex items-center text-accent font-semibold hover:underline">
                  Learn more
                  <FaArrowRight className="ml-2" />
                </a>
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
          <a href="#contact" className="inline-block bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg">
            Get Custom Platform Development
          </a>
        </motion.div>
      </div>
    </section>
  );
}
