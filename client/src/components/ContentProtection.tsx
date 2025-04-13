import React, { useEffect } from 'react';

/**
 * ContentProtection component
 * 
 * Prevents right-click context menu and other content theft methods
 * across the entire site. Include this component once at the app root.
 */
const ContentProtection: React.FC = () => {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // Allow right-click on form inputs and links for accessibility
      const target = e.target as HTMLElement;
      const isFormElement = target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.tagName === 'SELECT' ||
                           target.isContentEditable;
      
      // Allow right-click for form elements for accessibility
      if (isFormElement) return;
      
      // Prevent right-click for other elements
      e.preventDefault();
      return false;
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl+S (save), Ctrl+P (print) and other hotkeys
      if ((e.ctrlKey || e.metaKey) && 
          (e.key === 's' || e.key === 'p' || e.key === 'u')) {
        e.preventDefault();
        return false;
      }
    };
    
    const handleSelectStart = (e: Event) => {
      // Allow selection of form inputs and links for accessibility
      const target = e.target as HTMLElement;
      const isFormElement = target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.tagName === 'SELECT' ||
                           target.isContentEditable;
      
      // Allow selection for form elements for accessibility
      if (isFormElement) return;
      
      // Limit selection for other elements to 100 characters
      const selection = window.getSelection();
      if (selection && selection.toString().length > 100) {
        // If selection too long, clear it
        selection.removeAllRanges();
        e.preventDefault();
        return false;
      }
    };
    
    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', handleSelectStart);
    
    // Cleanup on unmount
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, []);
  
  // This component doesn't render anything
  return null;
};

export default ContentProtection;