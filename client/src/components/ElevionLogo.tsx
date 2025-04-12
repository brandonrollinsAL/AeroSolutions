import React from 'react';
import { motion } from 'framer-motion';

interface ElevionLogoProps {
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

const ElevionLogo: React.FC<ElevionLogoProps> = ({ 
  size = 'md', 
  animated = false,
  className = '' 
}) => {
  // Size mappings
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };
  
  // Animation variants
  const variants = {
    initial: { scale: 0.9, opacity: 0.5 },
    animate: { scale: 1, opacity: 1 },
    hover: { scale: 1.05, rotate: 5 }
  };
  
  // If animated, use motion.div, otherwise use regular div
  const Component = animated ? motion.div : 'div';
  
  // Props to pass to motion component
  const motionProps = animated ? {
    initial: 'initial',
    animate: 'animate',
    whileHover: 'hover',
    variants,
    transition: { duration: 0.3 }
  } : {};

  return (
    <Component 
      className={`${sizeMap[size]} ${className} relative flex items-center justify-center`}
      {...motionProps}
    >
      <svg 
        viewBox="0 0 100 100" 
        xmlns="http://www.w3.org/2000/svg" 
        className="w-full h-full"
        aria-label="Elevion Logo"
      >
        {/* Main hexagon shape */}
        <polygon 
          points="50,10 90,30 90,70 50,90 10,70 10,30" 
          fill="url(#elevionGradient)" 
        />
        
        {/* Letter E stylized */}
        <path 
          d="M35,30 H65 V38 H43 V46 H60 V54 H43 V62 H65 V70 H35 Z" 
          fill="white" 
        />
        
        {/* Decorative dots representing digital/web elements */}
        <circle cx="25" cy="30" r="3" fill="#00D1D1" />
        <circle cx="75" cy="30" r="3" fill="#00D1D1" />
        <circle cx="25" cy="70" r="3" fill="#00D1D1" />
        <circle cx="75" cy="70" r="3" fill="#00D1D1" />
        
        {/* Define gradient */}
        <defs>
          <linearGradient id="elevionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B5B9D" /> {/* slate-blue */}
            <stop offset="100%" stopColor="#00D1D1" /> {/* electric-cyan */}
          </linearGradient>
        </defs>
      </svg>
    </Component>
  );
};

export default ElevionLogo;