import React from 'react';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

/**
 * Client Input Popup Component
 * Used for collecting client input in a popup/modal window
 */
const ClientInputPopup: React.FC = () => {
  const [, navigate] = useLocation();
  
  // Handle close button click
  const handleClose = () => {
    navigate('/');
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <Helmet>
        <title>Client Input | Elevion</title>
      </Helmet>
      
      <div className="relative w-full max-w-xl rounded-lg bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-poppins font-bold text-[#3B5B9D]">
            Client Input
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
            Please provide your input for the project requirements. This information will help us tailor the experience to your needs.
          </p>
          
          <div className="space-y-6 py-4">
            {/* This is a placeholder for the actual form */}
            <div className="p-8 border border-slate-200 rounded-md bg-slate-50 flex items-center justify-center">
              <p className="text-slate-500 text-center">Client Input Form Placeholder</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            className="bg-[#3B5B9D] hover:bg-[#2A4A8C] text-white"
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClientInputPopup;