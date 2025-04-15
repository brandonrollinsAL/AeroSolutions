import React from 'react';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

/**
 * Dialog Popup Component
 * Generic dialog popup for various confirmation or information displays
 */
const DialogPopup: React.FC = () => {
  const [, navigate] = useLocation();
  
  // Handle close button click
  const handleClose = () => {
    navigate('/');
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <Helmet>
        <title>Dialog | Elevion</title>
      </Helmet>
      
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-poppins font-bold text-[#3B5B9D]">
            Dialog
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
            This is a generic dialog popup that can be used for confirmations, alerts, or other interactive elements.
          </p>
          
          <div className="space-y-6 py-4">
            {/* This is a placeholder for the actual dialog content */}
            <div className="p-4 border border-slate-200 rounded-md bg-slate-50 flex items-center justify-center">
              <p className="text-slate-500 text-center">Dialog Content Placeholder</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            className="bg-[#FF7043] hover:bg-[#E05A30] text-white"
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DialogPopup;