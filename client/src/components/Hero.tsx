import { motion } from "framer-motion";
import { FaCode, FaPlane, FaHandshake, FaClock } from "react-icons/fa";
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
    <section id="home" className="pt-28 pb-20 bg-gradient-to-br from-primary via-primary/95 to-primary/80 relative overflow-hidden">
      <div 
        className="absolute inset-0 opacity-20" 
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80')", 
          backgroundSize: "cover", 
          backgroundPosition: "center"
        }}
      />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="text-white">
            <motion.h1 
              className="text-4xl lg:text-5xl font-bold font-montserrat leading-tight"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              Aero Solutions: Elevating Your Software to New Heights
            </motion.h1>
            
            <motion.p 
              className="mt-6 text-xl text-gray-200"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              Full-stack development for aviation and technology—no payment until you're satisfied.
            </motion.p>
            
            <motion.p 
              className="mt-4 text-gray-300"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              custom={2}
            >
              Aero Solutions is a Miami-based software development company specializing in custom solutions from start to finish. We own innovative platforms like AeroSync, AeroFlight, and Converture, and offer unparalleled services with a unique promise: no upfront costs, just results.
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
              >
                Get Started
              </a>
              <a 
                href="#platforms" 
                className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-lg border border-white/20 transition-all duration-300 hover:scale-105"
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
            <img 
              src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80" 
              alt="Aviation technology interface" 
              className="rounded-lg shadow-2xl transform -rotate-2 hover:rotate-0 transition-all duration-500 max-h-[500px] object-cover w-full" 
              loading="lazy"
            />
          </motion.div>
        </div>
        
        <motion.div 
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          custom={4}
        >
          <div className="p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="text-highlight text-3xl mb-2"><FaCode /></div>
            <h3 className="font-semibold font-montserrat">Full-Stack Development</h3>
          </div>
          <div className="p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="text-highlight text-3xl mb-2"><FaPlane /></div>
            <h3 className="font-semibold font-montserrat">Aviation Expertise</h3>
          </div>
          <div className="p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="text-highlight text-3xl mb-2"><FaHandshake /></div>
            <h3 className="font-semibold font-montserrat">Pay After Satisfaction</h3>
          </div>
          <div className="p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="text-highlight text-3xl mb-2"><FaClock /></div>
            <h3 className="font-semibold font-montserrat">Ongoing Support</h3>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
