import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WebsiteColorSuggestions from '@/components/WebsiteColorSuggestions';
import WebsiteLayoutSuggestions from '@/components/WebsiteLayoutSuggestions';
import WebsiteCtaSuggestions from '@/components/WebsiteCtaSuggestions';
import WebsiteImageSuggestions from '@/components/WebsiteImageSuggestions';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import ParticleBackground from '@/components/ParticleBackground';
import ParticleConfigPanel from '@/components/ParticleConfigPanel';

/**
 * DesignTools Page
 *
 * A collection of AI-powered tools for website design and branding
 * Currently includes website color suggestions, layout recommendations,
 * interactive particle backgrounds, and more
 */
export default function DesignTools() {
  const [particleConfig, setParticleConfig] = useState({
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
  });
  
  // Load saved config from localStorage if available
  useEffect(() => {
    const savedConfig = localStorage.getItem('particleConfig');
    if (savedConfig) {
      try {
        setParticleConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error('Error parsing saved config:', e);
      }
    }
  }, []);
  
  return (
    <div className="container mx-auto px-4 py-8 space-y-8 relative">
      <Helmet>
        <title>AI-Powered Design Tools | Elevion</title>
        <meta 
          name="description" 
          content="Access Elevion's suite of AI-powered design tools for website color schemes, layouts, branding suggestions, and more." 
        />
      </Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1">AI Design Tools</h1>
          <p className="text-muted-foreground max-w-2xl">
            Leverage AI to get professional design recommendations tailored to your business
          </p>
        </div>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          asChild
        >
          <Link href="/particle-background">
            <ArrowRight className="h-4 w-4" />
            Try Particle Background Tool
          </Link>
        </Button>
      </div>

      <Separator className="my-6" />

      <Tabs defaultValue="colors" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 max-w-[900px]">
          <TabsTrigger value="colors">Color Schemes</TabsTrigger>
          <TabsTrigger value="layouts">Layouts</TabsTrigger>
          <TabsTrigger value="ctas">CTAs</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
        </TabsList>
        
        <TabsContent value="colors" className="space-y-6">
          <WebsiteColorSuggestions />
        </TabsContent>
        
        <TabsContent value="layouts" className="space-y-6">
          <WebsiteLayoutSuggestions />
        </TabsContent>
        
        <TabsContent value="ctas" className="space-y-6">
          <WebsiteCtaSuggestions />
        </TabsContent>
        
        <TabsContent value="images" className="space-y-6">
          <WebsiteImageSuggestions />
        </TabsContent>
        
        <TabsContent value="typography" className="space-y-6">
          <div className="flex items-center justify-center p-12 border rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Typography Suggestions</h3>
              <p className="text-muted-foreground">Coming soon</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="branding" className="space-y-6">
          <div className="flex items-center justify-center p-12 border rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Branding Suggestions</h3>
              <p className="text-muted-foreground">Coming soon</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Separator className="my-6" />

      <div className="bg-muted/50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">How Our AI Design Tools Work</h2>
        <p className="mb-4">
          Our AI-powered design tools analyze thousands of successful websites across different industries to provide 
          recommendations tailored specifically to your business type. These suggestions are based on:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Industry best practices for web design</li>
          <li>Color psychology and user experience research</li>
          <li>Current design trends and timeless principles</li>
          <li>Conversion optimization patterns and effective CTA strategies</li>
          <li>Accessibility standards</li>
          <li>Mobile responsiveness best practices</li>
          <li>Page structure and information hierarchy guidelines</li>
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          While our AI tools provide expert suggestions, we recommend working with a professional designer 
          for comprehensive brand identity creation and implementation.
        </p>
      </div>
      
      <Separator className="my-8" />
      
      <div className="rounded-xl border overflow-hidden relative mb-12">
        <div className="p-6 bg-gradient-to-br from-slate-800 via-slate-900 to-black h-[400px] relative">
          <ParticleBackground {...particleConfig} />
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="text-center text-white backdrop-blur-sm bg-slate-900/30 p-6 rounded-xl border border-electric-cyan/20 max-w-md">
              <h2 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-electric-cyan to-white font-poppins">Interactive Particle Backgrounds</h2>
              <p className="text-gray-300">
                Create stunning animated backgrounds for your website with our customizable particle system.
              </p>
            </div>
          </div>
        </div>
        <div className="bg-muted p-4 border-t">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Particle Background Generator</h3>
            <Button 
              variant="default" 
              size="sm"
              asChild
            >
              <Link href="/particle-background">
                Open Full Editor
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      <ParticleConfigPanel config={particleConfig} onChange={setParticleConfig} />
    </div>
  );
}