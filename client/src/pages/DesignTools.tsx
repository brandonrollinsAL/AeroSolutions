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
import { ArrowRight, ArrowLeft, X, Sparkles } from 'lucide-react';
import ParticleBackground from '@/components/ParticleBackground';
import ParticleConfigPanel from '@/components/ParticleConfigPanel';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from '@/hooks/use-toast';

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
  
  // State for showing full-screen particle editor
  const [showFullEditor, setShowFullEditor] = useState(false);
  const [showCode, setShowCode] = useState(false);
  
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
  
  // Save config to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('particleConfig', JSON.stringify(particleConfig));
  }, [particleConfig]);
  
  // Generate JSX code based on current config
  const generateJSX = () => {
    return `<ParticleBackground
  particleCount={${particleConfig.particleCount}}
  colorPalette={[${particleConfig.colorPalette.map(c => `'${c}'`).join(', ')}]}
  minSize={${particleConfig.minSize}}
  maxSize={${particleConfig.maxSize}}
  minSpeed={${particleConfig.minSpeed}}
  maxSpeed={${particleConfig.maxSpeed}}
  interactive={${particleConfig.interactive}}
  connectionLines={${particleConfig.connectionLines}}
  connectionDistance={${particleConfig.connectionDistance}}
  blurEffect={${particleConfig.blurEffect}}
  pulseEffect={${particleConfig.pulseEffect}}
/>`;
  };

  // Copy code to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateJSX());
    toast({
      title: "Code copied to clipboard",
      description: "You can now paste it into your project",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 relative">
      <Helmet>
        <title>AI-Powered Design Tools | Elevion</title>
        <meta 
          name="description" 
          content="Access Elevion's suite of AI-powered design tools for website color schemes, layouts, branding suggestions, and more." 
        />
      </Helmet>
      
      {/* Full Screen Particle Editor Overlay */}
      {showFullEditor && (
        <div className="fixed inset-0 bg-slate-900 z-50 overflow-auto">
          <div className="absolute inset-0">
            <ParticleBackground {...particleConfig} />
          </div>
          
          <div className="relative z-10 p-4 flex flex-col min-h-screen">
            <div className="flex justify-between items-start mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-slate-900/70 text-white hover:bg-slate-800/70"
                onClick={() => setShowFullEditor(false)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Design Tools
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-slate-900/70 text-white hover:bg-slate-800/70"
                  onClick={() => setShowCode(!showCode)}
                >
                  {showCode ? <X className="h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  {showCode ? "Hide Code" : "Show Code"}
                </Button>
                
                <Button 
                  variant="default" 
                  size="sm" 
                  className="bg-electric-cyan hover:bg-electric-cyan/80 text-slate-900"
                  onClick={copyToClipboard}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row gap-4">
              {/* Control Panel */}
              <div className="bg-slate-900/70 backdrop-blur-sm p-4 rounded-lg border border-slate-700 shadow-lg md:w-80 md:self-center">
                <h2 className="text-white text-xl font-bold mb-4">Particle Settings</h2>
                <ParticleConfigPanel config={particleConfig} onChange={setParticleConfig} />
              </div>
              
              {/* Code Preview */}
              {showCode && (
                <div className="bg-slate-900/70 backdrop-blur-sm p-4 rounded-lg border border-slate-700 shadow-lg flex-1">
                  <h2 className="text-white text-xl font-bold mb-4">Code Preview</h2>
                  <div className="bg-slate-800 rounded-md overflow-hidden">
                    <SyntaxHighlighter language="jsx" style={tomorrow} showLineNumbers>
                      {generateJSX()}
                    </SyntaxHighlighter>
                  </div>
                  <div className="mt-4 text-slate-300 text-sm">
                    <p>Copy this component code to include the particle background in your React project.</p>
                    <p className="mt-2">Make sure to install the required dependencies and import the ParticleBackground component.</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-auto pt-4">
              <div className="bg-slate-900/70 backdrop-blur-sm p-4 rounded-lg border border-slate-700 text-white">
                <h3 className="font-medium mb-2">Interactive Particle Background</h3>
                <p className="text-sm text-slate-300">
                  This dynamic background can be customized for your website. Adjust the settings to match your brand's colors and style,
                  then copy the code to implement it in your project.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
          onClick={() => setShowFullEditor(true)}
        >
          <ArrowRight className="h-4 w-4" />
          Try Particle Background Tool
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
              onClick={() => setShowFullEditor(true)}
            >
              Open Full Editor
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <ParticleConfigPanel config={particleConfig} onChange={setParticleConfig} />
    </div>
  );
}