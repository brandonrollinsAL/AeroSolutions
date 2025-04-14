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
            <motion.div 
              className="relative overflow-hidden rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] max-h-[550px] h-[550px] w-full perspective-1000 transform hover:scale-105 transition-all duration-700"
              initial={{ rotateY: 10, rotateX: -10 }}
              animate={{ 
                rotateY: [10, -10, 10], 
                rotateX: [-10, 10, -10],
                z: [0, 30, 0]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 15, 
                ease: "easeInOut" 
              }}
            >
              {/* 3D hexagonal backdrop */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-blue via-slate-blue/80 to-electric-cyan/20 z-10 rounded-xl">
                {/* Geometric accent lines */}
                <div className="absolute w-full h-full">
                  <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div 
                        key={`line-${i}`} 
                        className="absolute h-[1px] bg-electric-cyan"
                        style={{ 
                          width: `${Math.random() * 100}%`, 
                          top: `${Math.random() * 100}%`, 
                          left: `${Math.random() * 100}%`,
                          transform: `rotate(${Math.random() * 360}deg)`,
                          opacity: Math.random() * 0.8 + 0.2
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Glowing orbs */}
                <div className="absolute top-1/4 left-1/4 w-4 h-4 rounded-full bg-electric-cyan blur-md animate-pulse"></div>
                <div className="absolute bottom-1/3 right-1/3 w-6 h-6 rounded-full bg-electric-cyan blur-md animate-pulse" style={{ animationDelay: '1.5s' }}></div>
                <div className="absolute top-1/2 right-1/4 w-3 h-3 rounded-full bg-sunset-orange/80 blur-sm animate-pulse" style={{ animationDelay: '2.3s' }}></div>
                <div className="absolute bottom-1/4 left-1/3 w-5 h-5 rounded-full bg-sunset-orange/70 blur-md animate-pulse" style={{ animationDelay: '0.7s' }}></div>
              </div>
              
              {/* Holographic shine overlay */}
              <div className="absolute inset-0 opacity-20 z-20 bg-gradient-to-tr from-transparent via-white/30 to-transparent rounded-xl"></div>
              
              {/* 3D Logo Effect */}
              <div className="absolute inset-0 flex items-center justify-center z-30">
                <motion.div 
                  className="text-center p-8 relative z-10 flex flex-col items-center justify-center"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                >
                  {/* 3D 'E' with shadow effect */}
                  <div className="relative mb-6">
                    <motion.div
                      initial={{ rotateY: 0 }}
                      animate={{ rotateY: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="w-40 h-40 bg-gradient-to-br from-electric-cyan to-slate-blue rounded-xl flex items-center justify-center transform rotate-45 origin-center shadow-[0_10px_30px_rgba(0,209,209,0.4)]"
                    >
                      <div className="transform -rotate-45 text-9xl font-bold text-white">E</div>
                    </motion.div>
                    {/* Digital circuit lines */}
                    {Array.from({ length: 6 }).map((_, i) => (
                      <motion.div 
                        key={`circuit-${i}`}
                        className="absolute bg-electric-cyan h-[2px]"
                        style={{ 
                          width: `${10 + Math.random() * 30}px`, 
                          top: `${Math.random() * 100}%`, 
                          left: i % 2 === 0 ? '100%' : 'auto',
                          right: i % 2 !== 0 ? '100%' : 'auto',
                        }}
                        animate={{ 
                          width: [`${10 + Math.random() * 30}px`, `${40 + Math.random() * 60}px`, `${10 + Math.random() * 30}px`],
                          opacity: [0.4, 1, 0.4]
                        }}
                        transition={{ 
                          duration: 3 + Math.random() * 2, 
                          repeat: Infinity, 
                          ease: "easeInOut", 
                          delay: Math.random() * 2
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Company name with glow effect */}
                  <motion.div 
                    className="text-3xl text-white font-poppins font-bold tracking-widest mb-6 relative"
                    animate={{ textShadow: ['0 0 5px rgba(0,209,209,0.5)', '0 0 20px rgba(0,209,209,0.8)', '0 0 5px rgba(0,209,209,0.5)'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    ELEVION
                    <div className="absolute -bottom-2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-electric-cyan to-transparent"></div>
                  </motion.div>
                  
                  <div className="text-light-gray font-lato text-lg mb-8">Web Development Excellence</div>
                  
                  {/* Floating particles around button */}
                  <div className="relative">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <motion.div 
                        key={`particle-${i}`}
                        className="absolute w-1 h-1 rounded-full bg-electric-cyan opacity-70"
                        style={{ 
                          left: `${Math.random() * 100}%`, 
                          top: `${Math.random() * 100}%`,
                        }}
                        animate={{ 
                          x: [0, Math.random() * 60 - 30, 0], 
                          y: [0, Math.random() * 60 - 30, 0],
                          opacity: [0, 0.8, 0]
                        }}
                        transition={{ 
                          duration: 3 + Math.random() * 2, 
                          repeat: Infinity, 
                          ease: "easeInOut", 
                          delay: Math.random() * 2
                        }}
                      />
                    ))}
                    
                    {/* Tech Assistant Chat Button */}
                    <motion.button 
                      onClick={() => window.dispatchEvent(new CustomEvent('openTechAssistant'))}
                      className="bg-gradient-to-r from-electric-cyan/30 to-slate-blue/40 hover:from-electric-cyan/40 hover:to-slate-blue/50 text-white font-semibold py-3 px-8 rounded-xl backdrop-blur-sm border border-electric-cyan/40 transition-all duration-300 hover:scale-105 font-inter flex items-center justify-center gap-2 shadow-[0_5px_15px_rgba(0,209,209,0.25)] relative overflow-hidden group"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Button glow effect */}
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      
                      <FaLaptopCode className="text-electric-cyan text-lg" />
                      <span>Ask Tech Assistant</span>
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
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
