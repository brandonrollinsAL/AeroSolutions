import { Request, Response, NextFunction } from 'express';

// Cache durations in seconds
export const CACHE_DURATIONS = {
  STATIC: 60 * 60 * 24 * 7, // 7 days for static assets
  IMAGES: 60 * 60 * 24 * 30, // 30 days for images
  DATA: 60 * 60, // 1 hour for API data
  HTML: 0, // No cache for HTML by default
};

/**
 * Generate Cache-Control headers based on content type and settings
 */
export function generateCacheHeaders(maxAge: number, isPublic = true, staleWhileRevalidate = 0) {
  const directives = [
    isPublic ? 'public' : 'private',
    `max-age=${maxAge}`,
  ];
  
  if (staleWhileRevalidate > 0) {
    directives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  }
  
  return directives.join(', ');
}

/**
 * Apply appropriate cache headers based on file type
 */
export function setCacheHeaders(req: Request, res: Response) {
  const path = req.path.toLowerCase();
  let maxAge = CACHE_DURATIONS.STATIC;
  let staleWhileRevalidate = 60 * 60; // 1 hour stale-while-revalidate by default
  
  // Determine cache duration based on file type
  if (path.match(/\.(jpe?g|png|gif|webp|svg|ico)$/i)) {
    maxAge = CACHE_DURATIONS.IMAGES;
    staleWhileRevalidate = 60 * 60 * 24; // 1 day
  } else if (path.match(/\.(css|js|woff2|ttf|otf|eot|woff)$/i)) {
    // The longer cache time is justified since our assets have content hashes in the filename
    maxAge = CACHE_DURATIONS.STATIC;
  } else if (path.match(/\.(html|htm)$/i) || path === '/') {
    maxAge = CACHE_DURATIONS.HTML;
    staleWhileRevalidate = 0;
  } else if (path.startsWith('/api/')) {
    maxAge = CACHE_DURATIONS.DATA;
  }
  
  // Set Cache-Control header
  const cacheControl = generateCacheHeaders(maxAge, true, staleWhileRevalidate);
  res.setHeader('Cache-Control', cacheControl);
  
  // Add Vary header for content negotiation - helps CDNs cache properly
  res.setHeader('Vary', 'Accept-Encoding');
  
  // Set ETag for efficient caching with validation
  if (!res.getHeader('ETag')) {
    res.setHeader('ETag', `W/"${Date.now().toString(36)}"`);
  }
  
  return res;
}

/**
 * Middleware to apply caching headers automatically
 */
export function cachingMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip for non-GET/HEAD requests
    if (!['GET', 'HEAD'].includes(req.method)) {
      return next();
    }
    
    // Store the original send function
    const originalSend = res.send;
    
    // Override the send function to apply caching headers before sending
    res.send = function(body) {
      setCacheHeaders(req, res);
      return originalSend.call(this, body);
    };
    
    next();
  };
}

/**
 * Middleware to handle conditional requests (If-None-Match, If-Modified-Since)
 */
export function conditionalRequestMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only process GET/HEAD requests
    if (!['GET', 'HEAD'].includes(req.method)) {
      return next();
    }
    
    // Set Last-Modified header if not present
    if (!res.getHeader('Last-Modified')) {
      res.setHeader('Last-Modified', new Date().toUTCString());
    }
    
    // Implement HTTP conditional request handling
    const ifNoneMatch = req.headers['if-none-match'];
    const ifModifiedSince = req.headers['if-modified-since'];
    
    if (ifNoneMatch && res.getHeader('ETag') === ifNoneMatch) {
      res.status(304).end();
      return;
    }
    
    if (ifModifiedSince) {
      const lastModified = new Date(res.getHeader('Last-Modified') as string).getTime();
      const ifModifiedSinceDate = new Date(ifModifiedSince as string).getTime();
      
      if (lastModified <= ifModifiedSinceDate) {
        res.status(304).end();
        return;
      }
    }
    
    next();
  };
}