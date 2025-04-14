import { useState, useEffect, useCallback } from 'react';
import { detectPlatform, PlatformType, logPlatformError } from '@/utils/platformUtils';

interface UsePlatformOptions {
  enableErrorLogging?: boolean;
}

interface PlatformState {
  type: PlatformType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  browser?: string;
  os?: string;
  version?: string;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
}

export function usePlatform(options: UsePlatformOptions = {}) {
  const { enableErrorLogging = true } = options;
  
  // Initialize with detected platform
  const initialPlatform = detectPlatform();
  const [platformState, setPlatformState] = useState<PlatformState>({
    ...initialPlatform,
    isTablet: initialPlatform.isMobile && 
              initialPlatform.viewportWidth >= 768 && 
              initialPlatform.viewportWidth <= 1024,
    isDesktop: !initialPlatform.isMobile || 
               initialPlatform.viewportWidth > 1024
  });
  
  // Update platform state on window resize
  useEffect(() => {
    const handleResize = () => {
      const platform = detectPlatform();
      setPlatformState({
        ...platform,
        isTablet: platform.isMobile && 
                 platform.viewportWidth >= 768 && 
                 platform.viewportWidth <= 1024,
        isDesktop: !platform.isMobile || 
                  platform.viewportWidth > 1024
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Error boundary handler with platform context
  const handleComponentError = useCallback((error: Error, componentName: string) => {
    if (enableErrorLogging) {
      logPlatformError(error, componentName);
    }
    console.error(`Error in ${componentName}:`, error);
  }, [enableErrorLogging]);
  
  // Get optimized styles for the current platform
  const getOptimizedStyles = useCallback((baseStyles: Record<string, any> = {}): Record<string, any> => {
    const { type } = platformState;
    
    // Common optimizations
    const optimizedStyles = {
      ...baseStyles,
      tapHighlightColor: 'transparent',
      userSelect: 'none',
    };
    
    // Platform-specific optimizations
    if (type === 'ios') {
      return {
        ...optimizedStyles,
        WebkitAppearance: 'none',
        WebkitTapHighlightColor: 'rgba(0,0,0,0)',
        // Momentum scrolling on iOS
        WebkitOverflowScrolling: 'touch',
      };
    } else if (type === 'android') {
      return {
        ...optimizedStyles,
        // Android optimizations
        outlineWidth: 0,
        // Fix for Android button borders
        borderStyle: baseStyles.borderStyle || 'solid',
      };
    }
    
    return optimizedStyles;
  }, [platformState]);
  
  // Touch-friendly hitslop for small interactive elements
  const touchFriendlyHitSlop = useCallback(() => {
    if (platformState.isTouch) {
      return {
        top: 10, 
        right: 10, 
        bottom: 10, 
        left: 10
      };
    }
    return undefined;
  }, [platformState.isTouch]);
  
  // Get font size adjusted for the platform
  const getAdjustedFontSize = useCallback((baseFontSize: number): number => {
    const { type, devicePixelRatio } = platformState;
    
    if (type === 'ios') {
      // iOS devices often need slightly larger text
      return baseFontSize * 1.05;
    } else if (type === 'android') {
      // Adjust for Android's different pixel density handling
      const densityAdjustment = devicePixelRatio > 2.5 ? 0.95 : 1;
      return baseFontSize * densityAdjustment;
    }
    
    return baseFontSize;
  }, [platformState]);
  
  return {
    ...platformState,
    handleComponentError,
    getOptimizedStyles,
    touchFriendlyHitSlop,
    getAdjustedFontSize
  };
}