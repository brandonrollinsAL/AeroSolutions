import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import helmet from "helmet";
import { authMiddleware } from "./utils/auth";
import { cachingMiddleware, conditionalRequestMiddleware } from "./utils/caching";
import { apiRateLimiter, authRateLimiter, defaultRateLimiter } from "./utils/rate-limiting";
import compression from "express-compression";

// Extend Express Request type to include user property and timing
declare global {
  namespace Express {
    interface Request {
      user?: any;
      startTime?: [number, number]; // hrtime tuple
    }
  }
}

const app = express();

// Performance and security middleware
// Compress responses
app.use(compression({
  threshold: 0, // Compress all responses
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      // Don't compress responses with this request header
      return false;
    }
    // Compress by default
    return true;
  }
}));

// Apply security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // For development
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "https://api.openai.com", "https://api.x.ai"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Apply caching headers
app.use(cachingMiddleware());
app.use(conditionalRequestMiddleware());

// Apply rate limiting - protect different routes with appropriate limits
app.use('/api/auth', authRateLimiter);  // Stricter rate limiting for auth endpoints
app.use('/api', apiRateLimiter);        // Standard API rate limiting
app.use(defaultRateLimiter);            // Default rate limiting for all other routes

// Body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// Define a custom type for the request with timing
interface TimedRequest extends Request {
  startTime?: [number, number]; // hrtime tuple
}

// Add request timing middleware
app.use((req: TimedRequest, res: Response, next: NextFunction) => {
  // Track request start time
  req.startTime = process.hrtime();
  
  // Store original send method
  const originalSend = res.send;
  
  // Override send method to add timing header
  res.send = function(...args) {
    if (req.startTime) {
      const diff = process.hrtime(req.startTime);
      const time = diff[0] * 1e3 + diff[1] * 1e-6; // time in ms
      res.setHeader('X-Response-Time', `${time.toFixed(2)}ms`);
    }
    return originalSend.apply(this, args);
  };
  
  next();
});

// JWT Authentication middleware - only apply to API routes
app.use('/api', authMiddleware);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize sample data
  try {
    await (storage as any).initSampleData();
    log("Sample data initialized successfully");
  } catch (error) {
    log(`Error initializing sample data: ${error}`, "error");
  }
  
  const server = await registerRoutes(app);

  // Global error handling middleware
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    // Log detailed error information
    console.error(`Error processing ${req.method} ${req.path}:`, err);
    
    // Determine appropriate status code
    const status = err.status || err.statusCode || 500;
    
    // Create appropriate error message
    const message = err.message || "Internal Server Error";
    
    // Create response object with appropriate level of detail
    const errorResponse = {
      success: false,
      message,
      // Include error details in development, but not in production
      ...(process.env.NODE_ENV !== 'production' && { 
        error: {
          name: err.name,
          stack: err.stack,
          code: err.code
        }
      }),
      path: req.path,
      timestamp: new Date().toISOString()
    };
    
    // Send error response
    res.status(status).json(errorResponse);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
