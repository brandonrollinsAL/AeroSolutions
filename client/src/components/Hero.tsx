import { motion } from "framer-motion";
import { FaCode, FaPlane, FaHandshake, FaClock, FaSync, FaUsers, FaLaptopCode, FaShieldAlt } from "react-icons/fa";
import { Link } from "wouter";

export default function Hero() {
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: custom * 0.2, duration: 0.6, ease: "easeOut" }
    })
  };
  
  const fadeInLeft = {
    hidden: { opacity: 0, x: 60 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { delay: 0.6, duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <section 
      id="home" 
      className="pt-28 pb-20 bg-gradient-to-br from-primary via-primary/95 to-primary/80 relative overflow-hidden"
      aria-label="Aero Solutions Introduction"
    >
      {/* Background Image with WebP format for better performance */}
      <div 
        className="absolute inset-0 opacity-20" 
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80&fm=webp')", 
          backgroundSize: "cover", 
          backgroundPosition: "center"
        }}
        aria-hidden="true"
      />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="text-white">
            <motion.h1 
              className="text-4xl lg:text-5xl font-bold font-montserrat leading-tight text-white"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              Aviation Software Development by Pilots for Pilots
            </motion.h1>
            
            <motion.p 
              className="mt-6 text-xl text-gray-100"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              Custom aviation platforms that transform flight operations—AeroSync, AeroFlight, AeroOps, and ExecSync.
            </motion.p>
            
            <motion.p 
              className="mt-4 text-gray-200"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              custom={2}
            >
              <span className="font-semibold">Aero Solutions</span> delivers full-stack aviation software with our unique guarantee: no payment until you're 100% satisfied. Based in Miami and built by pilots who understand your operational challenges, our platforms integrate seamlessly with your existing systems.
            </motion.p>
            
            <motion.div 
              className="mt-8 flex flex-wrap gap-4"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              custom={3}
            >
              <a 
                href="#contact" 
                className="bg-black hover:bg-black/90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
                aria-label="Get started with a custom aviation software solution"
              >
                Get Started
              </a>
              <a 
                href="#platforms" 
                className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-lg border border-white/20 transition-all duration-300 hover:scale-105"
                aria-label="Explore our aviation software platforms"
              >
                Explore Platforms
              </a>
            </motion.div>
          </div>
          
          <motion.div 
            className="hidden md:block"
            variants={fadeInLeft}
            initial="hidden"
            animate="visible"
          >
            {/* Optimized image with WebP and proper dimensions */}
            <picture>
              <source srcSet="https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80&fm=webp" type="image/webp" />
              <source srcSet="https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80" type="image/jpeg" />
              <img 
                src="https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80" 
                alt="Modern aviation cockpit display showing glass panel instruments" 
                className="rounded-lg shadow-2xl transform -rotate-2 hover:rotate-0 transition-all duration-500 max-h-[500px] object-cover w-full" 
                loading="lazy"
                width="1740"
                height="950"
              />
            </picture>
          </motion.div>
        </div>
        
        <motion.div 
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          custom={4}
        >
          <div className="p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10" role="listitem">
            <div className="text-highlight text-3xl mb-2 flex justify-center" aria-hidden="true"><FaLaptopCode /></div>
            <h2 className="font-semibold font-montserrat text-white">Full-Stack Aviation Development</h2>
            <p className="text-sm mt-2 text-gray-200">End-to-end custom solutions</p>
          </div>
          <div className="p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10" role="listitem">
            <div className="text-highlight text-3xl mb-2 flex justify-center" aria-hidden="true"><FaPlane /></div>
            <h2 className="font-semibold font-montserrat text-white">Built by Pilots</h2>
            <p className="text-sm mt-2 text-gray-200">Real aviation experience</p>
          </div>
          <div className="p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10" role="listitem">
            <div className="text-highlight text-3xl mb-2 flex justify-center" aria-hidden="true"><FaHandshake /></div>
            <h2 className="font-semibold font-montserrat text-white">No Payment Until Satisfied</h2>
            <p className="text-sm mt-2 text-gray-200">Zero financial risk</p>
          </div>
          <div className="p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10" role="listitem">
            <div className="text-highlight text-3xl mb-2 flex justify-center" aria-hidden="true"><FaSync /></div>
            <h2 className="font-semibold font-montserrat text-white">Four Integrated Platforms</h2>
            <p className="text-sm mt-2 text-gray-200">Comprehensive aviation ecosystem</p>
          </div>
          
          {/* Additional features in a hidden section for SEO content */}
          <div className="sr-only">
            <h2>AeroSync Platform</h2>
            <p>Comprehensive aviation data synchronization platform for streamlined operations</p>
            
            <h2>AeroFlight System</h2>
            <p>Advanced flight simulation and training platform for pilot proficiency</p>
            
            <h2>AeroOps Management</h2>
            <p>End-to-end aviation operations management platform for efficiency</p>
            
            <h2>ExecSync Solution</h2>
            <p>Executive productivity and communication platform for leadership</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
