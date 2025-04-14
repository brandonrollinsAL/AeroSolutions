/**
 * Platform detection and compatibility utilities
 */

export type PlatformType = 'web' | 'ios' | 'android' | 'unknown';

interface PlatformInfo {
  type: PlatformType;
  browser?: string;
  version?: string;
  isMobile: boolean;
  isTouch: boolean;
  os?: string;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
}

/**
 * Detect the current platform based on user agent and other factors
 */
export function detectPlatform(): PlatformInfo {
  // Default values
  const info: PlatformInfo = {
    type: 'web',
    isMobile: false,
    isTouch: false,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1
  };

  const ua = navigator.userAgent;
  
  // Detect if mobile
  info.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  
  // Detect touch capability
  info.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Detect OS
  if (/Android/i.test(ua)) {
    info.type = 'android';
    info.os = 'Android';
    const match = ua.match(/Android\s([0-9.]+)/);
    info.version = match ? match[1] : undefined;
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    info.type = 'ios';
    info.os = 'iOS';
    const match = ua.match(/OS\s([0-9_]+)/);
    info.version = match ? match[1].replace(/_/g, '.') : undefined;
  } else if (/Windows/i.test(ua)) {
    info.os = 'Windows';
  } else if (/Mac OS X/i.test(ua)) {
    info.os = 'macOS';
  } else if (/Linux/i.test(ua)) {
    info.os = 'Linux';
  }
  
  // Detect browser
  if (/Chrome/i.test(ua)) {
    info.browser = 'Chrome';
  } else if (/Firefox/i.test(ua)) {
    info.browser = 'Firefox';
  } else if (/Safari/i.test(ua)) {
    info.browser = 'Safari';
  } else if (/Edge/i.test(ua)) {
    info.browser = 'Edge';
  } else if (/MSIE|Trident/i.test(ua)) {
    info.browser = 'Internet Explorer';
  }
  
  return info;
}

/**
 * Check if the current viewport is in a mobile size range
 */
export function isMobileViewport(): boolean {
  return window.innerWidth < 768;
}

/**
 * Check if the current device is a tablet
 */
export function isTablet(): boolean {
  const platform = detectPlatform();
  return platform.isMobile && window.innerWidth >= 768 && window.innerWidth <= 1024;
}

/**
 * Get CSS styles optimized for the current platform
 */
export function getPlatformOptimizedStyles(): Record<string, any> {
  const platform = detectPlatform();
  
  // Base styles
  const styles: Record<string, any> = {
    tapHighlightColor: 'transparent',
    userSelect: 'none',
  };
  
  // Platform-specific adjustments
  if (platform.type === 'ios') {
    // iOS specific optimizations
    styles.webkitAppearance = 'none';
    styles.webkitTapHighlightColor = 'rgba(0,0,0,0)';
  } else if (platform.type === 'android') {
    // Android specific optimizations
    styles.outlineWidth = 0;
    styles.overflowScrolling = 'touch';
  }
  
  return styles;
}

/**
 * Get a touch-friendly size for interactive elements based on platform
 */
export function getTouchFriendlySize(): number {
  const platform = detectPlatform();
  
  // Default size - web
  let size = 40;
  
  if (platform.type === 'ios') {
    // Apple's recommendation is 44px
    size = 44;
  } else if (platform.type === 'android') {
    // Material Design's recommendation is 48dp
    size = 48;
  }
  
  return size;
}

/**
 * Log platform-specific error with context
 */
export async function logPlatformError(error: Error, componentName: string): Promise<void> {
  const platform = detectPlatform();
  
  const errorContext = {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    component: componentName,
    platform: {
      type: platform.type,
      os: platform.os,
      browser: platform.browser,
      version: platform.version,
      isMobile: platform.isMobile,
      viewportWidth: platform.viewportWidth,
      viewportHeight: platform.viewportHeight,
      devicePixelRatio: platform.devicePixelRatio
    }
  };
  
  try {
    // Send to server endpoint
    const response = await fetch('/api/log-platform-error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(errorContext)
    });
    
    if (!response.ok) {
      console.error('Failed to log platform error:', await response.text());
    }
  } catch (err) {
    // Fallback to console if fetch fails
    console.error('Platform error logging failed:', err);
    console.error('Original error:', errorContext);
  }
}