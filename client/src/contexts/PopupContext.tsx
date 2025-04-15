import React, { createContext, ReactNode, useContext, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';

type PopupType = 'client-input' | 'preview' | 'dialog' | 'lightbox' | null;

interface PopupContextProps {
  isOpen: boolean;
  currentPopup: PopupType;
  popupData: any;
  openPopup: (type: PopupType, data?: any) => void;
  closePopup: () => void;
  isLoading: boolean;
  error: Error | null;
}

const PopupContext = createContext<PopupContextProps | undefined>(undefined);

export const PopupProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPopup, setCurrentPopup] = useState<PopupType>(null);
  const [popupData, setPopupData] = useState<any>(null);
  const [, setLocation] = useLocation();

  // Optional: you could fetch popup-related data from your API
  const { isLoading, error } = useQuery({
    queryKey: [`/api/popup/${currentPopup}`, popupData?.id],
    queryFn: async () => {
      // If we have a current popup type and it requires data, fetch it
      if (currentPopup && popupData?.id) {
        // This is where you would fetch data if needed
        // For now, we'll just return the existing data
        return popupData;
      }
      return null;
    },
    // Only run the query if we have a current popup
    enabled: !!currentPopup && !!popupData?.id,
  });

  const openPopup = (type: PopupType, data: any = {}) => {
    setCurrentPopup(type);
    setPopupData(data);
    setIsOpen(true);
    
    // Update the route to reflect the current popup
    if (type) {
      setLocation(`/popup/${type}${data?.id ? `/${data.id}` : ''}`);
    }
  };

  const closePopup = () => {
    setIsOpen(false);
    setCurrentPopup(null);
    setPopupData(null);
    
    // Return to the previous route
    window.history.back();
  };

  return (
    <PopupContext.Provider
      value={{
        isOpen,
        currentPopup,
        popupData,
        openPopup,
        closePopup,
        isLoading,
        error: error as Error | null,
      }}
    >
      {children}
    </PopupContext.Provider>
  );
};

export const usePopup = () => {
  const context = useContext(PopupContext);
  if (context === undefined) {
    throw new Error('usePopup must be used within a PopupProvider');
  }
  return context;
};