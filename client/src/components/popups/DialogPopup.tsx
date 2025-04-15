import React from 'react';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';
import ErrorBoundary from '@/components/ui/error-boundary';
import { usePopup } from '@/contexts/PopupContext';

/**
 * Dialog Popup Component
 * Generic dialog popup for various confirmation or information displays
 */
const DialogPopupContent: React.FC = () => {
  const { closePopup, popupData } = usePopup();
  const [, navigate] = useLocation();
  
  // Example of using TanStack Query to fetch dialog data
  const { isLoading, error, data } = useQuery({
    queryKey: ['/api/dialog', popupData?.dialogId],
    queryFn: async () => {
      // In a real scenario, we would fetch dialog data from the API
      // For now, we'll just simulate a successful response based on popupData
      const type = popupData?.type || 'info';
      
      return { 
        title: popupData?.title || 'Confirmation',
        message: popupData?.message || 'Are you sure you want to proceed with this action?',
        type: type, // 'info', 'warning', 'error', 'success'
        confirmLabel: popupData?.confirmLabel || 'Confirm',
        cancelLabel: popupData?.cancelLabel || 'Cancel'
      };
    },
    // Only run if we have dialog data
    enabled: !!popupData,
  });
  
  // Handle close/cancel button click
  const handleClose = () => {
    closePopup();
    navigate('/');
  };
  
  // Handle confirm button click
  const handleConfirm = () => {
    // Here you would typically perform the confirmed action
    // For now, we'll just close the dialog
    closePopup();
    navigate('/');
  };
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-4 border-slate-blue border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
          <h3 className="text-xl font-medium text-red-600 mb-2">Error</h3>
          <p className="text-slate-600 mb-4">
            We encountered an issue while loading the dialog. Please try again.
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
  
  const dialogTypeStyles = {
    info: {
      icon: null,
      headerColor: 'text-slate-blue',
      buttonColor: 'bg-slate-blue hover:bg-slate-blue/90 text-white',
    },
    warning: {
      icon: <AlertTriangle className="h-6 w-6 text-amber-500 mr-2" />,
      headerColor: 'text-amber-600',
      buttonColor: 'bg-amber-500 hover:bg-amber-600 text-white',
    },
    error: {
      icon: <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />,
      headerColor: 'text-red-600',
      buttonColor: 'bg-red-500 hover:bg-red-600 text-white',
    },
    success: {
      icon: <CheckCircle className="h-6 w-6 text-green-500 mr-2" />,
      headerColor: 'text-green-600',
      buttonColor: 'bg-green-500 hover:bg-green-600 text-white',
    },
  };
  
  const type = data?.type || 'info';
  const styles = dialogTypeStyles[type] || dialogTypeStyles.info;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <Helmet>
        <title>{data?.title || 'Dialog'} | Elevion</title>
      </Helmet>
      
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {styles.icon}
            <h2 className={`text-2xl font-poppins font-bold ${styles.headerColor}`}>
              {data?.title || 'Dialog'}
            </h2>
          </div>
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
            {data?.message || 'This is a generic dialog popup that can be used for confirmations, alerts, or other interactive elements.'}
          </p>
          
          {popupData?.content && (
            <div className="space-y-6 py-4">
              <div className="p-4 border border-slate-200 rounded-md bg-slate-50">
                {popupData.content}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            {data?.cancelLabel || 'Cancel'}
          </Button>
          <Button 
            className={styles.buttonColor || 'bg-sunset-orange hover:bg-sunset-orange/90 text-white'}
            onClick={handleConfirm}
          >
            {data?.confirmLabel || 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
  );
};

const DialogPopup: React.FC = () => {
  return (
    <ErrorBoundary>
      <DialogPopupContent />
    </ErrorBoundary>
  );
};

export default DialogPopup;