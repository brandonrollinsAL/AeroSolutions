/**
 * XAI/Grok API Integration Module
 * 
 * This module provides an abstraction layer for interacting with the XAI/Grok API,
 * allowing for easy generation of text, JSON, and other AI-powered content.
 * 
 * It includes retry mechanisms, error handling, and logging to ensure reliable
 * integration with the API.
 */

import OpenAI from "openai";
import { db } from './db';
import { logs } from '@shared/schema';

// Check for API key
if (!process.env.XAI_API_KEY) {
  console.warn('XAI_API_KEY environment variable is not set. XAI integration will not work.');
}

// Initialize the XAI client with Grok API
const xaiClient = new OpenAI({
  baseURL: "https://api.x.ai/v1",
  apiKey: process.env.XAI_API_KEY || "missing_key",
});

// Configuration
const CONFIG = {
  defaultModel: "grok-2-1212", // Latest text model
  visionModel: "grok-2-vision-1212", // Latest vision model
  maxRetries: 3,
  retryDelayMs: 2000,
  timeoutMs: 60000, // 60 seconds timeout
  fallbackResponses: {
    json: JSON.stringify({
      message: "This is a fallback response due to API errors.",
      suggestions: [
        {
          title: "Retry the operation",
          description: "The XAI API may be experiencing temporary issues."
        }
      ]
    })
  }
};

// API call stats for monitoring
const apiStats = {
  totalCalls: 0,
  successfulCalls: 0,
  failedCalls: 0,
  getSuccessRate: function() {
    if (this.totalCalls === 0) return "0%";
    return `${this.successfulCalls}/${this.totalCalls} (${Math.round((this.successfulCalls / this.totalCalls) * 100)}%)`;
  }
};

/**
 * Generate text using the XAI API
 * 
 * @param prompt The input prompt
 * @param systemPrompt Optional system prompt to guide the AI
 * @param options Additional options like max tokens, temperature, etc.
 * @returns Generated text
 */
async function generateText(
  prompt: string,
  systemPrompt?: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
  }
): Promise<string> {
  const model = options?.model || CONFIG.defaultModel;
  let retries = 0;
  
  // Update stats
  apiStats.totalCalls++;
  
  while (retries < CONFIG.maxRetries) {
    try {
      // Set up the request
      const messages = [];
      
      // Add system message if provided
      if (systemPrompt) {
        messages.push({
          role: "system" as const,
          content: systemPrompt
        });
      }
      
      // Add user message (prompt)
      messages.push({
        role: "user" as const,
        content: prompt
      });
      
      // Call the API with timeout
      const response = await Promise.race([
        xaiClient.chat.completions.create({
          model,
          messages,
          max_tokens: options?.maxTokens,
          temperature: options?.temperature || 0.7,
        }),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`XAI API call timed out after ${CONFIG.timeoutMs}ms`)), CONFIG.timeoutMs);
        })
      ]);
      
      // Update stats
      apiStats.successfulCalls++;
      
      // Extract and return the generated text
      return response.choices[0].message.content || "";
      
    } catch (error) {
      retries++;
      console.error(`XAI API call failed (attempt ${retries}/${CONFIG.maxRetries}):`, error);
      
      // Log the error
      await db.insert(logs).values({
        type: 'XAI_API',
        message: `XAI API call failed: ${error instanceof Error ? error.message : String(error)}`,
        details: JSON.stringify({
          prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
          model,
          attempt: retries
        }),
        source: 'grok-api-client',
        level: 'error',
        createdAt: new Date()
      });
      
      // If we've exhausted all retries, update stats and rethrow
      if (retries >= CONFIG.maxRetries) {
        apiStats.failedCalls++;
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelayMs));
    }
  }
  
  throw new Error(`Failed to generate text after ${CONFIG.maxRetries} attempts`);
}

/**
 * Generate JSON using the XAI API
 * 
 * @param prompt The input prompt
 * @param systemPrompt Optional system prompt to guide the AI
 * @param options Additional options like max tokens, temperature, etc.
 * @returns Generated JSON as an object
 */
