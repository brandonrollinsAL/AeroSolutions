import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface DialProps {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  hover: {
    scale: 1.05,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
  },
  active: {
    scale: 0.98,
  },
}

// Aviation-style Control Dial
export const CockpitDial: React.FC<DialProps> = ({ 
  label, 
  min, 
  max, 
  value, 
  onChange, 
  unit = '',
  className = '',
  size = 'md'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentValue, setCurrentValue] = useState(value);
  
  const sizeClass = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  }[size];
  
  const fontSizeClass = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[size];
  
  const valueFontClass = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  }[size];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const diff = (startY - e.clientY) * 0.5;
        const range = max - min;
        const newValue = Math.min(max, Math.max(min, currentValue + (diff / 100) * range));
        setCurrentValue(newValue);
        onChange(newValue);
        setStartY(e.clientY);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startY, currentValue, min, max, onChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
  };

  const dialRotation = ((currentValue - min) / (max - min)) * 270 - 135;
  
  const displayValue = Number.isInteger(currentValue) 
    ? currentValue 
    : currentValue.toFixed(1);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div 
        className={`relative ${sizeClass} rounded-full bg-gray-800 border-4 border-gray-700 shadow-inner flex items-center justify-center cursor-pointer`}
        onMouseDown={handleMouseDown}
      >
        <motion.div 
          className="absolute inset-2 rounded-full bg-gray-700 border border-gray-600 shadow-inner flex items-center justify-center"
          animate={{ rotate: dialRotation }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        >
          <div className="absolute w-1 h-8 top-0 left-1/2 -translate-x-1/2 -translate-y-1 bg-amber-400 rounded"></div>
        </motion.div>
        
        <div className="z-10 text-center">
          <div className={`${valueFontClass} font-mono font-bold text-amber-300`}>
            {displayValue}{unit}
          </div>
        </div>
      </div>
      <div className={`mt-2 ${fontSizeClass} text-gray-300 uppercase tracking-wider font-semibold`}>
        {label}
      </div>
    </div>
  );
};

interface SwitchProps {
  label: string;
  isOn: boolean;
  onChange: (isOn: boolean) => void;
  className?: string;
}

// Aviation-style Toggle Switch
export const CockpitSwitch: React.FC<SwitchProps> = ({ 
  label, 
  isOn, 
  onChange,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <motion.div 
        className={`w-16 h-10 bg-gray-800 rounded-md border-2 ${isOn ? 'border-green-500' : 'border-red-500'} shadow flex items-center justify-center cursor-pointer`}
        onClick={() => onChange(!isOn)}
        whileHover="hover"
        whileTap="active"
        variants={variants}
      >
        <motion.div 
          className={`w-6 h-14 bg-gray-300 border border-gray-400 rounded-sm shadow-md relative -top-3`}
          animate={{ 
            rotateX: isOn ? 0 : 180,
            backgroundColor: isOn ? '#10b981' : '#ef4444'
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </motion.div>
      <div className="mt-2 text-xs text-gray-300 uppercase tracking-wider font-semibold">
        {label}
      </div>
      <div className="text-xs font-mono text-center mt-1">
        <span className={isOn ? 'text-green-400' : 'text-gray-500'}>ON</span>
        <span className="mx-1 text-gray-500">/</span>
        <span className={!isOn ? 'text-red-400' : 'text-gray-500'}>OFF</span>
      </div>
    </div>
  );
};

interface ButtonProps {
  label: string;
  onClick: () => void;
  color?: 'red' | 'green' | 'blue' | 'amber';
  className?: string;
}

// Aviation-style Cockpit Button
export const CockpitButton: React.FC<ButtonProps> = ({ 
  label, 
  onClick,
  color = 'blue',
  className = ''
}) => {
  const colorClasses = {
    red: 'bg-red-600 border-red-700 active:bg-red-700 shadow-red-700/50',
    green: 'bg-green-600 border-green-700 active:bg-green-700 shadow-green-700/50',
    blue: 'bg-blue-600 border-blue-700 active:bg-blue-700 shadow-blue-700/50',
    amber: 'bg-amber-500 border-amber-600 active:bg-amber-600 shadow-amber-500/50'
  }[color];
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <motion.button
        onClick={onClick}
        className={`w-20 h-12 ${colorClasses} rounded-md border-b-4 text-white font-bold text-sm focus:outline-none shadow-lg`}
        whileHover="hover"
        whileTap="active"
        variants={variants}
      >
        {label}
      </motion.button>
    </div>
  );
};

interface LedProps {
  label: string;
  color: 'red' | 'green' | 'blue' | 'amber' | 'white';
  isOn: boolean;
  pulsing?: boolean;
  className?: string;
}

// Aviation-style LED Indicator
export const CockpitLed: React.FC<LedProps> = ({ 
  label, 
  color, 
  isOn,
  pulsing = false,
  className = ''
}) => {
  const colorClasses = {
    red: 'bg-red-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-400',
    white: 'bg-white'
  }[color];
  
  const dimColorClasses = {
    red: 'bg-red-900',
    green: 'bg-green-900',
    blue: 'bg-blue-900',
    amber: 'bg-amber-900',
    white: 'bg-gray-400'
  }[color];
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="w-8 h-8 bg-gray-800 rounded-full p-1.5 border border-gray-700 shadow-inner">
        <motion.div 
          className={`w-full h-full rounded-full ${isOn ? colorClasses : dimColorClasses}`}
          animate={pulsing && isOn ? { opacity: [1, 0.5, 1] } : {}}
          transition={pulsing ? { repeat: Infinity, duration: 1.5 } : {}}
        />
      </div>
      <div className="mt-1 text-xs text-gray-300 uppercase tracking-wider font-semibold">
        {label}
      </div>
    </div>
  );
};

