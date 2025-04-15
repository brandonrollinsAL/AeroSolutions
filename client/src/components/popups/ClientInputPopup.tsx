import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import ErrorBoundary from '@/components/ui/error-boundary';
import { usePopup } from '@/contexts/PopupContext';

/**
 * Client Input Popup Component
 * Used for collecting client input in a popup/modal window
 */
const ClientInputPopupContent: React.FC = () => {
  const { closePopup, popupData } = usePopup();
  const [, navigate] = useLocation();
  
  // Example of using TanStack Query to fetch any necessary data
  const { isLoading, error } = useQuery({
    queryKey: ['/api/client-input-form', popupData?.formId],
    queryFn: async () => {
      // In a real scenario, we would fetch form data from the API
      // For now, we'll just simulate a successful response
      return { 
        title: 'Client Input',
        description: 'Please provide your input for the project requirements. This information will help us tailor the experience to your needs.'
      };
    },
    // Only run if we have a formId in the popup data
    enabled: !!popupData?.formId,
  });
  
  // Handle close button click
  const handleClose = () => {
    closePopup();
    navigate('/');
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin h-8 w-8 border-4 border-electric-cyan border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 text-red-500">
        <p>Error loading form data. Please try again later.</p>
        <Button variant="outline" onClick={handleClose} className="mt-4">
          Close
        </Button>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <Helmet>
        <title>Client Input | Elevion</title>
      </Helmet>
      
      <div className="relative w-full max-w-xl rounded-lg bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-poppins font-bold text-slate-blue">
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
            className="bg-slate-blue hover:bg-slate-blue/90 text-white"
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

const ClientInputPopup: React.FC = () => {
  return (
    <ErrorBoundary>
      <ClientInputPopupContent />
    </ErrorBoundary>
  );
};

export default ClientInputPopup;