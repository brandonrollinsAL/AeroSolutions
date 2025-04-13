import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

// Generate a request ID
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Log middleware for Express
export function loggerMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Generate a unique request ID
    const requestId = generateRequestId();
    req.requestId = requestId;
    
    // Store the start time
    const startTime = Date.now();
    
    // Capture the original res.end method
    const originalEnd = res.end;
    
    // Override the res.end method to log when response is sent
    res.end = function(...args: any[]) {
      // Calculate response time
      const responseTime = Date.now() - startTime;
      
      // Log the request
      const logEntry = {
        timestamp: new Date(),
        level: 'info',
        message: `${req.method} ${req.path} ${res.statusCode} ${responseTime}ms`,
        source: 'express',
        context: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          responseTime,
          query: req.query,
          headers: {
            'user-agent': req.headers['user-agent'],
            'referer': req.headers['referer'],
          }
        },
        requestId,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        userId: req.user?.id
      };
      
      // Store log in database - don't await to avoid blocking response
      storage.createLog(logEntry).catch(err => {
        console.error('Failed to store log:', err);
      });
      
      // Call the original end method
      return originalEnd.apply(res, args);
    };
    
    next();
  };
}

// Register global error handling for uncaught exceptions
export function registerGlobalErrorHandlers() {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    const logEntry = {
      timestamp: new Date(),
      level: 'error',
      message: `Uncaught Exception: ${error.message}`,
      source: 'process',
      context: {},
      stackTrace: error.stack,
    };
    
    console.error('[UNCAUGHT EXCEPTION]', error);
    
    // Try to log to database
    try {
      storage.createLog(logEntry).catch(() => {
        // Last resort fallback if database logging fails
        console.error('Failed to log uncaught exception to database');
      });
    } catch (err) {
      console.error('Error during error logging:', err);
    }
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    const logEntry = {
      timestamp: new Date(),
      level: 'error',
      message: `Unhandled Promise Rejection: ${reason instanceof Error ? reason.message : String(reason)}`,
      source: 'process',
      context: {},
      stackTrace: reason instanceof Error ? reason.stack : undefined,
    };
    
    console.error('[UNHANDLED REJECTION]', reason);
    
    // Try to log to database
    try {
      storage.createLog(logEntry).catch(() => {
        // Last resort fallback if database logging fails
        console.error('Failed to log unhandled rejection to database');
      });
    } catch (err) {
      console.error('Error during error logging:', err);
    }
  });
}

// Create a simplified global logger
export class Logger {
  static async info(message: string, context: any = {}, source: string = 'app') {
    await this.log('info', message, context, source);
  }
  
  static async warn(message: string, context: any = {}, source: string = 'app') {
    await this.log('warn', message, context, source);
  }
  
  static async error(message: string, error?: Error, context: any = {}, source: string = 'app') {
    const combinedContext = { ...context };
    if (error) {
      combinedContext.error = {
        message: error.message,
        name: error.name,
      };
    }
    
    await this.log('error', message, combinedContext, source, error?.stack);
  }
  
  static async debug(message: string, context: any = {}, source: string = 'app') {
    await this.log('debug', message, context, source);
  }
  
  private static async log(
    level: string,
    message: string,
    context: any = {},
    source: string = 'app',
    stackTrace?: string
  ) {
    try {
      const logEntry = {
        timestamp: new Date(),
        level,
        message,
        source,
        context,
        stackTrace,
      };
      
      // Log to console for immediate feedback
      console[level](message, context);
      
      // Store in database
      await storage.createLog(logEntry);
    } catch (err) {
      // Fallback to console if database logging fails
      console.error('Failed to log to database:', err);
      console[level](message, context);
    }
  }
}

// Add type definitions for Express Request
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}