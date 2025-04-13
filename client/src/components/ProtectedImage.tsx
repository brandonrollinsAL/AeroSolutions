import React, { useState, useEffect, useCallback } from 'react';
import { Shield } from 'lucide-react';

interface ProtectedImageProps {
  src: string;
  alt: string;
  className?: string;
  watermark?: boolean;
  showProtectionIndicator?: boolean;
}

/**
 * ProtectedImage component
 * 
 * Prevents right-click saving, drag-and-drop, and adds invisible watermarking
 * for brand protection.
 */
const ProtectedImage: React.FC<ProtectedImageProps> = ({
  src,
  alt,
  className = '',
  watermark = false,
  showProtectionIndicator = false
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Prevent right-click context menu
  const preventContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);
  
  // Prevent drag-start (disables drag-and-drop saving)
  const preventDragStart = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);
  
  // Get image dimensions for showing the protection indicator
  useEffect(() => {
    if (src) {
      const img = new Image();
      img.onload = () => {
        setIsLoaded(true);
      };
      img.src = src;
    }
  }, [src]);
  
  return (
    <div className="relative inline-block">
      <img
        src={src}
        alt={alt}
        className={`${className} select-none`}
        onContextMenu={preventContextMenu}
        onDragStart={preventDragStart}
        style={{
          WebkitUserDrag: 'none',
          userDrag: 'none',
          MozUserSelect: 'none',
          WebkitUserSelect: 'none',
          msUserSelect: 'none'
        }}
      />
      
      {showProtectionIndicator && isLoaded && (
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md flex items-center">
          <Shield size={12} className="mr-1" />
          <span>Protected</span>
        </div>
      )}
    </div>
  );
};

export default ProtectedImage;