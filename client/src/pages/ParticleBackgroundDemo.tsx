import React, { useState, useEffect } from 'react';
import ParticleBackground from '@/components/ParticleBackground';
import ParticleConfigPanel from '@/components/ParticleConfigPanel';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Code, Copy, Download } from 'lucide-react';
import { Link } from 'wouter';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from '@/hooks/use-toast';

const ParticleBackgroundDemo = () => {
  const { i18n } = useTranslation();
  const defaultConfig = {
    particleCount: 60,
    colorPalette: ['#00D1D1', '#3B5B9D', '#EDEFF2', '#FF7043'],
    minSize: 2,
    maxSize: 5,
    minSpeed: 0.2,
    maxSpeed: 0.8,
    interactive: true,
    connectionLines: true,
    connectionDistance: 150,
    blurEffect: true,
    pulseEffect: true,
  };

  const [config, setConfig] = useState(defaultConfig);
  const [showCode, setShowCode] = useState(false);

  // Load saved config from localStorage if available
  useEffect(() => {
    const savedConfig = localStorage.getItem('particleConfig');
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error('Error parsing saved config:', e);
      }
    }
  }, []);

  const generateJSX = () => {
    return `<ParticleBackground
  particleCount={${config.particleCount}}
  colorPalette={[${config.colorPalette.map(c => `'${c}'`).join(', ')}]}
  minSize={${config.minSize}}
  maxSize={${config.maxSize}}
  minSpeed={${config.minSpeed}}
  maxSpeed={${config.maxSpeed}}
  interactive={${config.interactive}}
  connectionLines={${config.connectionLines}}
  connectionDistance={${config.connectionDistance}}
  blurEffect={${config.blurEffect}}
  pulseEffect={${config.pulseEffect}}
/>`;
  };

  const generateJSON = () => {
    return JSON.stringify(config, null, 2);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied to clipboard",
      description: "The code has been copied to your clipboard.",
    });
  };

  const handleDownloadConfig = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "particle-config.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <Helmet>
        <title>Dynamic Particle Background Generator | Elevion</title>
        <meta name="description" content="Create and customize beautiful interactive particle backgrounds for your web projects with our dynamic generator tool." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://elevion.dev/particle-background" />
        <html lang={i18n.language.split('-')[0]} />
        <meta httpEquiv="Content-Language" content={i18n.language} />
      </Helmet>
      {/* Demo background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black -z-10"></div>
      <ParticleBackground {...config} />

      {/* Header */}
      <header className="p-4 sm:p-6 flex justify-between items-center z-10">
        <Link href="/">
          <Button variant="outline" size="sm" className="text-white border-electric-cyan/30 bg-slate-900/50 backdrop-blur-sm hover:bg-electric-cyan/20">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="text-white border-electric-cyan/30 bg-slate-900/50 backdrop-blur-sm hover:bg-electric-cyan/20"
              onClick={() => setShowCode(true)}
            >
              <Code className="mr-2 h-4 w-4" />
              Get Code
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px] bg-slate-900 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-electric-cyan">Export Particle Background Code</DialogTitle>
              <DialogDescription>
                Copy the JSX or JSON configuration for your particle background.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="jsx" className="w-full mt-4">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                <TabsTrigger value="jsx">JSX Component</TabsTrigger>
                <TabsTrigger value="json">JSON Configuration</TabsTrigger>
              </TabsList>
              <TabsContent value="jsx" className="relative">
                <SyntaxHighlighter 
                  language="jsx" 
                  style={tomorrow}
                  customStyle={{borderRadius: '0.5rem', maxHeight: '400px'}}
                  className="text-sm"
                >
                  {generateJSX()}
                </SyntaxHighlighter>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute top-2 right-2 text-white bg-slate-800/50 hover:bg-slate-700/70"
                  onClick={() => handleCopyCode(generateJSX())}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TabsContent>
              <TabsContent value="json" className="relative">
                <SyntaxHighlighter 
                  language="json" 
                  style={tomorrow}
                  customStyle={{borderRadius: '0.5rem', maxHeight: '400px'}}
                  className="text-sm"
                >
                  {generateJSON()}
                </SyntaxHighlighter>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute top-2 right-2 text-white bg-slate-800/50 hover:bg-slate-700/70"
                  onClick={() => handleCopyCode(generateJSON())}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end mt-4">
              <Button 
                variant="outline" 
                className="bg-slate-800 text-white border-electric-cyan/30 hover:bg-electric-cyan/20"
                onClick={handleDownloadConfig}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Config
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <div className="text-center text-white max-w-2xl mx-auto backdrop-blur-sm bg-slate-900/30 p-6 rounded-xl border border-electric-cyan/20">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-electric-cyan to-white font-poppins">Dynamic Particle Background</h1>
          <p className="text-lg mb-6 text-gray-300 font-lato">
            Customize your particle background with the configuration panel. Adjust colors, sizes, speeds, and effects to create your perfect animated background.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-electric-cyan to-slate-blue text-white border-none">
                  Learn How to Implement
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px] max-h-[80vh] overflow-y-auto bg-slate-900 border-slate-700 text-white">
                <DialogHeader>
                  <DialogTitle className="text-electric-cyan">Implementation Guide</DialogTitle>
                  <DialogDescription>
                    Follow these steps to add the particle background to your project.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 mt-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-electric-cyan">Step 1: Install Dependencies</h3>
                    <SyntaxHighlighter language="bash" style={tomorrow} className="text-sm rounded-md">
                      npm install framer-motion
                    </SyntaxHighlighter>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-electric-cyan">Step 2: Copy the ParticleBackground Component</h3>
                    <p className="text-sm text-gray-300 mb-2">Create a new file called <code>ParticleBackground.tsx</code> and copy the component code:</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mb-2 text-white border-electric-cyan/30 hover:bg-electric-cyan/20"
                      onClick={() => handleCopyCode(`import React, { useEffect, useRef, useState } from 'react';
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

export default ParticleBackground;`)}
                    >
                      Copy Component Code
                    </Button>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-electric-cyan">Step 3: Use the Component</h3>
                    <p className="text-sm text-gray-300 mb-2">Import and use the component in your layout:</p>
                    <SyntaxHighlighter language="jsx" style={tomorrow} className="text-sm rounded-md">
{`import ParticleBackground from './components/ParticleBackground';

function App() {
  return (
    <div className="min-h-screen relative">
      {/* Background particle effect */}
      <ParticleBackground 
        particleCount={60}
        colorPalette={['#00D1D1', '#3B5B9D', '#EDEFF2', '#FF7043']}
        connectionLines={true}
        blurEffect={true}
      />
      
      {/* Your content goes here */}
      <main className="relative z-10">
        <h1>Your Content</h1>
      </main>
    </div>
  );
}`}
                    </SyntaxHighlighter>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-electric-cyan">Step 4: Customize</h3>
                    <p className="text-sm text-gray-300 mb-2">
                      Use the configuration panel to find your perfect settings, then copy the generated code or configuration.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </main>

      {/* Configuration panel */}
      <ParticleConfigPanel config={config} onChange={setConfig} />
    </div>
  );
};

export default ParticleBackgroundDemo;