async function generateJson(
  prompt: string,
  systemPrompt?: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
  }
): Promise<any> {
  const model = options?.model || CONFIG.defaultModel;
  let retries = 0;
  
  // Update stats
  apiStats.totalCalls++;
  
  while (retries < CONFIG.maxRetries) {
    try {
      // Set up the request
      const messages = [];
      
      // Add system message if provided
      if (systemPrompt) {
        messages.push({
          role: "system" as const,
          content: systemPrompt
        });
      }
      
      // Add user message (prompt)
      messages.push({
        role: "user" as const,
        content: prompt
      });
      
      // Call the API with timeout and JSON response format
      const response = await Promise.race([
        xaiClient.chat.completions.create({
          model,
          messages,
          max_tokens: options?.maxTokens,
          temperature: options?.temperature || 0.7,
          response_format: { type: "json_object" }
        }),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`XAI API call timed out after ${CONFIG.timeoutMs}ms`)), CONFIG.timeoutMs);
        })
      ]);
      
      // Update stats
      apiStats.successfulCalls++;
      
      try {
        // Parse and return the JSON
        return JSON.parse(response.choices[0].message.content || "{}");
      } catch (parseError) {
        console.error('Elevion AI JSON generation error:', parseError);
        console.log('API Stats - Success:', apiStats.getSuccessRate());
        console.log('Using provided fallback JSON response');
        return JSON.parse(CONFIG.fallbackResponses.json);
      }
      
    } catch (error) {
      retries++;
      console.error(`XAI API call failed (attempt ${retries}/${CONFIG.maxRetries}):`, error);
      
      // Log the error
      await db.insert(logs).values({
        type: 'XAI_API',
        message: `XAI API JSON generation failed: ${error instanceof Error ? error.message : String(error)}`,
        details: JSON.stringify({
          prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
          model,
          attempt: retries
        }),
        source: 'grok-api-client',
        level: 'error',
        createdAt: new Date()
      });
      
      // If we've exhausted all retries, update stats
      if (retries >= CONFIG.maxRetries) {
        apiStats.failedCalls++;
        console.log('API Stats - Success:', apiStats.getSuccessRate());
        console.log('Using provided fallback JSON response');
        return JSON.parse(CONFIG.fallbackResponses.json);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelayMs));
    }
  }
  
  // This should never be reached due to fallback, but adding for type safety
  console.log('Using provided fallback JSON response');
  return JSON.parse(CONFIG.fallbackResponses.json);
}

/**
 * Analyze an image using the XAI Vision API
 * 
 * @param base64Image The base64 encoded image data
 * @param prompt The prompt describing what to analyze in the image
 * @param systemPrompt Optional system prompt to guide the AI
 * @returns Analysis text
 */
async function analyzeImage(
  base64Image: string,
  prompt: string,
  systemPrompt?: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const model = CONFIG.visionModel;
  let retries = 0;
  
  // Update stats
  apiStats.totalCalls++;
  
  while (retries < CONFIG.maxRetries) {
    try {
      // Set up the request
      const messages = [];
      
      // Add system message if provided
      if (systemPrompt) {
        messages.push({
          role: "system" as const,
          content: systemPrompt
        });
      }
      
      // Add user message with text and image
      messages.push({
        role: "user" as const,
        content: [
          {
            type: "text",
            text: prompt
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          }
        ]
      });
      
      // Call the API with timeout
      const response = await Promise.race([
        xaiClient.chat.completions.create({
          model,
          messages: messages as any, // Type casting due to mixed content types
          max_tokens: options?.maxTokens || 500,
          temperature: options?.temperature || 0.7,
        }),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`XAI Vision API call timed out after ${CONFIG.timeoutMs}ms`)), CONFIG.timeoutMs);
        })
      ]);
      
      // Update stats
      apiStats.successfulCalls++;
      
      // Extract and return the generated text
      return response.choices[0].message.content || "";
      
    } catch (error) {
      retries++;
      console.error(`XAI Vision API call failed (attempt ${retries}/${CONFIG.maxRetries}):`, error);
      
      // Log the error
      await db.insert(logs).values({
        type: 'XAI_API',
        message: `XAI Vision API call failed: ${error instanceof Error ? error.message : String(error)}`,
        details: JSON.stringify({
          prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
          imageSize: base64Image.length,
          model,
          attempt: retries
        }),
        source: 'grok-api-client',
        level: 'error',
        createdAt: new Date()
      });
      
      // If we've exhausted all retries, update stats and rethrow
      if (retries >= CONFIG.maxRetries) {
        apiStats.failedCalls++;
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelayMs));
    }
  }
  
  throw new Error(`Failed to analyze image after ${CONFIG.maxRetries} attempts`);
}

// Export the API
export const grokApi = {
  generateText,
  generateJson,
  analyzeImage,
  stats: apiStats
};