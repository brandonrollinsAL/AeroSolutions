import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";
import { FaCode, FaLaptop, FaHandshake, FaClock, FaDesktop, FaUsers, FaLaptopCode, FaShieldAlt, FaMobileAlt, FaStore } from "react-icons/fa";
import { Link } from "wouter";
import { useState, useEffect } from "react";

export default function Hero() {
  // Auto-rotation state
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  
  // Motion values for user controlled rotation
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Transform mouse position to rotation values with dampening
  const rotateY = useTransform(mouseX, [-200, 200], [60, -60]);
  const rotateX = useTransform(mouseY, [-200, 200], [-30, 30]);
  
  // Animation controls for auto-rotation
  const controls = useAnimation();
  
  // Handle click to toggle auto-rotation
  const handleCubeClick = () => {
    setIsAutoRotating(!isAutoRotating);
  };
  
  // Update auto-rotation based on state
  useEffect(() => {
    if (isAutoRotating) {
      controls.start({
        rotateY: 360,
        rotateX: [5, -5, 5],
        rotateZ: [2, -2, 2],
        transition: { 
          rotateY: { duration: 20, repeat: Infinity, ease: "linear" },
          rotateX: { duration: 8, repeat: Infinity, ease: "easeInOut" },
          rotateZ: { duration: 10, repeat: Infinity, ease: "easeInOut" }
        }
      });
    } else {
      controls.stop();
    }
  }, [isAutoRotating, controls]);
  
  // Mouse drag handler
  const handleDrag = (event: any, info: any) => {
    if (!isAutoRotating) {
      mouseX.set(info.offset.x);
      mouseY.set(info.offset.y);
    }
  };
  
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
                  {/* Fully 3D 'E' with advanced effects */}
                  <div className="relative mb-6" style={{ perspective: "1000px" }}>
                    <motion.div
                      className="w-48 h-48 relative cursor-pointer"
                      style={{ 
                        transformStyle: "preserve-3d",
                        rotate: isAutoRotating ? undefined : `${rotateX.get()}deg ${rotateY.get()}deg 0deg`
                      }}
                      initial={{ rotateY: 0 }}
                      animate={controls}
                      drag={!isAutoRotating}
                      dragConstraints={{ top: -100, left: -100, right: 100, bottom: 100 }}
                      dragElastic={0.2}
                      whileTap={{ scale: 1.1 }}
                      onDragEnd={handleDrag}
                      onClick={handleCubeClick}
                    >
                      {/* Main E face - front */}
                      <div className="absolute inset-0 bg-gradient-to-br from-electric-cyan to-slate-blue shadow-[0_10px_30px_rgba(0,209,209,0.4)] flex items-center justify-center rounded-xl z-10"
                           style={{ transformStyle: "preserve-3d" }}>
                        <div className="relative flex items-center justify-center h-full w-full" 
                             style={{ transform: "translateZ(2px)" }}>
                          {/* Stylish E logo */}
                          <div className="relative w-32 h-32">
                            {/* Outer circle */}
                            <div className="absolute inset-0 rounded-full border-4 border-white opacity-80 shadow-lg"></div>
                            
                            {/* Inner circle with glow */}
                            <div className="absolute inset-2 rounded-full bg-electric-cyan/20 border border-white/50 shadow-[0_0_15px_rgba(0,209,209,0.6)]"></div>
                            
                            {/* E letter */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <div className="w-16 h-1.5 bg-white rounded-full shadow-md mb-1"></div>
                              <div className="w-12 h-1.5 bg-white rounded-full shadow-md mb-1"></div>
                              <div className="w-14 h-1.5 bg-white rounded-full shadow-md mb-1"></div>
                              <div className="w-12 h-1.5 bg-white rounded-full shadow-md mb-1"></div>
                              <div className="w-16 h-1.5 bg-white rounded-full shadow-md"></div>
                            </div>
                            
                            {/* Accent dots */}
                            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-sunset-orange/90 animate-pulse"></div>
                            <div className="absolute bottom-3 left-3 w-2 h-2 rounded-full bg-electric-cyan animate-pulse" style={{ animationDelay: "1s" }}></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right side */}
                      <div className="absolute inset-0 w-full h-full bg-electric-cyan/80 rounded-xl flex items-center justify-center"
                           style={{ 
                             transform: "rotateY(90deg) translateZ(24px)",
                             transformOrigin: "right"
                           }}>
                        {/* Right side E Logo */}
                        <div className="relative w-28 h-28 rotate-12">
                          {/* Outer circle */}
                          <div className="absolute inset-0 rounded-full border-3 border-white opacity-70 shadow-lg"></div>
                          
                          {/* Inner circle with glow */}
                          <div className="absolute inset-2 rounded-full bg-white/10 border border-white/40 shadow-[0_0_10px_rgba(255,255,255,0.4)]"></div>
                          
                          {/* E letter */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="w-14 h-1 bg-white rounded-full shadow-md mb-1"></div>
                            <div className="w-10 h-1 bg-white rounded-full shadow-md mb-1"></div>
                            <div className="w-12 h-1 bg-white rounded-full shadow-md mb-1"></div>
                            <div className="w-10 h-1 bg-white rounded-full shadow-md mb-1"></div>
                            <div className="w-14 h-1 bg-white rounded-full shadow-md"></div>
                          </div>
                          
                          {/* Accent dot */}
                          <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-sunset-orange/90 animate-pulse"></div>
                        </div>
                      </div>
                      
                      {/* Left side */}
                      <div className="absolute inset-0 w-full h-full bg-slate-blue rounded-xl flex items-center justify-center"
                           style={{ 
                             transform: "rotateY(-90deg) translateZ(24px)",
                             transformOrigin: "left"
                           }}>
                        {/* Left side E Logo */}
                        <div className="relative w-28 h-28 -rotate-12">
                          {/* Outer circle */}
                          <div className="absolute inset-0 rounded-full border-3 border-white opacity-70 shadow-lg"></div>
                          
                          {/* Inner circle with glow */}
                          <div className="absolute inset-2 rounded-full bg-white/10 border border-white/40 shadow-[0_0_10px_rgba(255,255,255,0.4)]"></div>
                          
                          {/* E letter */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="w-14 h-1 bg-white rounded-full shadow-md mb-1"></div>
                            <div className="w-10 h-1 bg-white rounded-full shadow-md mb-1"></div>
                            <div className="w-12 h-1 bg-white rounded-full shadow-md mb-1"></div>
                            <div className="w-10 h-1 bg-white rounded-full shadow-md mb-1"></div>
                            <div className="w-14 h-1 bg-white rounded-full shadow-md"></div>
                          </div>
                          
                          {/* Accent dot */}
                          <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-electric-cyan/90 animate-pulse"></div>
                        </div>
                      </div>
                      
                      {/* Top side */}
                      <div className="absolute inset-0 w-full h-full bg-slate-blue/60 rounded-xl flex items-center justify-center"
                           style={{ 
                             transform: "rotateX(90deg) translateZ(24px)",
                             transformOrigin: "top"
                           }}>
                        {/* Top side E Logo */}
                        <div className="relative w-28 h-28 rotate-45">
                          {/* Outer circle */}
                          <div className="absolute inset-0 rounded-full border-2 border-white opacity-60 shadow-lg"></div>
                          
                          {/* Inner circle with glow */}
                          <div className="absolute inset-2 rounded-full bg-white/10 border border-white/30 shadow-[0_0_8px_rgba(255,255,255,0.3)]"></div>
                          
                          {/* E letter */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="w-12 h-0.5 bg-white/90 rounded-full shadow-md mb-1"></div>
                            <div className="w-8 h-0.5 bg-white/90 rounded-full shadow-md mb-1"></div>
                            <div className="w-10 h-0.5 bg-white/90 rounded-full shadow-md mb-1"></div>
                            <div className="w-8 h-0.5 bg-white/90 rounded-full shadow-md mb-1"></div>
                            <div className="w-12 h-0.5 bg-white/90 rounded-full shadow-md"></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Bottom side */}
                      <div className="absolute inset-0 w-full h-full bg-electric-cyan/60 rounded-xl flex items-center justify-center"
                           style={{ 
                             transform: "rotateX(-90deg) translateZ(24px)",
                             transformOrigin: "bottom"
                           }}>
                        {/* Bottom side E Logo */}
                        <div className="relative w-28 h-28 -rotate-45">
                          {/* Outer circle */}
                          <div className="absolute inset-0 rounded-full border-2 border-white opacity-60 shadow-lg"></div>
                          
                          {/* Inner circle with glow */}
                          <div className="absolute inset-2 rounded-full bg-white/10 border border-white/30 shadow-[0_0_8px_rgba(255,255,255,0.3)]"></div>
                          
                          {/* E letter */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="w-12 h-0.5 bg-white/90 rounded-full shadow-md mb-1"></div>
                            <div className="w-8 h-0.5 bg-white/90 rounded-full shadow-md mb-1"></div>
                            <div className="w-10 h-0.5 bg-white/90 rounded-full shadow-md mb-1"></div>
                            <div className="w-8 h-0.5 bg-white/90 rounded-full shadow-md mb-1"></div>
                            <div className="w-12 h-0.5 bg-white/90 rounded-full shadow-md"></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Back side - E logo */}
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-blue to-electric-cyan/80 rounded-xl flex items-center justify-center"
                           style={{ 
                             transform: "rotateY(180deg) translateZ(24px)",
                             transformOrigin: "center"
                           }}>
                        {/* Back side E Logo */}
                        <div className="relative w-32 h-32">
                          {/* Outer circle */}
                          <div className="absolute inset-0 rounded-full border-4 border-white opacity-80 shadow-lg"></div>
                          
                          {/* Inner circle with glow */}
                          <div className="absolute inset-2 rounded-full bg-electric-cyan/20 border border-white/50 shadow-[0_0_15px_rgba(0,209,209,0.6)]"></div>
                          
                          {/* E letter */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="w-16 h-1.5 bg-white rounded-full shadow-md mb-1"></div>
                            <div className="w-12 h-1.5 bg-white rounded-full shadow-md mb-1"></div>
                            <div className="w-14 h-1.5 bg-white rounded-full shadow-md mb-1"></div>
                            <div className="w-12 h-1.5 bg-white rounded-full shadow-md mb-1"></div>
                            <div className="w-16 h-1.5 bg-white rounded-full shadow-md"></div>
                          </div>
                          
                          {/* Accent dots */}
                          <div className="absolute bottom-3 right-3 w-2 h-2 rounded-full bg-sunset-orange/90 animate-pulse"></div>
                          <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-electric-cyan animate-pulse" style={{ animationDelay: "1s" }}></div>
                        </div>
                      </div>
                      
                      {/* Inner light glow */}
                      <div className="absolute inset-0 bg-white/20 rounded-xl filter blur-lg animate-pulse"
                           style={{ transform: "translateZ(-10px)" }}></div>
                      
                      {/* Reflective shine overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-xl opacity-50"
                           style={{ transform: "translateZ(3px)" }}></div>
                      
                      {/* Edge highlights */}
                      <div className="absolute inset-0 rounded-xl border-2 border-white/20"
                           style={{ transform: "translateZ(1px)" }}></div>
                      
                      {/* User instructions */}
                      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-slate-900/80 text-electric-cyan text-xs px-3 py-1 rounded-full border border-electric-cyan/30 whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
                        {isAutoRotating 
                          ? "Click to interact with cube" 
                          : "Drag to rotate • Click to auto-rotate"}
                      </div>
                    </motion.div>
                    
                    {/* Enhanced circuit lines with animations */}
                    <motion.div className="absolute -right-20 top-1/4 h-[2px] bg-electric-cyan" 
                      initial={{ width: 20, opacity: 0.4 }}
                      animate={{ 
                        width: [20, 80, 20],
                        opacity: [0.4, 1, 0.4],
                        boxShadow: ['0 0 2px rgba(0,209,209,0.5)', '0 0 8px rgba(0,209,209,0.8)', '0 0 2px rgba(0,209,209,0.5)']
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div className="absolute -left-20 top-1/3 h-[2px] bg-electric-cyan" 
                      initial={{ width: 15, opacity: 0.4 }}
                      animate={{ 
                        width: [15, 70, 15],
                        opacity: [0.4, 1, 0.4],
                        boxShadow: ['0 0 2px rgba(0,209,209,0.5)', '0 0 8px rgba(0,209,209,0.8)', '0 0 2px rgba(0,209,209,0.5)']
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    />
                    <motion.div className="absolute -right-20 top-1/2 h-[2px] bg-electric-cyan" 
                      initial={{ width: 25, opacity: 0.4 }}
                      animate={{ 
                        width: [25, 90, 25],
                        opacity: [0.4, 1, 0.4],
                        boxShadow: ['0 0 2px rgba(0,209,209,0.5)', '0 0 8px rgba(0,209,209,0.8)', '0 0 2px rgba(0,209,209,0.5)']
                      }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    />
                    <motion.div className="absolute -left-20 top-2/3 h-[2px] bg-electric-cyan" 
                      initial={{ width: 10, opacity: 0.4 }}
                      animate={{ 
                        width: [10, 60, 10],
                        opacity: [0.4, 1, 0.4],
                        boxShadow: ['0 0 2px rgba(0,209,209,0.5)', '0 0 8px rgba(0,209,209,0.8)', '0 0 2px rgba(0,209,209,0.5)']
                      }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                    />
                    <motion.div className="absolute -right-20 bottom-1/4 h-[2px] bg-electric-cyan" 
                      initial={{ width: 30, opacity: 0.4 }}
                      animate={{ 
                        width: [30, 100, 30],
                        opacity: [0.4, 1, 0.4],
                        boxShadow: ['0 0 2px rgba(0,209,209,0.5)', '0 0 8px rgba(0,209,209,0.8)', '0 0 2px rgba(0,209,209,0.5)']
                      }}
                      transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    />
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
                    <motion.div 
                      className="absolute w-1 h-1 rounded-full bg-electric-cyan opacity-70"
                      style={{ left: "20%", top: "30%" }}
                      animate={{ 
                        x: [0, 15, 0], 
                        y: [0, -20, 0],
                        opacity: [0, 0.8, 0]
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity, 
                        ease: "easeInOut"
                      }}
                    />
                    <motion.div 
                      className="absolute w-1 h-1 rounded-full bg-electric-cyan opacity-70"
                      style={{ left: "70%", top: "20%" }}
                      animate={{ 
                        x: [0, -20, 0], 
                        y: [0, 15, 0],
                        opacity: [0, 0.8, 0]
                      }}
                      transition={{ 
                        duration: 4, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        delay: 1
                      }}
                    />
                    <motion.div 
                      className="absolute w-1 h-1 rounded-full bg-electric-cyan opacity-70"
                      style={{ left: "80%", top: "70%" }}
                      animate={{ 
                        x: [0, -10, 0], 
                        y: [0, -15, 0],
                        opacity: [0, 0.8, 0]
                      }}
                      transition={{ 
                        duration: 3.5, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        delay: 0.5
                      }}
                    />
                    <motion.div 
                      className="absolute w-1 h-1 rounded-full bg-electric-cyan opacity-70"
                      style={{ left: "30%", top: "80%" }}
                      animate={{ 
                        x: [0, 25, 0], 
                        y: [0, 5, 0],
                        opacity: [0, 0.8, 0]
                      }}
                      transition={{ 
                        duration: 4.5, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        delay: 1.5
                      }}
                    />
                    
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
