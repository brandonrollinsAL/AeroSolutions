import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react';
import ErrorBoundary from '@/components/ui/error-boundary';
import { usePopup } from '@/contexts/PopupContext';

/**
 * Lightbox Popup Component
 * Used for displaying images or media in a full-screen lightbox
 */
const LightboxPopupContent: React.FC = () => {
  const { closePopup, popupData } = usePopup();
  const [, navigate] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Example of using TanStack Query to fetch gallery data
  const { isLoading, error, data } = useQuery({
    queryKey: ['/api/gallery', popupData?.galleryId],
    queryFn: async () => {
      // In a real scenario, we would fetch gallery data from the API
      // For now, we'll just simulate a successful response
      return { 
        images: popupData?.images || [
          { 
            id: 1, 
            src: null, // Would be an actual URL in production
            caption: 'Image 1 caption' 
          }
        ],
        title: popupData?.title || 'Image Gallery'
      };
    },
    // Only run if we have gallery data
    enabled: !!popupData,
  });
  
  // Handle close button click
  const handleClose = () => {
    closePopup();
    navigate('/');
  };
  
  // Navigate to previous image
  const handlePrevious = () => {
    if (!data?.images || data.images.length <= 1) return;
    setZoomLevel(1); // Reset zoom when changing images
    setCurrentIndex((prev) => (prev === 0 ? data.images.length - 1 : prev - 1));
  };
  
  // Navigate to next image
  const handleNext = () => {
    if (!data?.images || data.images.length <= 1) return;
    setZoomLevel(1); // Reset zoom when changing images
    setCurrentIndex((prev) => (prev === data.images.length - 1 ? 0 : prev + 1));
  };
  
  // Handle zoom in
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };
  
  // Handle zoom out
  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  };
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
        <div className="rounded-lg p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-electric-cyan border-t-transparent rounded-full"></div>
            <span className="ml-3 text-white">Loading gallery...</span>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
        <div className="bg-light-gray p-8 rounded-lg shadow-lg max-w-md">
          <h3 className="text-xl font-medium text-red-600 mb-2">Error Loading Gallery</h3>
          <p className="text-slate-700 mb-6">
            We encountered an issue while loading the gallery. Please try again.
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
  
  const currentImage = data?.images?.[currentIndex];
  const hasMultipleImages = data?.images && data.images.length > 1;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <Helmet>
        <title>{data?.title || 'Image Gallery'} | Elevion</title>
      </Helmet>
      
      {/* Top control bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
        <h2 className="text-white font-medium">{data?.title || 'Image Gallery'}</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleZoomOut}
            className="text-white hover:bg-white/10"
            disabled={zoomLevel <= 0.5}
          >
            <ZoomOut className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleZoomIn}
            className="text-white hover:bg-white/10"
            disabled={zoomLevel >= 3}
          >
            <ZoomIn className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClose}
            className="text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <div className="relative w-full max-w-6xl px-12">
        {/* Navigation buttons */}
        {hasMultipleImages && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              className="absolute left-0 top-1/2 -translate-y-1/2 text-white hover:bg-white/10"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-white hover:bg-white/10"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </>
        )}
        
        {/* Image container */}
        <div className="flex items-center justify-center overflow-hidden">
          {currentImage?.src ? (
            <img 
              src={currentImage.src} 
              alt={currentImage.caption || 'Gallery image'}
              className="max-h-[70vh] object-contain transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})` }}
            />
          ) : (
            <div className="p-32 rounded-md bg-slate-800 flex items-center justify-center">
              <p className="text-slate-300 text-center">Image Lightbox Placeholder</p>
            </div>
          )}
        </div>
        
        {/* Caption and controls */}
        <div className="mt-4 flex justify-between items-center">
          <p className="text-white text-sm">
            {currentImage?.caption || 'Image caption would appear here'}
          </p>
          
          {hasMultipleImages && (
            <p className="text-white text-sm">
              {currentIndex + 1} / {data?.images.length}
            </p>
          )}
          
          <Button 
            variant="outline" 
            size="sm"
            className="text-white border-white/30 hover:bg-white/10"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
};

const LightboxPopup: React.FC = () => {
  return (
    <ErrorBoundary>
      <LightboxPopupContent />
    </ErrorBoundary>
  );
};

export default LightboxPopup;