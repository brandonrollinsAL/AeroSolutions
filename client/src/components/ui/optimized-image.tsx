import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  placeholderSrc?: string;  // Low quality image placeholder
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  containerClassName?: string;
  priority?: boolean;       // For critical images above the fold
  onLoad?: () => void;
  loadingStrategy?: 'lazy' | 'eager';
}

/**
 * OptimizedImage component with blur-up loading and best practices
 * Improves user experience and Core Web Vitals metrics
 */
export function OptimizedImage({
  src,
  placeholderSrc,
  alt,
  width,
  height,
  className = "",
  containerClassName = "",
  priority = false,
  onLoad,
  loadingStrategy = 'lazy',
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc || src);
  
  // Generate placeholder if not provided
  const placeholder = placeholderSrc || src.replace(/\.(jpe?g|png|webp)$/, '-tiny.$1');
  const loading = priority ? 'eager' : loadingStrategy;
  const sizes = props.sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';

  useEffect(() => {
    // Reset when src changes
    setIsLoaded(false);
    setCurrentSrc(placeholderSrc || placeholder);
    
    // Preload the image
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
      if (onLoad) onLoad();
    };
    
    return () => {
      img.onload = null;
    };
  }, [src, placeholder, placeholderSrc, onLoad]);

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      <img 
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding="async"
        sizes={sizes}
        className={cn(
          "transition-all duration-500 ease-in-out",
          isLoaded ? "opacity-100 blur-0" : "opacity-80 blur-sm scale-105",
          className
        )}
        {...props}
      />
      
      {/* Add image source in <source> for WebP support with JPEG fallback */}
      {isLoaded && (
        <noscript>
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={className}
            loading={loading}
          />
        </noscript>
      )}
    </div>
  );
}