import React, { useState } from 'react';
import ParticleBackground from '@/components/ParticleBackground';
import ParticleConfigPanel from '@/components/ParticleConfigPanel';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

const ParticleBackgroundEmbed = () => {
  // Default configuration
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

  return (
    <div className="w-full min-h-screen bg-slate-900 overflow-hidden">
      <div className="relative w-full h-screen overflow-hidden">
        {/* Particle Background */}
        <ParticleBackground
          particleCount={config.particleCount}
          colorPalette={config.colorPalette}
          minSize={config.minSize}
          maxSize={config.maxSize}
          minSpeed={config.minSpeed}
          maxSpeed={config.maxSpeed}
          interactive={config.interactive}
          connectionLines={config.connectionLines}
          connectionDistance={config.connectionDistance}
          blurEffect={config.blurEffect}
          pulseEffect={config.pulseEffect}
        />

        {/* Back button */}
        <div className="absolute top-4 left-4 z-10">
          <Link href="/design-tools">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Design Tools
            </Button>
          </Link>
        </div>

        {/* Control panel - fixed position */}
        <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-10">
          <ParticleConfigPanel
            config={config}
            onChange={(newConfig) => setConfig(newConfig)}
          />
        </div>

        {/* Main content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-0 p-4">
          <div className="text-center text-white space-y-4 max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Dynamic Particle Background
            </h1>
            <p className="text-xl opacity-90">
              Create engaging interactive backgrounds for your web projects
            </p>
            <div className="mt-8">
              <Link href="/design-tools">
                <Button variant="default" size="lg">
                  Explore More Design Tools
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticleBackgroundEmbed;