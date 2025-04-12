import { motion } from "framer-motion";
import { FaCode, FaLaptop, FaHandshake, FaClock, FaDesktop, FaUsers, FaLaptopCode, FaShieldAlt, FaMobileAlt, FaStore } from "react-icons/fa";
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
      className="pt-32 pb-24 bg-gradient-to-br from-slate-blue via-electric-cyan/20 to-slate-blue/80 relative overflow-hidden"
      aria-label="Elevion Introduction"
    >
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-5" 
        style={{
          backgroundImage: "url('data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h10v10H0zm10 20h10v10H10zM0 40h10v10H0zm30-20h10v10H30zm20-20h10v10H50z' fill='%2300D1D1' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E')", 
          backgroundSize: "60px 60px", 
          backgroundPosition: "center"
        }}
        aria-hidden="true"
      />
      
      {/* Subtle overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-blue/10 z-0"></div>
      
      {/* Cyan accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-electric-cyan via-light-gray to-electric-cyan"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="text-white">
            <motion.div 
              className="inline-block mb-4 px-3 py-1 bg-electric-cyan/10 border border-electric-cyan/20 rounded-full"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              <span className="text-electric-cyan text-sm font-medium tracking-wider uppercase font-inter">Premium Web Solutions</span>
            </motion.div>
            
            <motion.h1 
              className="text-5xl lg:text-6xl font-bold font-poppins leading-tight text-white tracking-tight"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              Web <span className="text-electric-cyan">Development</span> for Small Businesses
            </motion.h1>
            
            <motion.p 
              className="mt-8 text-xl text-light-gray leading-relaxed font-lato"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              custom={2}
            >
              Custom web solutions that transform your online presence—WebCraft, EcomPro, ContentHub, and more.
            </motion.p>
            
            <motion.p 
              className="mt-5 text-lg text-gray-200 leading-relaxed font-lato"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              custom={3}
            >
              <span className="font-semibold">Elevion</span> delivers full-stack web development with our unique guarantee: no payment until you're 100% satisfied. Based in Miami and built by developers who understand your business challenges, our platforms integrate seamlessly with your existing systems.
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
                className="bg-electric-cyan hover:bg-electric-cyan/90 text-slate-blue font-bold py-4 px-8 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_5px_15px_rgba(0,209,209,0.35)] font-inter"
                aria-label="Get started with a custom web development solution"
              >
                Get Started
              </a>
              <a 
                href="#platforms" 
                className="bg-transparent hover:bg-white/10 text-white font-semibold py-4 px-8 rounded-lg border border-electric-cyan/30 transition-all duration-300 hover:scale-105 hover:border-electric-cyan/60 font-inter"
                aria-label="Explore our web development platforms"
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
            {/* Web development image */}
            <div className="relative overflow-hidden rounded-lg shadow-2xl transform rotate-2 hover:rotate-0 transition-all duration-500 max-h-[500px] h-[500px] w-full bg-gradient-to-br from-slate-blue/50 to-electric-cyan/30 p-1">
              <div className="absolute inset-0 bg-black/40 rounded-lg backdrop-blur-sm z-10"></div>
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="text-center p-8">
                  <div className="text-9xl text-electric-cyan mb-6">E</div>
                  <div className="text-2xl text-white font-poppins font-bold tracking-wider mb-4">ELEVION</div>
                  <div className="text-light-gray font-lato">Web Development Excellence</div>
                </div>
              </div>
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
          <div className="p-6 rounded-xl bg-gradient-to-br from-slate-blue/70 to-electric-cyan/20 backdrop-blur-md border border-electric-cyan/20 shadow-lg hover:shadow-electric-cyan/10 hover:border-electric-cyan/30 transition-all duration-300 transform hover:-translate-y-1" role="listitem">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-blue border border-electric-cyan/30 text-electric-cyan text-2xl mb-4 mx-auto shadow-inner" aria-hidden="true">
              <FaLaptopCode />
            </div>
            <h2 className="font-bold font-poppins text-xl text-light-gray mb-2">Full-Stack Web Development</h2>
            <p className="text-sm text-gray-200 leading-relaxed font-lato">End-to-end custom solutions built for online excellence</p>
          </div>
          
          <div className="p-6 rounded-xl bg-gradient-to-br from-slate-blue/70 to-electric-cyan/20 backdrop-blur-md border border-electric-cyan/20 shadow-lg hover:shadow-electric-cyan/10 hover:border-electric-cyan/30 transition-all duration-300 transform hover:-translate-y-1" role="listitem">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-blue border border-electric-cyan/30 text-electric-cyan text-2xl mb-4 mx-auto shadow-inner" aria-hidden="true">
              <FaDesktop />
            </div>
            <h2 className="font-bold font-poppins text-xl text-light-gray mb-2">Website Design</h2>
            <p className="text-sm text-gray-200 leading-relaxed font-lato">Beautiful responsive websites for small businesses</p>
          </div>
          
          <div className="p-6 rounded-xl bg-gradient-to-br from-slate-blue/70 to-electric-cyan/20 backdrop-blur-md border border-electric-cyan/20 shadow-lg hover:shadow-electric-cyan/10 hover:border-electric-cyan/30 transition-all duration-300 transform hover:-translate-y-1" role="listitem">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-blue border border-electric-cyan/30 text-electric-cyan text-2xl mb-4 mx-auto shadow-inner" aria-hidden="true">
              <FaHandshake />
            </div>
            <h2 className="font-bold font-poppins text-xl text-light-gray mb-2">No Payment Until Satisfied</h2>
            <p className="text-sm text-gray-200 leading-relaxed font-lato">Zero financial risk with our satisfaction guarantee</p>
          </div>
          
          <div className="p-6 rounded-xl bg-gradient-to-br from-slate-blue/70 to-electric-cyan/20 backdrop-blur-md border border-electric-cyan/20 shadow-lg hover:shadow-electric-cyan/10 hover:border-electric-cyan/30 transition-all duration-300 transform hover:-translate-y-1" role="listitem">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-blue border border-electric-cyan/30 text-electric-cyan text-2xl mb-4 mx-auto shadow-inner" aria-hidden="true">
              <FaStore />
            </div>
            <h2 className="font-bold font-poppins text-xl text-light-gray mb-2">Five Integrated Platforms</h2>
            <p className="text-sm text-gray-200 leading-relaxed font-lato">Comprehensive web ecosystem for all your needs</p>
          </div>
          
          {/* Additional features in a hidden section for SEO content */}
          <div className="sr-only">
            <h2>WebCraft Platform</h2>
            <p>Professional website design and development for small businesses</p>
            
            <h2>EcomPro System</h2>
            <p>Advanced e-commerce solutions for online sales</p>
            
            <h2>ContentHub Management</h2>
            <p>Content management systems for easy website updates</p>
            
            <h2>AnalyticEdge Solution</h2>
            <p>Data analytics and business intelligence for growth</p>
            
            <h2>AppForge Platform</h2>
            <p>Mobile app development for expanded customer reach</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