export default function CockpitControls() {
  const [altitude, setAltitude] = useState(10000);
  const [speed, setSpeed] = useState(250);
  const [heading, setHeading] = useState(180);
  const [enginePower, setEnginePower] = useState(false);
  const [landingGear, setLandingGear] = useState(true);
  const [autopilot, setAutopilot] = useState(false);
  const [warning, setWarning] = useState(false);
  
  // Simulate a warning condition after loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setWarning(true);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleEmergency = () => {
    setWarning(false);
    setAltitude(8000);
    setSpeed(200);
    alert("Emergency response activated!");
  };
  
  return (
    <div className="p-8 bg-gray-900 rounded-lg border border-gray-800 shadow-xl">
      <h3 className="text-center text-xl font-bold text-amber-300 mb-6">
        Interactive Cockpit Controls
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <CockpitDial 
          label="Altitude" 
          min={0} 
          max={35000} 
          value={altitude} 
          onChange={setAltitude}
          unit="ft"
        />
        
        <CockpitDial 
          label="Speed" 
          min={0} 
          max={500} 
          value={speed} 
          onChange={setSpeed}
          unit="kt"
        />
        
        <CockpitDial 
          label="Heading" 
          min={0} 
          max={359} 
          value={heading} 
          onChange={setHeading}
          unit="°"
        />
        
        <div className="flex flex-col justify-between">
          <CockpitSwitch
            label="Engine"
            isOn={enginePower}
            onChange={setEnginePower}
          />
          
          <CockpitSwitch
            label="Landing Gear"
            isOn={landingGear}
            onChange={setLandingGear}
          />
        </div>
      </div>
      
      <div className="flex justify-center space-x-6 mb-6">
        <CockpitButton
          label="Autopilot"
          onClick={() => setAutopilot(!autopilot)}
          color={autopilot ? "green" : "blue"}
        />
        
        <CockpitButton
          label="Emergency"
          onClick={handleEmergency}
          color="red"
        />
      </div>
      
      <div className="flex justify-center space-x-4">
        <CockpitLed
          label="Autopilot"
          color="green"
          isOn={autopilot}
        />
        
        <CockpitLed
          label="Warning"
          color="red"
          isOn={warning}
          pulsing={true}
        />
        
        <CockpitLed
          label="Gear Down"
          color="amber"
          isOn={landingGear}
        />
        
        <CockpitLed
          label="Power"
          color="blue"
          isOn={enginePower}
        />
      </div>
      
      <div className="mt-8 text-center text-xs text-gray-400">
        Interactive simulation - Drag dials to change values
      </div>
    </div>
  );
}