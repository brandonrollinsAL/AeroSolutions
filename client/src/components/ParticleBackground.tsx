import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
  opacity: number;
  direction: { x: number; y: number };
}

interface ParticleBackgroundProps {
  particleCount?: number;
  colorPalette?: string[];
  minSize?: number;
  maxSize?: number;
  minSpeed?: number;
  maxSpeed?: number;
  interactive?: boolean;
  connectionLines?: boolean;
  connectionDistance?: number;
  blurEffect?: boolean;
  pulseEffect?: boolean;
}

const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  particleCount = 60,
  colorPalette = ['#00D1D1', '#3B5B9D', '#EDEFF2', '#FF7043'],
  minSize = 2,
  maxSize = 5,
  minSpeed = 0.2,
  maxSpeed = 0.8,
  interactive = true,
  connectionLines = true,
  connectionDistance = 150,
  blurEffect = true,
  pulseEffect = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const animationRef = useRef<number | null>(null);

  // Create initial particles
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    setDimensions({ width: rect.width, height: rect.height });
    
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      newParticles.push(createParticle(i, rect.width, rect.height));
    }
    
    setParticles(newParticles);
    
    const handleResize = () => {
      const newRect = container.getBoundingClientRect();
      setDimensions({ width: newRect.width, height: newRect.height });
      
      setParticles(prevParticles => 
        prevParticles.map(particle => ({
          ...particle,
          x: (particle.x / dimensions.width) * newRect.width,
          y: (particle.y / dimensions.height) * newRect.height,
        }))
      );
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particleCount]);

  // Handle mouse interaction
  useEffect(() => {
    if (!interactive || !containerRef.current) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };
    
    const handleMouseLeave = () => {
      setMousePosition(null);
    };
    
    const container = containerRef.current;
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [interactive]);

  // Draw animation
  useEffect(() => {
    if (!canvasRef.current || particles.length === 0 || dimensions.width === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Move and draw particles
      const updatedParticles = particles.map(particle => {
        // Move particle
        let newX = particle.x + particle.direction.x * particle.speed;
        let newY = particle.y + particle.direction.y * particle.speed;
        
        // Handle edge collision
        if (newX <= 0 || newX >= dimensions.width) {
          particle.direction.x *= -1;
          newX = Math.max(0, Math.min(newX, dimensions.width));
        }
        
        if (newY <= 0 || newY >= dimensions.height) {
          particle.direction.y *= -1;
          newY = Math.max(0, Math.min(newY, dimensions.height));
        }
        
        // Handle mouse interaction
        if (mousePosition && interactive) {
          const dx = mousePosition.x - newX;
          const dy = mousePosition.y - newY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 120) {
            const angle = Math.atan2(dy, dx);
            const repelX = Math.cos(angle) * 0.5;
            const repelY = Math.sin(angle) * 0.5;
            
            newX -= repelX * (120 - distance) / 60;
            newY -= repelY * (120 - distance) / 60;
          }
        }
        
        return {
          ...particle,
          x: newX,
          y: newY,
        };
      });
      
      // Draw connection lines
      if (connectionLines) {
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = '#00D1D1';
        ctx.lineWidth = 0.5;
        
        for (let i = 0; i < updatedParticles.length; i++) {
          for (let j = i + 1; j < updatedParticles.length; j++) {
            const p1 = updatedParticles[i];
            const p2 = updatedParticles[j];
            
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < connectionDistance) {
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      }
      
      // Draw particles
      updatedParticles.forEach(particle => {
        ctx.globalAlpha = particle.opacity;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        
        if (blurEffect) {
          ctx.shadowColor = particle.color;
          ctx.shadowBlur = 10;
        }
        
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      });
      
      setParticles(updatedParticles);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particles, dimensions, mousePosition, connectionLines, blurEffect, connectionDistance, interactive]);

  const createParticle = (id: number, width: number, height: number): Particle => {
    // Random angle for direction
    const angle = Math.random() * Math.PI * 2;
    
    // Pulse effect varies the opacity slightly for each particle
    const baseOpacity = pulseEffect ? 0.3 + Math.random() * 0.5 : 0.8;
    
    return {
      id,
      x: Math.random() * width,
      y: Math.random() * height,
      size: minSize + Math.random() * (maxSize - minSize),
      color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
      speed: minSpeed + Math.random() * (maxSpeed - minSpeed),
      opacity: baseOpacity,
      direction: {
        x: Math.cos(angle),
        y: Math.sin(angle),
      },
    };
  };

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
    >
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ mixBlendMode: 'screen' }}
      />
    </div>
  );
};

export default ParticleBackground;