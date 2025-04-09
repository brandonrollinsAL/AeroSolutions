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

  // Static SVG version - more minimalistic design
  if (!animated) {
    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Simplified main circular path */}
        <circle
          cx="40"
          cy="40"
          r="32"
          stroke="#1E3A8A"
          strokeWidth="2"
          fill="none"
        />
        
        {/* Simple airplane silhouette */}
        <path
          d="M30 40L56 40"
          stroke="#001F3F"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M45 30L56 40L45 50"
          stroke="#000000"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Single accent dot */}
        <circle cx="28" cy="40" r="2" fill="#C0C0C0" />
      </svg>
    );
  }

  // Animated SVG version - more minimalistic design
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
      {/* Simplified main circular path */}
      <motion.circle
        cx="40"
        cy="40"
        r="32"
        stroke="#1E3A8A"
        strokeWidth="2"
        fill="none"
        variants={pathVariants}
      />
      
      {/* Simple airplane element */}
      <motion.g variants={planeVariants}>
        <motion.path
          d="M30 40L56 40"
          stroke="#001F3F"
          strokeWidth="2"
          strokeLinecap="round"
          variants={pathVariants}
        />
        <motion.path
          d="M45 30L56 40L45 50"
          stroke="#000000"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          variants={pathVariants}
        />
      </motion.g>
      
      {/* Single accent dot */}
      <motion.circle
        cx="28"
        cy="40"
        r="2"
        fill="#C0C0C0"
        variants={circleVariants}
      />
    </motion.svg>
  );
}