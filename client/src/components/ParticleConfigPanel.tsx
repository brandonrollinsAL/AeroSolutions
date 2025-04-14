import React, { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ColorPicker, useColor } from 'react-color-palette';
import '@/styles/react-color-palette.css';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ParticleConfig {
  particleCount: number;
  colorPalette: string[];
  minSize: number;
  maxSize: number;
  minSpeed: number;
  maxSpeed: number;
  interactive: boolean;
  connectionLines: boolean;
  connectionDistance: number;
  blurEffect: boolean;
  pulseEffect: boolean;
}

interface ParticleConfigPanelProps {
  config: ParticleConfig;
  onChange: (config: ParticleConfig) => void;
}

const ParticleConfigPanel: React.FC<ParticleConfigPanelProps> = ({ config, onChange }) => {
  const [color, setColor] = useColor('hex', '#00D1D1');
  const [colorPalette, setColorPalette] = useState<string[]>(config.colorPalette);
  const [presets, setPresets] = useState([
    {
      name: 'Elevion Default',
      config: {
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
      }
    },
    {
      name: 'Tech Minimal',
      config: {
        particleCount: 40,
        colorPalette: ['#00D1D1', '#FFFFFF'],
        minSize: 1,
        maxSize: 3,
        minSpeed: 0.1,
        maxSpeed: 0.3,
        interactive: true,
        connectionLines: true,
        connectionDistance: 100,
        blurEffect: false,
        pulseEffect: false,
      }
    },
    {
      name: 'Dense Network',
      config: {
        particleCount: 120,
        colorPalette: ['#3B5B9D', '#FFFFFF', '#00D1D1'],
        minSize: 1,
        maxSize: 2,
        minSpeed: 0.05,
        maxSpeed: 0.2,
        interactive: true,
        connectionLines: true,
        connectionDistance: 80,
        blurEffect: true,
        pulseEffect: true,
      }
    },
    {
      name: 'Colorful Chaos',
      config: {
        particleCount: 80,
        colorPalette: ['#00D1D1', '#3B5B9D', '#FF7043', '#FFD700', '#FF00FF'],
        minSize: 3,
        maxSize: 8,
        minSpeed: 0.3,
        maxSpeed: 1.2,
        interactive: true,
        connectionLines: false,
        connectionDistance: 150,
        blurEffect: true,
        pulseEffect: true,
      }
    },
  ]);

  const handleAddColor = () => {
    const newPalette = [...colorPalette, color.hex];
    setColorPalette(newPalette);
    onChange({ ...config, colorPalette: newPalette });
  };

  const handleRemoveColor = (index: number) => {
    const newPalette = colorPalette.filter((_, i) => i !== index);
    setColorPalette(newPalette);
    onChange({ ...config, colorPalette: newPalette });
  };

  const handleChange = <K extends keyof ParticleConfig>(key: K, value: ParticleConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const handlePresetChange = (preset: any) => {
    setColorPalette(preset.config.colorPalette);
    onChange(preset.config);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="fixed bottom-4 right-4 z-50 rounded-full h-12 w-12 bg-slate-blue/80 backdrop-blur-sm hover:bg-electric-cyan/80 border-electric-cyan/40 shadow-lg">
          <Settings className="h-6 w-6 text-white" />
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl font-poppins font-bold text-slate-blue">Particle Background Settings</SheetTitle>
          <SheetDescription>
            Customize the particle background to create your desired effect.
          </SheetDescription>
        </SheetHeader>

        <div className="py-4 space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-blue">Presets</h3>
            <RadioGroup 
              value={JSON.stringify(config)} 
              onValueChange={(val) => {
                const preset = presets.find(p => JSON.stringify(p.config) === val);
                if (preset) handlePresetChange(preset);
              }}
              className="grid grid-cols-2 gap-2"
            >
              {presets.map((preset, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={JSON.stringify(preset.config)} 
                    id={`preset-${index}`} 
                    className="text-electric-cyan"
                  />
                  <Label htmlFor={`preset-${index}`}>{preset.name}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-slate-blue">Particle Count</h3>
            <div className="flex items-center gap-4">
              <Slider 
                value={[config.particleCount]} 
                min={10} 
                max={200} 
                step={5}
                onValueChange={(value) => handleChange('particleCount', value[0])}
                className="flex-1"
              />
              <span className="w-10 text-center">{config.particleCount}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-slate-blue">Particle Size</h3>
            <div className="space-y-4">
              <div>
                <Label>Min Size</Label>
                <div className="flex items-center gap-4">
                  <Slider 
                    value={[config.minSize]} 
                    min={1} 
                    max={10} 
                    step={0.5}
                    onValueChange={(value) => handleChange('minSize', value[0])}
                    className="flex-1"
                  />
                  <span className="w-10 text-center">{config.minSize}</span>
                </div>
              </div>
              <div>
                <Label>Max Size</Label>
                <div className="flex items-center gap-4">
                  <Slider 
                    value={[config.maxSize]} 
                    min={1} 
                    max={15} 
                    step={0.5}
                    onValueChange={(value) => handleChange('maxSize', value[0])}
                    className="flex-1"
                  />
                  <span className="w-10 text-center">{config.maxSize}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-slate-blue">Particle Speed</h3>
            <div className="space-y-4">
              <div>
                <Label>Min Speed</Label>
                <div className="flex items-center gap-4">
                  <Slider 
                    value={[config.minSpeed * 10]} 
                    min={1} 
                    max={20} 
                    step={1}
                    onValueChange={(value) => handleChange('minSpeed', value[0] / 10)}
                    className="flex-1"
                  />
                  <span className="w-10 text-center">{config.minSpeed.toFixed(1)}</span>
                </div>
              </div>
              <div>
                <Label>Max Speed</Label>
                <div className="flex items-center gap-4">
                  <Slider 
                    value={[config.maxSpeed * 10]} 
                    min={1} 
                    max={30} 
                    step={1}
                    onValueChange={(value) => handleChange('maxSpeed', value[0] / 10)}
                    className="flex-1"
                  />
                  <span className="w-10 text-center">{config.maxSpeed.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-slate-blue">Connection Lines</h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="connectionLines">Enable Connection Lines</Label>
              <Switch 
                id="connectionLines" 
                checked={config.connectionLines}
                onCheckedChange={(checked) => handleChange('connectionLines', checked)}
              />
            </div>
            {config.connectionLines && (
              <div>
                <Label>Connection Distance</Label>
                <div className="flex items-center gap-4">
                  <Slider 
                    value={[config.connectionDistance]} 
                    min={50} 
                    max={300} 
                    step={10}
                    onValueChange={(value) => handleChange('connectionDistance', value[0])}
                    className="flex-1"
                  />
                  <span className="w-10 text-center">{config.connectionDistance}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-slate-blue">Effects</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="interactive">Interactive (Mouse Repel)</Label>
                <Switch 
                  id="interactive" 
                  checked={config.interactive}
                  onCheckedChange={(checked) => handleChange('interactive', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="blurEffect">Glow Effect</Label>
                <Switch 
                  id="blurEffect" 
                  checked={config.blurEffect}
                  onCheckedChange={(checked) => handleChange('blurEffect', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="pulseEffect">Pulse Effect</Label>
                <Switch 
                  id="pulseEffect" 
                  checked={config.pulseEffect}
                  onCheckedChange={(checked) => handleChange('pulseEffect', checked)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-slate-blue">Color Palette</h3>
            <div className="flex flex-wrap gap-2">
              {colorPalette.map((color, index) => (
                <div 
                  key={index}
                  className="relative w-8 h-8 rounded-full cursor-pointer"
                  style={{ backgroundColor: color }}
                  onClick={() => handleRemoveColor(index)}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-white text-xs opacity-0 hover:opacity-100 transition-opacity">×</span>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAddColor}
                className="h-8 w-8 rounded-full p-0"
              >
                +
              </Button>
            </div>
            <div className="pt-2">
              <ColorPicker
                color={color}
                onChange={setColor}
                hideHSV
                hideRGB
              />
            </div>
          </div>

          <div className="pt-4">
            <Button 
              className="w-full bg-gradient-to-r from-electric-cyan to-slate-blue text-white"
              onClick={() => {
                // Store config in local storage for persistence
                localStorage.setItem('particleConfig', JSON.stringify(config));
              }}
            >
              Save as Default
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ParticleConfigPanel;