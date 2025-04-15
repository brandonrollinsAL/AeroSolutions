import React from 'react';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

/**
 * Preview Popup Component
 * Used for displaying preview content in a popup/modal window
 */
const PreviewPopup: React.FC = () => {
  const [, navigate] = useLocation();
  
  // Handle close button click
  const handleClose = () => {
    navigate('/');
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <Helmet>
        <title>Preview | Elevion</title>
      </Helmet>
      
      <div className="relative w-full max-w-4xl rounded-lg bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-poppins font-bold text-[#3B5B9D]">
            Preview
          </h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClose}
            className="absolute right-2 top-2"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="mb-6">
          <p className="text-slate-600 mb-4">
            Here's a preview of your design or content. This is a placeholder that would show the actual preview content.
          </p>
          
          <div className="space-y-6 py-4">
            {/* This is a placeholder for the actual preview content */}
            <div className="p-16 border border-slate-200 rounded-md bg-slate-50 flex items-center justify-center">
              <p className="text-slate-500 text-center">Preview Content Placeholder</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button 
            className="bg-[#00D1D1] hover:bg-[#00A0A0] text-white"
          >
            Download
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PreviewPopup;