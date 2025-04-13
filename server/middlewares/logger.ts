import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { v4 as uuidv4 } from 'uuid';

// Generate a unique ID for each request to correlate log entries
function generateRequestId(): string {
  return uuidv4();
}

// Global logger middleware that adds request tracking
export function loggerMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Generate unique request ID
    req.requestId = generateRequestId();
    
    // Log the request
    const requestData = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
      userId: req.isAuthenticated ? (req.isAuthenticated() ? req.user?.id : null) : null,
    };
    
    Logger.info(`Request ${req.method} ${req.originalUrl}`, requestData, 'http');
    
    // Capture response time
    const start = Date.now();
    
    // Capture original response end method
    const originalEnd = res.end;
    
    // Override end method to log response when it completes
    res.end = function(chunk, encoding, callback) {
      // Calculate response time
      const responseTime = Date.now() - start;
      
      // Log the response
      const responseData = {
        statusCode: res.statusCode,
        responseTime,
        requestId: req.requestId,
        userId: req.isAuthenticated ? (req.isAuthenticated() ? req.user?.id : null) : null,
      };
      
      // Log differently based on status code
      if (res.statusCode >= 500) {
        Logger.error(`Response ${res.statusCode} for ${req.method} ${req.originalUrl} (${responseTime}ms)`, 
          undefined, responseData, 'http');
      } else if (res.statusCode >= 400) {
        Logger.warn(`Response ${res.statusCode} for ${req.method} ${req.originalUrl} (${responseTime}ms)`, 
          responseData, 'http');
      } else {
        Logger.info(`Response ${res.statusCode} for ${req.method} ${req.originalUrl} (${responseTime}ms)`, 
          responseData, 'http');
      }
      
      // Call original end method
      return originalEnd.apply(this, [chunk, encoding, callback]);
    } as any;
    
    next();
  };
}

// Global error handler for uncaught exceptions
export function registerGlobalErrorHandlers() {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    Logger.error('Uncaught exception', error, {}, 'system');
    console.error('UNCAUGHT EXCEPTION:', error);
    
    // In production, you might want to try to gracefully restart
    // rather than letting the application crash and burn
    // process.exit(1);
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    Logger.error('Unhandled promise rejection', 
      reason instanceof Error ? reason : new Error(String(reason)), 
      { promise: String(promise) }, 'system');
    console.error('UNHANDLED REJECTION:', reason);
  });
  
  // Handle system warnings
  process.on('warning', (warning) => {
    Logger.warn('System warning', { 
      name: warning.name,
      message: warning.message,
      stack: warning.stack
    }, 'system');
  });
}

// Centralized logger class
export class Logger {
  static async info(message: string, context: any = {}, source: string = 'app') {
    // Log to console
    console.log(`[INFO] [${source}] ${message}`);
    
    // Store in database
    try {
      await storage.createLog({
        level: 'info',
        message,
        source,
        context: typeof context === 'object' ? JSON.stringify(context) : String(context),
        timestamp: new Date(),
        userId: context?.userId || null,
        sessionId: context?.sessionId || null,
        requestId: context?.requestId || null,
        ipAddress: context?.ip || null,
        userAgent: context?.userAgent || null,
        stackTrace: null
      });
    } catch (error) {
      console.error('Failed to store log in database:', error);
    }
  }
  
  static async warn(message: string, context: any = {}, source: string = 'app') {
    // Log to console
    console.warn(`[WARN] [${source}] ${message}`);
    
    // Store in database
    try {
      await storage.createLog({
        level: 'warn',
        message,
        source,
        context: typeof context === 'object' ? JSON.stringify(context) : String(context),
        timestamp: new Date(),
        userId: context?.userId || null,
        sessionId: context?.sessionId || null,
        requestId: context?.requestId || null,
        ipAddress: context?.ip || null,
        userAgent: context?.userAgent || null,
        stackTrace: null
      });
    } catch (error) {
      console.error('Failed to store log in database:', error);
    }
  }
  
  static async error(message: string, error?: Error, context: any = {}, source: string = 'app') {
    // Capture stack trace
    const stackTrace = error?.stack || new Error().stack || null;
    
    // Build error context
    const errorContext = {
      ...context,
      errorMessage: error?.message,
      errorName: error?.name,
    };
    
    // Log to console
    console.error(`[ERROR] [${source}] ${message}`, error);
    
    // Store in database
    try {
      await storage.createLog({
        level: 'error',
        message,
        source,
        context: typeof errorContext === 'object' ? JSON.stringify(errorContext) : String(errorContext),
        timestamp: new Date(),
        userId: context?.userId || null,
        sessionId: context?.sessionId || null,
        requestId: context?.requestId || null,
        ipAddress: context?.ip || null,
        userAgent: context?.userAgent || null,
        stackTrace
      });
    } catch (dbError) {
      console.error('Failed to store log in database:', dbError);
    }
  }
  
  static async debug(message: string, context: any = {}, source: string = 'app') {
    // Only log to database if in development
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    
    // Log to console
    console.debug(`[DEBUG] [${source}] ${message}`);
    
    // Store in database
    try {
      await storage.createLog({
        level: 'debug',
        message,
        source,
        context: typeof context === 'object' ? JSON.stringify(context) : String(context),
        timestamp: new Date(),
        userId: context?.userId || null,
        sessionId: context?.sessionId || null,
        requestId: context?.requestId || null,
        ipAddress: context?.ip || null,
        userAgent: context?.userAgent || null,
        stackTrace: null
      });
    } catch (error) {
      console.error('Failed to store log in database:', error);
    }
  }
  
  private static async log(
    level: string,
    message: string,
    context: any = {},
    source: string = 'app'
  ) {
    // Abstraction for future use
    const logMethod = (console as any)[level] || console.log;
    logMethod(`[${level.toUpperCase()}] [${source}] ${message}`);
  }
}

// Extend Express Request interface to include the requestId property
declare global {
    namespace Express {
        interface Request {
            requestId?: string;
        }
    }
}