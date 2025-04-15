import React from 'react';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Lightbox Popup Component
 * Used for displaying images or media in a full-screen lightbox
 */
const LightboxPopup: React.FC = () => {
  const [, navigate] = useLocation();
  
  // Handle close button click
  const handleClose = () => {
    navigate('/');
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <Helmet>
        <title>Image Lightbox | Elevion</title>
      </Helmet>
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleClose}
        className="absolute right-4 top-4 text-white hover:bg-black/20"
      >
        <X className="h-6 w-6" />
      </Button>
      
      <div className="relative w-full max-w-6xl px-12">
        {/* Navigation buttons */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 text-white hover:bg-black/20"
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 text-white hover:bg-black/20"
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
        
        {/* Image container */}
        <div className="flex items-center justify-center">
          {/* Placeholder for the actual image */}
          <div className="p-32 rounded-md bg-slate-800 flex items-center justify-center">
            <p className="text-slate-300 text-center">Image Lightbox Placeholder</p>
          </div>
        </div>
        
        {/* Caption */}
        <div className="mt-4 text-center">
          <p className="text-white text-sm">
            Image caption would appear here
          </p>
        </div>
      </div>
    </div>
  );
};

export default LightboxPopup;