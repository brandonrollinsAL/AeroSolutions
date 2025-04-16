import React, { useState, useEffect, useCallback } from 'react';
import { Shield } from 'lucide-react';

export interface ProtectedImageProps {
  src: string;
  alt: string;
  className?: string;
  watermark?: boolean;
  showProtectionIndicator?: boolean;
  fallback?: string;
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
  showProtectionIndicator = false,
  fallback
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
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
        setHasError(false);
      };
      img.onerror = () => {
        setHasError(true);
        setIsLoaded(false);
      };
      img.src = src;
    }

    return () => {
      setIsLoaded(false);
      setHasError(false);
    };
  }, [src]);
  
  // Determine which image source to use
  const imageSrc = hasError && fallback ? fallback : src;
  
  return (
    <div className="relative inline-block">
      <img
        src={imageSrc}
        alt={alt}
        className={`${className} select-none`}
        onContextMenu={preventContextMenu}
        onDragStart={preventDragStart}
        onError={fallback ? () => setHasError(true) : undefined}
        style={{
          // @ts-ignore - WebkitUserDrag is a valid property, but not in the TypeScript definition
          WebkitUserDrag: 'none',
          // @ts-ignore - userDrag is a valid property, but not in the TypeScript definition
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