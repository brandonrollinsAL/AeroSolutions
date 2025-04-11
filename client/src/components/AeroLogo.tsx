import React from 'react';
import { motion } from 'framer-motion';

interface AeroLogoProps {
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

const AeroLogo: React.FC<AeroLogoProps> = ({ 
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
        aria-label="Aero Solutions Logo"
      >
        {/* Main circular background */}
        <circle cx="50" cy="50" r="45" fill="#1E40AF" />
        
        {/* Inner circular gradient */}
        <circle cx="50" cy="50" r="40" fill="url(#aeroGradient)" />
        
        {/* Airplane silhouette */}
        <path 
          d="M75 50 L50 25 L25 50 L50 65 Z" 
          fill="white" 
          stroke="#EAB308"
          strokeWidth="1.5"
        />
        
        {/* Flight path lines */}
        <path 
          d="M30 65 Q50 75 70 65" 
          fill="none" 
          stroke="white" 
          strokeWidth="1.5" 
          strokeDasharray="2 2"
        />
        
        {/* Winglets */}
        <path 
          d="M42 52 L35 58 M58 52 L65 58" 
          stroke="white" 
          strokeWidth="1.5"
        />
        
        {/* Define gradient */}
        <defs>
          <linearGradient id="aeroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E40AF" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
      </svg>
    </Component>
  );
};

export default AeroLogo;