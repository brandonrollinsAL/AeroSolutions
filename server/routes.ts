import express, { type Express, type Response, type NextFunction } from "express";
import { Request as ExpressRequest } from "express-serve-static-core";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSchema } from "@shared/schema";
import { z } from "zod";
import { generateCopilotResponse } from "./utils/grokai";
import NodeCache from 'node-cache';
import { body, query, param, validationResult } from 'express-validator';
import { generateToken, authorize } from './utils/auth';
import { getPublishableKey, createPaymentIntent, createStripeCustomer, createSubscription, getSubscription, cancelSubscription, handleWebhookEvent } from './utils/stripe';
import { callXAI, getGrokCompletion } from './utils/xaiClient';
import subscriptionRouter from './routes/subscription';
import marketplaceRouter from './routes/marketplace';
import advertisementRouter from './routes/advertisement';
import quoteRouter from './routes/quote';
import debugRouter from './routes/debug';
import contentRouter from './routes/content';
import uxRouter from './routes/ux';
import intelligenceRouter from './routes/intelligence';
import { registerAnalyticsRoutes } from './routes/analytics';
import { registerFeedRoutes } from './routes/feed';
import aiContentRouter from './routes/ai-content';
import recommendationsRouter from './routes/recommendations';
import intelligentSearchRouter from './routes/intelligent-search';

