import { useEffect } from 'react';

/**
 * Component that provides global content protection features
 * - Disables right-click on the entire page
 * - Disables keyboard shortcuts for saving content
 * - Adds custom message when attempting to copy content
 */
export default function ContentProtection() {
  useEffect(() => {
    // Disable right-click on the entire document
    const handleContextMenu = (e: MouseEvent) => {
      // Allow right-click on form elements
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.tagName === 'SELECT' ||
          target.isContentEditable) {
        return true;
      }
      
      e.preventDefault();
      return false;
    };

    // Disable keyboard shortcuts for saving (Ctrl+S, Command+S)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && 
          (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        return false;
      }
    };

    // Add custom copy message when text is selected
    const handleCopy = (e: ClipboardEvent) => {
      // Only add the custom message if text is actually selected
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) {
        // Get the selected text
        const selectedText = selection.toString();
        
        // Add a custom citation to copied content
        const copyrightText = `\n\n© ${new Date().getFullYear()} Elevion. Learn more at www.elevion.dev`;
        
        // Create a new clipboard data
        e.clipboardData?.setData('text/plain', selectedText + copyrightText);
        
        // Prevent the default copy behavior
        e.preventDefault();
      }
    };

    // Disable print
    const handlePrint = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && 
          (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        return false;
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handlePrint);
    document.addEventListener('copy', handleCopy);

    // Clean up event listeners on component unmount
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handlePrint);
      document.removeEventListener('copy', handleCopy);
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}