import React from 'react';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';
import ErrorBoundary from '@/components/ui/error-boundary';
import { usePopup } from '@/contexts/PopupContext';

/**
 * Preview Popup Component
 * Used for displaying preview content in a popup/modal window
 */
const PreviewPopupContent: React.FC = () => {
  const { closePopup, popupData } = usePopup();
  const [, navigate] = useLocation();
  
  // Example of using TanStack Query to fetch preview data
  const { isLoading, error, data } = useQuery({
    queryKey: ['/api/preview', popupData?.previewId],
    queryFn: async () => {
      // In a real scenario, we would fetch preview data from the API
      // For now, we'll just simulate a successful response
      return { 
        title: 'Preview',
        description: 'Here\'s a preview of your design or content.',
        imageUrl: null
      };
    },
    // Only run if we have a previewId in the popup data
    enabled: !!popupData?.previewId,
  });
  
  // Handle close button click
  const handleClose = () => {
    closePopup();
    navigate('/');
  };
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-electric-cyan border-t-transparent rounded-full"></div>
            <span className="ml-3 text-slate-600">Loading preview...</span>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h3 className="text-xl font-medium text-red-600 mb-4">Error Loading Preview</h3>
          <p className="text-slate-600 mb-6">
            We encountered an issue while loading the preview content. Please try again.
          </p>
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <Helmet>
        <title>Preview | Elevion</title>
      </Helmet>
      
      <div className="relative w-full max-w-4xl rounded-lg bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-poppins font-bold text-slate-blue">
            {data?.title || 'Preview'}
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
              {data?.imageUrl ? (
                <img 
                  src={data.imageUrl} 
                  alt="Preview" 
                  className="max-w-full max-h-[60vh] object-contain"
                />
              ) : (
                <p className="text-slate-500 text-center">Preview Content Placeholder</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button 
            className="bg-electric-cyan hover:bg-electric-cyan/90 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
};

const PreviewPopup: React.FC = () => {
  return (
    <ErrorBoundary>
      <PreviewPopupContent />
    </ErrorBoundary>
  );
};

export default PreviewPopup;