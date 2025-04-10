import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
