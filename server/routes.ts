import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSchema } from "@shared/schema";
import { z } from "zod";
import { generateCopilotResponse } from "./utils/openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup API routes - all prefixed with /api
  
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

  // Copilot chatbot API
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
      
      // Generate a response using OpenAI
      const aiResponse = await generateCopilotResponse(message);
      
      if (!aiResponse) {
        return res.status(500).json({
          success: false,
          message: "Failed to generate AI response"
        });
      }
      
      res.status(200).json({
        success: true,
        response: aiResponse,
        timestamp: new Date().toISOString()
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
