import React from "react";
import { motion } from "framer-motion";

interface AeroLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
}

export default function AeroLogo({ size = "md", animated = true }: AeroLogoProps) {
  // Define sizes based on the size prop
  const sizes = {
    sm: { width: 28, height: 28 },
    md: { width: 32, height: 32 },
    lg: { width: 40, height: 40 },
    xl: { width: 48, height: 48 },
  };

  const { width, height } = sizes[size];

  // Animation variants
  const svgVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.5 } },
    hover: { scale: 1.05, rotate: 2 },
  };

  const pathVariants = {
    initial: { pathLength: 0, opacity: 0 },
    animate: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 1.5, ease: "easeInOut", delay: 0.2 }
    },
    hover: { scale: 1.02 }
  };

  const planeVariants = {
    initial: { x: -10, y: 5, opacity: 0 },
    animate: {
      x: 0,
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut", delay: 0.8 }
    },
    hover: { 
      x: [0, 2, 0], 
      y: [0, -2, 0],
      transition: { 
        duration: 1.5, 
        repeat: Infinity, 
        repeatType: "reverse" as const, 
        ease: "easeInOut" 
      }
    }
  };

  const circleVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut", delay: 0.4 }
    }
  };

  // Static SVG version
  if (!animated) {
    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle */}
        <circle cx="40" cy="40" r="32" fill="#1E3A8A" opacity="0.1" />
        
        {/* Main circular path */}
        <path
          d="M40 8C22.36 8 8 22.36 8 40C8 57.64 22.36 72 40 72C57.64 72 72 57.64 72 40C72 22.36 57.64 8 40 8Z"
          stroke="#1E3A8A"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Digital grid lines */}
        <path
          d="M20 40H60"
          stroke="#1E3A8A"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="1 3"
        />
        <path
          d="M40 20V60"
          stroke="#1E3A8A"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="1 3"
        />
        
        {/* Airplane element */}
        <g>
          {/* Plane body */}
          <path
            d="M44 40L56 34L52 40L56 46L44 40Z"
            fill="#F97316"
            stroke="#F97316"
            strokeWidth="1"
          />
          
          {/* Plane wings */}
          <path
            d="M30 40L44 40L38 32L30 40Z"
            fill="#1E3A8A"
            stroke="#1E3A8A"
            strokeWidth="1"
          />
          <path
            d="M30 40L44 40L38 48L30 40Z"
            fill="#1E3A8A"
            stroke="#1E3A8A"
            strokeWidth="1"
          />
        </g>
        
        {/* Digital accent dots - orbit path */}
        <circle cx="40" cy="18" r="3" fill="#F97316" />
        <circle cx="62" cy="40" r="3" fill="#F97316" />
      </svg>
    );
  }

  // Animated SVG version
  return (
    <motion.svg
      width={width}
      height={height}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial="initial"
      animate="animate"
      whileHover="hover"
      variants={svgVariants}
    >
      {/* Background circle */}
      <motion.circle
        cx="40"
        cy="40"
        r="32"
        fill="#1E3A8A"
        opacity="0.1"
        variants={circleVariants}
      />
      
      {/* Main circular path */}
      <motion.path
        d="M40 8C22.36 8 8 22.36 8 40C8 57.64 22.36 72 40 72C57.64 72 72 57.64 72 40C72 22.36 57.64 8 40 8Z"
        stroke="#1E3A8A"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        variants={pathVariants}
      />
      
      {/* Digital grid lines */}
      <motion.path
        d="M20 40H60"
        stroke="#1E3A8A"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="1 3"
        variants={pathVariants}
      />
      <motion.path
        d="M40 20V60"
        stroke="#1E3A8A"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="1 3"
        variants={pathVariants}
      />
      
      {/* Airplane element */}
      <motion.g
        variants={planeVariants}
      >
        {/* Plane body */}
        <motion.path
          d="M44 40L56 34L52 40L56 46L44 40Z"
          fill="#F97316"
          stroke="#F97316"
          strokeWidth="1"
          variants={pathVariants}
        />
        
        {/* Plane wings */}
        <motion.path
          d="M30 40L44 40L38 32L30 40Z"
          fill="#1E3A8A"
          stroke="#1E3A8A"
          strokeWidth="1"
          variants={pathVariants}
        />
        <motion.path
          d="M30 40L44 40L38 48L30 40Z"
          fill="#1E3A8A"
          stroke="#1E3A8A"
          strokeWidth="1"
          variants={pathVariants}
        />
      </motion.g>
      
      {/* Digital accent dots - orbit path */}
      <motion.circle
        cx="40"
        cy="18"
        r="3"
        fill="#F97316"
        variants={circleVariants}
      />
      <motion.circle
        cx="62"
        cy="40"
        r="3"
        fill="#F97316"
        variants={circleVariants}
      />
    </motion.svg>
  );
}