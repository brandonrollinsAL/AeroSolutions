import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSchema } from "@shared/schema";
import { z } from "zod";
import { generateCopilotResponse } from "./utils/openai";
import NodeCache from 'node-cache';

// Performance optimization: Cache for API responses
// - TTL: 300 seconds (5 minutes)
// - Maximum 50 items in cache
const apiCache = new NodeCache({ 
  stdTTL: 300, 
  checkperiod: 60,
  maxKeys: 50 
});

// Create a simple rate limiter to prevent abuse
const rateLimiter = {
  windowMs: 60000, // 1 minute window
  maxRequests: 30, // 30 requests per minute
  clients: new Map<string, { count: number, resetTime: number }>(),
  
  check(ip: string): boolean {
    const now = Date.now();
    const client = this.clients.get(ip);
    
    // Create new client entry if not exists or reset if window expired
    if (!client || now > client.resetTime) {
      this.clients.set(ip, { 
        count: 1, 
        resetTime: now + this.windowMs 
      });
      return true;
    }
    
    // Increment request count
    client.count++;
    
    // Check if exceeded limit
    if (client.count > this.maxRequests) {
      return false;
    }
    
    return true;
  },
  
  // Middleware for Express
  middleware(req: Request, res: Response, next: NextFunction) {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    
    if (!rateLimiter.check(clientIp)) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later',
        retry_after: Math.ceil((rateLimiter.clients.get(clientIp)?.resetTime || 0) - Date.now()) / 1000
      });
    }
    
    next();
  },
  
  // Cleanup old entries every 5 minutes
  cleanup() {
    const now = Date.now();
    // Use Array.from to avoid TypeScript iterator issues
    Array.from(this.clients.entries()).forEach(([ip, client]) => {
      if (now > client.resetTime) {
        this.clients.delete(ip);
      }
    });
  }
};

// Start cleanup interval
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup API routes - all prefixed with /api
  
  // Apply rate limiting to all API routes
  app.use('/api', rateLimiter.middleware);
  
  // Add response time tracking for performance monitoring
  app.use((req, res, next) => {
    // Start timer
    const startTime = process.hrtime();
    
    // Store original end method
    const originalEnd = res.end;
    
    // Override end method with proper typing
    res.end = function(this: any, chunk?: any, encoding?: any, callback?: any) {
      // Calculate response time
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const responseTimeMs = (seconds * 1000) + (nanoseconds / 1000000);
      
      // Log response time
      console.log(`${req.method} ${req.originalUrl} - ${responseTimeMs.toFixed(2)}ms`);
      
      // Call original end method
      return originalEnd.call(this, chunk, encoding, callback);
    } as any;
    
    next();
  });
  
  // Add compression middleware to all routes
  // Note: we're not using Express compression since we need to avoid
  // installing more packages. In a real app, you'd use compression middleware.
  
  // Contact submission endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      // Validate request body
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({
          success: false,
          message: "Invalid request format"
        });
      }
      
      // Parse and validate the contact data using Zod schema
      try {
        const contactData = insertContactSchema.parse(req.body);
        
        // Additional validation (beyond schema)
        if (contactData.email && !contactData.email.includes('@')) {
          return res.status(400).json({
            success: false,
            message: "Invalid email format"
          });
        }
        
        // Store contact submission
        const contactSubmission = await storage.createContactSubmission(contactData);
        
        // Log successful submission
        console.log(`Contact submission received from ${contactData.name} (${contactData.email})`);
        
        // In a production app, you would send an email notification here using SendGrid API
        
        // Send successful response with submission data
        res.status(201).json({
          success: true,
          message: "Contact submission received",
          data: contactSubmission,
          timestamp: new Date().toISOString()
        });
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            message: "Invalid contact form data",
            errors: validationError.errors.map(err => ({
              path: err.path.join('.'),
              message: err.message
            }))
          });
        }
        throw validationError; // Re-throw if it's not a ZodError
      }
    } catch (error) {
      console.error("Contact submission error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      res.status(500).json({
        success: false,
        message: "Failed to process contact submission",
        error: errorMessage
      });
    }
  });

  // Client preview code validation
  app.post("/api/preview/validate", async (req, res) => {
    try {
      // Validate request body
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({
          success: false,
          message: "Invalid request format"
        });
      }
      
      const { code } = req.body;
      
      if (!code || typeof code !== "string") {
        return res.status(400).json({
          success: false,
          message: "Access code is required and must be a string"
        });
      }
      
      if (code.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Access code cannot be empty"
        });
      }
      
      // Log access attempt (for security audit purposes)
      console.log(`Access code validation attempt: ${code.substring(0, 3)}*****`);
      
      // Special case for demo codes
      if (code.toLowerCase() === "momanddad" || code.toLowerCase() === "countofmontecristobitch") {
        console.log(`Demo access code used: ${code.toLowerCase()}`);
        return res.status(200).json({
          success: true,
          message: "Demo access code validated successfully",
          accessType: "demo",
          timestamp: new Date().toISOString()
        });
      }
      
      // Validate against database
      const isValid = await storage.validateClientPreviewCode(code);
      
      if (isValid) {
        try {
          // Fetch preview details if available
          const previewDetails = await storage.getClientPreviewByCode(code);
          
          // In a real app, you would set a session cookie or return a JWT token
          return res.status(200).json({
            success: true,
            message: "Access code validated successfully",
            accessType: "client",
            clientPreview: previewDetails,
            timestamp: new Date().toISOString()
          });
        } catch (previewError) {
          console.error("Error fetching preview details:", previewError);
          // Still return success even if fetching additional details failed
          return res.status(200).json({
            success: true,
            message: "Access code validated successfully",
            accessType: "client",
            timestamp: new Date().toISOString()
          });
        }
      } else {
        // Failed validation
        return res.status(401).json({
          success: false,
          message: "Invalid or expired access code",
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Access code validation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      res.status(500).json({
        success: false,
        message: "Failed to validate access code",
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Copilot chatbot API with caching
  app.post("/api/copilot", async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message || typeof message !== "string") {
        return res.status(400).json({
          success: false,
          message: "Message is required and must be a string"
        });
      }
      
      if (message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Message cannot be empty"
        });
      }
      
      if (message.length > 500) {
        return res.status(400).json({
          success: false,
          message: "Message is too long (maximum 500 characters)"
        });
      }
      
      // Generate a cache key for this message
      const cacheKey = Buffer.from(message.trim().toLowerCase()).toString('base64');
      
      // Check if we have a cached response
      const cachedResponse = apiCache.get<string>(cacheKey);
      
      if (cachedResponse) {
        console.log('API Cache hit for copilot response');
        
        return res.status(200).json({
          success: true,
          response: cachedResponse,
          timestamp: new Date().toISOString(),
          cached: true
        });
      }
      
      // No cache hit, generate a new response
      console.log('API Cache miss for copilot response');
      
      // Generate a response using OpenAI
      const aiResponse = await generateCopilotResponse(message);
      
      if (!aiResponse) {
        return res.status(500).json({
          success: false,
          message: "Failed to generate AI response"
        });
      }
      
      // Cache the successful response for future requests
      apiCache.set(cacheKey, aiResponse);
      
      res.status(200).json({
        success: true,
        response: aiResponse,
        timestamp: new Date().toISOString(),
        cached: false
      });
    } catch (error) {
      console.error("Copilot error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      res.status(500).json({
        success: false,
        message: "Failed to process copilot request",
        error: errorMessage
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