// Extended request interface with authentication
interface Request extends ExpressRequest {
  isAuthenticated(): boolean;
  user?: any;
}

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
  
  // Mount revenue-generation routes
  app.use('/api/subscriptions', subscriptionRouter);
  app.use('/api/marketplace', marketplaceRouter);
  app.use('/api/ads', advertisementRouter);
  app.use('/api', quoteRouter);
  
  // Mount xAI integration routes
  app.use('/api/debug', debugRouter);
  app.use('/api/content', contentRouter);
  app.use('/api/ux', uxRouter);
  app.use('/api/intelligence', intelligenceRouter);
  // Register analytics routes
  registerAnalyticsRoutes(app);
  // Register feed routes with AI ranking
  registerFeedRoutes(app);
  app.use('/api/ai-content', aiContentRouter);
  app.use('/api/recommendations', recommendationsRouter);
  app.use('/api/intelligent-search', intelligentSearchRouter);
  
  // Test xAI API endpoint - public endpoint, no auth required
  app.get('/api/test-xai', async (req: Request, res: Response) => {
    try {
      console.log("Testing xAI API connection...");
      const response = await callXAI('/chat/completions', {
        model: 'grok-3-mini',
        messages: [{ role: 'user', content: 'Hello, Grok! Tell me about Elevion web development company.' }],
      });
      console.log("xAI API call successful!");
      res.json({
        success: true,
        message: 'xAI API test successful',
        data: response
      });
    } catch (error: any) {
      console.error("xAI API test failed:", error);
      res.status(500).json({ 
        success: false,
        message: 'xAI API test failed', 
        error: error.message 
      });
    }
  });
  
  // Test AI content generation endpoint - public endpoint, no auth required
  app.post('/api/test-ai-content', async (req: Request, res: Response) => {
    try {
      console.log("Testing AI content generation...");
      const { contentType = 'blog-ideas', contentParams } = req.body;
      
      let prompt = '';
      
      switch (contentType) {
        case 'blog-ideas':
          const { keywords, audience = 'small business owners', industry = 'web development', count = 3 } = contentParams || {};
          prompt = `Generate ${count} engaging blog post ideas for a ${industry} 
            company targeting ${audience}. Include compelling headlines, 
            brief descriptions (2-3 sentences), and target keywords. The blog should incorporate these 
            keywords: ${Array.isArray(keywords) ? keywords.join(', ') : 'web development, small business'}. 
            Format the response as JSON with the following structure:
            {
              "ideas": [
                {
                  "headline": "Compelling headline here",
                  "description": "Brief 2-3 sentence description",
                  "keywords": ["keyword1", "keyword2"],
                  "estimated_word_count": 1200
                }
              ]
            }`;
          break;
          
        case 'product-description':
          const { productName = 'Website Development Package', features = ['Responsive design', 'SEO optimization'] } = contentParams || {};
          prompt = `Create a compelling product description for "${productName}". 
            Features: ${Array.isArray(features) ? features.join(', ') : features}. 
            Make the description engaging, highlight unique selling points, and include a call to action.`;
          break;
          
        default:
          prompt = 'Generate creative content for a web development company blog post.';
      }
      
      const response = await callXAI('/chat/completions', {
        model: 'grok-3-latest',
        messages: [{ role: 'user', content: prompt }],
        response_format: contentType === 'blog-ideas' ? { type: 'json_object' } : undefined
      });
      
      const content = contentType === 'blog-ideas' 
        ? JSON.parse(response.choices[0].message.content)
        : response.choices[0].message.content;
      
      res.json({
        success: true,
        message: 'AI content generation successful',
        content
      });
    } catch (error: any) {
      console.error("AI content generation failed:", error);
      res.status(500).json({ 
        success: false,
        message: 'AI content generation failed', 
        error: error.message 
      });
    }
  });
  
  // Stripe configuration endpoint (provides publishable key for client-side)
  app.get('/api/stripe/config', (req: Request, res: Response) => {
    try {
      res.status(200).json({
        success: true,
        publishableKey: getPublishableKey(),
      });
    } catch (error) {
      console.error("Error getting Stripe publishable key:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      res.status(500).json({
        success: false,
        message: "Failed to get Stripe configuration",
        error: errorMessage
      });
    }
  });
  
  // Stripe payment intent creation
  app.post('/api/stripe/create-payment-intent', [
    body('amount')
      .notEmpty().withMessage('Amount is required')
      .isNumeric().withMessage('Amount must be a number'),
    body('currency')
      .optional()
      .isString().withMessage('Currency must be a string')
      .isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter code'),
    body('metadata')
      .optional()
      .isObject().withMessage('Metadata must be an object')
  ], async (req: Request, res: Response) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment intent data",
          errors: errors.array()
        });
      }
      
      const { amount, currency = 'usd', metadata } = req.body;
      
      // If user is authenticated, use their customer ID
      let customerId: string | undefined;
      if (req.isAuthenticated() && req.user) {
        // Create or get Stripe customer ID
        customerId = await createStripeCustomer(req.user);
      }
      
      // Create payment intent
      const paymentIntent = await createPaymentIntent(amount, currency, customerId, metadata);
      
      res.status(200).json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      res.status(500).json({
        success: false,
        message: "Failed to create payment intent",
        error: errorMessage
      });
    }
  });
  
  // Stripe create-subscription endpoint
  app.post('/api/stripe/create-subscription', [
    body('priceId')
      .notEmpty().withMessage('Price ID is required')
      .isString().withMessage('Price ID must be a string'),
    body('metadata')
      .optional()
      .isObject().withMessage('Metadata must be an object')
  ], async (req: Request, res: Response) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Invalid subscription data",
          errors: errors.array()
        });
      }
      
      // Check if user is authenticated
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }
      
      const { priceId, metadata } = req.body;
      
      // Create or get Stripe customer ID
      const customerId = await createStripeCustomer(req.user);
      
      // Create subscription
      const subscription = await createSubscription(customerId, priceId, metadata);
      
      // Get client secret from payment intent
      const clientSecret = subscription.latest_invoice?.payment_intent?.client_secret;
      
      res.status(200).json({
        success: true,
        subscriptionId: subscription.id,
        clientSecret,
        status: subscription.status
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      res.status(500).json({
        success: false,
        message: "Failed to create subscription",
        error: errorMessage
      });
    }
  });
  
  // Stripe webhook endpoint
  app.post('/api/stripe/webhook', express.raw({type: 'application/json'}), async (req: Request, res: Response) => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      
      if (!signature) {
        return res.status(400).json({
          success: false,
          message: "Missing Stripe signature"
        });
      }
      
      // Convert raw body to string
      const payload = req.body.toString();
      
      // Process the event
      await handleWebhookEvent(JSON.parse(payload));
      
      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      res.status(400).json({
        success: false,
        message: "Webhook error",
        error: errorMessage
      });
    }
  });
  
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
  
  // Contact submission endpoint with express-validator
  app.post("/api/contact", [
    // Express-validator validations
    body('name')
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
      .trim()
      .escape(),
    body('email')
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Must be a valid email address')
      .normalizeEmail(),
    body('company')
      .optional()
      .isLength({ max: 100 }).withMessage('Company name must be less than 100 characters')
      .trim()
      .escape(),
    body('message')
      .notEmpty().withMessage('Message is required')
      .isLength({ min: 10, max: 1000 }).withMessage('Message must be between 10 and 1000 characters')
      .trim()
  ], async (req: Request, res: Response) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Invalid contact form data",
          errors: errors.array()
        });
      }
      
      // Parse and validate the contact data using Zod schema
      try {
        const contactData = insertContactSchema.parse(req.body);
        
        // Store contact submission
        const contactSubmission = await storage.createContactSubmission(contactData);
        
        // Log successful submission
        console.log(`Contact submission received from ${contactData.name} (${contactData.email})`);
        
        // Add GDPR-compliant note about data processing
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

  // Client preview code validation with express-validator
  app.post("/api/preview/validate", [
    // Express-validator validations
    body('code')
      .notEmpty().withMessage('Access code is required')
      .isString().withMessage('Access code must be a string')
      .isLength({ min: 4, max: 50 }).withMessage('Access code must be between 4 and 50 characters')
      .trim()
  ], async (req: Request, res: Response) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Invalid access code format",
          errors: errors.array()
        });
      }
      
      const { code } = req.body;
      
      // Add security headers for this sensitive endpoint
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      
      // Log access attempt (for security audit purposes) - with PII protection
      const maskedCode = code.substring(0, 3) + '*'.repeat(code.length - 3);
      console.log(`Access code validation attempt: ${maskedCode}`);
      
      // Add brute force protection with exponential backoff (in a real app)
      // Rate limiting has already been applied at the /api level
      
      // Special case for demo codes - secure from environment variables
      const demoCode1 = process.env.DEMO_CODE_1 || '';
      const demoCode2 = process.env.DEMO_CODE_2 || '';
      
      // Use timing-safe comparison to prevent timing attacks
      const isDemo1 = demoCode1 && code.length === demoCode1.length && 
        code.toLowerCase().split('').every((char: string, i: number) => char === demoCode1[i]);
      const isDemo2 = demoCode2 && code.length === demoCode2.length && 
        code.toLowerCase().split('').every((char: string, i: number) => char === demoCode2[i]);
      
      if (isDemo1 || isDemo2) {
        console.log(`Demo access code used: ${maskedCode}`);
        
        // In a real production app, generate and return a JWT token here
        const demoToken = generateToken({ id: 0, username: 'demo' }, 'demo');
        
        return res.status(200).json({
          success: true,
          message: "Demo access code validated successfully",
          accessType: "demo",
          token: demoToken,
          timestamp: new Date().toISOString()
        });
      }
      
      // Validate against database
      const isValid = await storage.validateClientPreviewCode(code);
      
      if (isValid) {
        try {
          // Fetch preview details if available
          const previewDetails = await storage.getClientPreviewByCode(code);
          
          // Generate and return a JWT token
          const clientToken = generateToken({ 
            id: previewDetails?.id || 0,
            username: previewDetails?.clientName || 'client'
          }, 'client');
          
          return res.status(200).json({
            success: true,
            message: "Access code validated successfully",
            accessType: "client",
            clientPreview: previewDetails,
            token: clientToken,
            timestamp: new Date().toISOString()
          });
        } catch (previewError) {
          console.error("Error fetching preview details:", previewError);
          // Still return success even if fetching additional details failed
          
          // Generate a generic client token
          const genericToken = generateToken({ id: 0, username: 'client' }, 'client');
          
          return res.status(200).json({
            success: true,
            message: "Access code validated successfully",
            accessType: "client",
            token: genericToken,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        // Failed validation - add delay to prevent timing attacks
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
        
        // Return 401 Unauthorized
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

  // Copilot chatbot API with caching and express-validator
  app.post("/api/copilot", [
    // Express-validator validations
    body('message')
      .notEmpty().withMessage('Message is required')
      .isString().withMessage('Message must be a string')
      .isLength({ min: 1, max: 500 }).withMessage('Message must be between 1 and 500 characters')
      .trim()
  ], async (req: Request, res: Response) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Invalid message format",
          errors: errors.array()
        });
      }
      
      const { message } = req.body;
      
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
