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
      className="pt-32 pb-24 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900/90 relative overflow-hidden"
      aria-label="Aero Solutions Introduction"
    >
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-10" 
        style={{
          backgroundImage: "url('/images/aviation-cockpit.jpeg')", 
          backgroundSize: "cover", 
          backgroundPosition: "center",
          filter: "contrast(1.2) brightness(0.8)"
        }}
        aria-hidden="true"
      />
      
      {/* Subtle overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-900/30 z-0"></div>
      
      {/* Gold accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-300 via-yellow-600 to-amber-300"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="text-white">
            <motion.div 
              className="inline-block mb-4 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              <span className="text-amber-300 text-sm font-medium tracking-wider uppercase">Premium Aviation Solutions</span>
            </motion.div>
            
            <motion.h1 
              className="text-5xl lg:text-6xl font-bold font-serif leading-tight text-white tracking-tight"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              Aviation Software <span className="text-amber-300">Development</span> by Pilots for Pilots
            </motion.h1>
            
            <motion.p 
              className="mt-8 text-xl text-gray-200 leading-relaxed"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              custom={2}
            >
              Custom aviation platforms that transform flight operations—AeroSync, AeroFlight, AeroOps, and ExecSync.
            </motion.p>
            
            <motion.p 
              className="mt-5 text-lg text-gray-200 leading-relaxed"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              custom={3}
            >
              <span className="font-semibold">Aero Solutions</span> delivers full-stack aviation software with our unique guarantee: no payment until you're 100% satisfied. Based in Miami and built by pilots who understand your operational challenges, our platforms integrate seamlessly with your existing systems.
            </motion.p>
            
            <motion.div 
              className="mt-10 flex flex-wrap gap-5"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              custom={4}
            >
              <a 
                href="#contact" 
                className="bg-amber-400 hover:bg-amber-500 text-blue-900 font-bold py-4 px-8 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
                aria-label="Get started with a custom aviation software solution"
              >
                Get Started
              </a>
              <a 
                href="#platforms" 
                className="bg-transparent hover:bg-white/10 text-white font-semibold py-4 px-8 rounded-lg border border-amber-400/30 transition-all duration-300 hover:scale-105 hover:border-amber-400/60"
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
            {/* Aviation-specific image - simplified version */}
            <div className="relative overflow-hidden rounded-lg shadow-2xl transform -rotate-2 hover:rotate-0 transition-all duration-500 max-h-[500px] h-[500px] w-full">
              <img 
                src="/images/aviation-controls.jpeg" 
                alt="Advanced aviation flight controls and instruments" 
                className="h-full w-full object-cover" 
                loading="eager"
                width="1024"
                height="640"
              />
            </div>
          </motion.div>
        </div>
        
        <motion.div 
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          custom={5}
        >
          <div className="p-6 rounded-xl bg-gradient-to-br from-blue-900/70 to-blue-800/50 backdrop-blur-md border border-amber-400/20 shadow-lg hover:shadow-amber-400/10 hover:border-amber-400/30 transition-all duration-300 transform hover:-translate-y-1" role="listitem">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-900 border border-amber-400/30 text-amber-300 text-2xl mb-4 mx-auto shadow-inner" aria-hidden="true">
              <FaLaptopCode />
            </div>
            <h2 className="font-bold font-serif text-xl text-gray-100 mb-2">Full-Stack Aviation Development</h2>
            <p className="text-sm text-gray-200 leading-relaxed">End-to-end custom solutions built for aviation excellence</p>
          </div>
          
          <div className="p-6 rounded-xl bg-gradient-to-br from-blue-900/70 to-blue-800/50 backdrop-blur-md border border-amber-400/20 shadow-lg hover:shadow-amber-400/10 hover:border-amber-400/30 transition-all duration-300 transform hover:-translate-y-1" role="listitem">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-900 border border-amber-400/30 text-amber-300 text-2xl mb-4 mx-auto shadow-inner" aria-hidden="true">
              <FaPlane />
            </div>
            <h2 className="font-bold font-serif text-xl text-gray-100 mb-2">Built by Pilots</h2>
            <p className="text-sm text-gray-200 leading-relaxed">Real aviation experience integrated into every feature</p>
          </div>
          
          <div className="p-6 rounded-xl bg-gradient-to-br from-blue-900/70 to-blue-800/50 backdrop-blur-md border border-amber-400/20 shadow-lg hover:shadow-amber-400/10 hover:border-amber-400/30 transition-all duration-300 transform hover:-translate-y-1" role="listitem">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-900 border border-amber-400/30 text-amber-300 text-2xl mb-4 mx-auto shadow-inner" aria-hidden="true">
              <FaHandshake />
            </div>
            <h2 className="font-bold font-serif text-xl text-gray-100 mb-2">No Payment Until Satisfied</h2>
            <p className="text-sm text-gray-200 leading-relaxed">Zero financial risk with our satisfaction guarantee</p>
          </div>
          
          <div className="p-6 rounded-xl bg-gradient-to-br from-blue-900/70 to-blue-800/50 backdrop-blur-md border border-amber-400/20 shadow-lg hover:shadow-amber-400/10 hover:border-amber-400/30 transition-all duration-300 transform hover:-translate-y-1" role="listitem">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-900 border border-amber-400/30 text-amber-300 text-2xl mb-4 mx-auto shadow-inner" aria-hidden="true">
              <FaSync />
            </div>
            <h2 className="font-bold font-serif text-xl text-gray-100 mb-2">Four Integrated Platforms</h2>
            <p className="text-sm text-gray-200 leading-relaxed">Comprehensive aviation ecosystem for all your needs</p>
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
