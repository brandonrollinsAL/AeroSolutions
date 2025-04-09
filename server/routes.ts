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
      const contactData = insertContactSchema.parse(req.body);
      const contactSubmission = await storage.createContactSubmission(contactData);
      
      // In a production app, you would send an email notification here using SendGrid API
      
      res.status(201).json({
        success: true,
        message: "Contact submission received",
        data: contactSubmission
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Invalid contact form data",
          errors: error.errors
        });
      }
      
      res.status(500).json({
        success: false,
        message: "Failed to process contact submission"
      });
    }
  });

  // Client preview code validation
  app.post("/api/preview/validate", async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code || typeof code !== "string") {
        return res.status(400).json({
          success: false,
          message: "Access code is required"
        });
      }
      
      // Special case for demo code
      if (code.toLowerCase() === "momanddad") {
        return res.status(200).json({
          success: true,
          message: "Access code validated successfully"
        });
      }
      
      const isValid = await storage.validateClientPreviewCode(code);
      
      if (isValid) {
        // In a real app, you would set a session cookie or return a JWT token
        res.status(200).json({
          success: true,
          message: "Access code validated successfully"
        });
      } else {
        res.status(401).json({
          success: false,
          message: "Invalid or expired access code"
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to validate access code"
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
          message: "Message is required"
        });
      }
      
      // Generate a response using OpenAI
      const aiResponse = await generateCopilotResponse(message);
      
      res.status(200).json({
        success: true,
        response: aiResponse
      });
    } catch (error) {
      console.error("Copilot error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process copilot request"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
