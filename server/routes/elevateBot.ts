/**
 * ElevateBot AI Assistant - Specialized business-focused chatbot endpoints
 * Uses xAI Grok for business-oriented conversations and queries
 */

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { grokApi } from '../grok';
import NodeCache from 'node-cache';

// Create cache for API responses to reduce API calls for frequent queries
// TTL: 600 seconds (10 minutes)
// Maximum 30 items in cache
const elevateBotCache = new NodeCache({ 
  stdTTL: 600, 
  checkperiod: 120,
  maxKeys: 30 
});

/**
 * Handles business queries from the ElevateBot chat interface
 */
export async function handleElevateBotQuery(req: Request, res: Response) {
  try {
    // Check for validation errors from express-validator middleware
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
    const cachedResponse = elevateBotCache.get<string>(cacheKey);
    
    if (cachedResponse) {
      console.log('ElevateBot cache hit');
      
      return res.status(200).json({
        success: true,
        response: cachedResponse,
        timestamp: new Date().toISOString(),
        cached: true
      });
    }
    
    // No cache hit, generate a new response
    console.log('ElevateBot cache miss, generating response with xAI');
    
    // Create the system prompt for business-focused responses
    const businessSystemPrompt = `You are ElevateBot, a tech assistant from Elevion, a premier web development company for small businesses. 
Use these guidelines for all responses:

1. Provide expert, business-focused advice about web development, site design, mobile optimization, and digital presence.
2. Use a friendly, professional tone that's accessible to non-technical business owners.
3. Highlight Elevion's focus on affordable, high-quality web solutions specifically tailored for small businesses.
4. Mention Elevion's competitive pricing when relevant (approximately 60% below market rates).
5. Focus on practical solutions that help small businesses succeed online.
6. Keep responses concise (3-5 paragraphs maximum) and actionable.
7. When discussing technical concepts, explain them in simple terms a non-technical business owner would understand.
8. Emphasize Elevion's AI-powered approach that makes professional web development accessible to small businesses.

Remember that Elevion specializes in web development with these core services:
- Custom website design and development
- Mobile optimization and responsive design
- E-commerce solutions
- Business branding and identity
- SEO and digital marketing integration
- Content management systems
- Web application development
- AI-driven business insights`;

    // Generate response using xAI's Grok model
    try {
      // First attempt - use grok-3-latest for best quality responses
      const aiResponse = await grokApi.createChatCompletion([
        { role: 'system', content: businessSystemPrompt },
        { role: 'user', content: message }
      ], {
        model: 'grok-3-latest',
        temperature: 0.7,
        max_tokens: 800
      });
      
      const responseText = aiResponse.choices[0].message.content;
      
      // Cache the successful response for future requests
      elevateBotCache.set(cacheKey, responseText);
      
      return res.status(200).json({
        success: true,
        response: responseText,
        timestamp: new Date().toISOString(),
        cached: false,
        model: 'grok-3-latest'
      });
    } catch (error) {
      console.error("Primary model failed, falling back to mini model:", error);
      
      // Fallback to grok-3-mini if the main model fails
      try {
        const fallbackResponse = await grokApi.createChatCompletion([
          { role: 'system', content: businessSystemPrompt },
          { role: 'user', content: message }
        ], {
          model: 'grok-3-mini',
          temperature: 0.7,
          max_tokens: 600
        });
        
        const fallbackText = fallbackResponse.choices[0].message.content;
        
        // Cache the fallback response
        elevateBotCache.set(cacheKey, fallbackText);
        
        return res.status(200).json({
          success: true,
          response: fallbackText,
          timestamp: new Date().toISOString(),
          cached: false,
          model: 'grok-3-mini'
        });
      } catch (fallbackError) {
        console.error("Both models failed:", fallbackError);
        throw new Error("Failed to generate AI response with all models");
      }
    }
  } catch (error) {
    console.error("ElevateBot error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    res.status(500).json({
      success: false,
      message: "Failed to process ElevateBot request",
      error: errorMessage
    });
  }
}

/**
 * Alternative implementation using the simplified helper function
 */
export async function handleElevateBotQuerySimple(req: Request, res: Response) {
  try {
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
    const cachedResponse = elevateBotCache.get<string>(cacheKey);
    
    if (cachedResponse) {
      console.log('ElevateBot cache hit');
      
      return res.status(200).json({
        success: true,
        response: cachedResponse,
        timestamp: new Date().toISOString(),
        cached: true
      });
    }
    
    console.log('ElevateBot cache miss, generating response with xAI');
    
    // Use the simpler analyzeText helper with business instructions
    const businessInstructions = 
      "You are ElevateBot, a tech assistant from Elevion, a web development company for small businesses. " +
      "Provide expert but accessible advice about web development, site design, and digital presence. " +
      "Highlight Elevion's focus on affordable web solutions (60% below market rates). " +
      "Keep responses concise (3-5 paragraphs) and explain technical concepts in simple terms.";
    
    try {
      const responseText = await grokApi.analyzeText(message, businessInstructions);
      
      // Cache the successful response
      elevateBotCache.set(cacheKey, responseText);
      
      return res.status(200).json({
        success: true,
        response: responseText,
        timestamp: new Date().toISOString(),
        cached: false
      });
    } catch (error) {
      console.error("ElevateBot AI generation error:", error);
      throw new Error("Failed to generate AI response");
    }
  } catch (error) {
    console.error("ElevateBot error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    res.status(500).json({
      success: false,
      message: "Failed to process ElevateBot request",
      error: errorMessage
    });
  }
}