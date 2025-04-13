import React, { useState, useEffect, ImgHTMLAttributes, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ProtectedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onContextMenu' | 'onDragStart'> {
  src: string;
  alt: string;
  className?: string;
  watermark?: boolean;
}

/**
 * A component that prevents users from right-clicking, saving, or downloading images
 * Can also optionally apply a subtle watermark
 */
export default function ProtectedImage({ 
  src, 
  alt, 
  className, 
  watermark = false,
  ...props 
}: ProtectedImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const img = imgRef.current;
    if (img) {
      img.draggable = false;
      
      // If the image is already loaded, update state
      if (img.complete) {
        setLoading(false);
      }
    }
  }, [src]);

  // Prevent context menu (right-click)
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  // Prevent drag
  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    return false;
  };

  // Prevent keyboard shortcuts that might be used to save images
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent Ctrl+S, Command+S
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      return false;
    }
  };

  // Handle image load
  const handleLoad = () => {
    setLoading(false);
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden", 
        className
      )}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      onKeyDown={handleKeyDown}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      )}
      
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onLoad={handleLoad}
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        style={{ 
          WebkitUserSelect: 'none',
          userSelect: 'none',
          pointerEvents: loading ? 'none' : 'auto'
        }}
        {...props}
      />
      
      {watermark && !loading && (
        <div className="absolute bottom-2 right-2 text-xs text-white bg-black/30 px-2 py-1 rounded backdrop-blur-sm">
          © Elevion
        </div>
      )}
    </div>
  );
}