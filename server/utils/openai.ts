import OpenAI from "openai";
import { performance } from 'node:perf_hooks';
import NodeCache from 'node-cache';

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Cache configuration: 
// - stdTTL: 3600 seconds (1 hour) default TTL
// - checkperiod: 600 seconds (10 minutes) how often to check for expired keys
// - maxKeys: 100 maximum number of keys in cache to prevent memory issues
const responseCache = new NodeCache({ 
  stdTTL: 3600, 
  checkperiod: 600,
  maxKeys: 100,
  useClones: false
});

// System prompt is stored as a constant to avoid regenerating it for each request
const SYSTEM_PROMPT = `You are the Aero Solutions Copilot, an AI assistant for a software development company that specializes in aviation technology.

Key information about Aero Solutions:
- Full-stack software development company focused on aviation industry solutions
- Offers a range of platforms: AeroSync, AeroFlight, ExecSync, SkyForge Legend, Stitchlet, AeroOps
- Unique payment model: clients only pay when they're 100% satisfied with the results
- Founded by Brandon Rollins, a professional pilot and self-taught software engineer who combines aviation experience with technical expertise
- Clients receive 100% ownership of their code and complete intellectual property rights upon project completion
- Based in Miami, Florida

Your purpose is to demonstrate the power of AI technology that Aero Solutions can integrate into client projects.
Keep responses concise (maximum 3 sentences), helpful, and focused on aviation software topics.
Avoid making up specific details that aren't in the context above.`;

// Generate a deterministic cache key for a given user message
function generateCacheKey(message: string): string {
  return Buffer.from(message.trim().toLowerCase()).toString('base64');
}

/**
 * Generates a response for the copilot feature using OpenAI's API with caching and optimized performance
 * @param userMessage The message from the user
 * @returns A response from the AI assistant
 */
export async function generateCopilotResponse(userMessage: string): Promise<string> {
  // Ensure OpenAI API key is available
  if (!process.env.OPENAI_API_KEY) {
    console.error("Missing OPENAI_API_KEY in environment variables");
    throw new Error("OpenAI API key not configured");
  }
  
  try {
    // Input validation
    if (!userMessage || typeof userMessage !== 'string') {
      throw new Error("Invalid user message format");
    }
    
    // Clean the user message
    const sanitizedMessage = userMessage.trim();
    if (sanitizedMessage.length === 0) {
      throw new Error("Empty user message");
    }
    
    if (sanitizedMessage.length > 500) {
      throw new Error("User message exceeds maximum length (500 characters)");
    }
    
    // Check cache before making API call
    const cacheKey = generateCacheKey(sanitizedMessage);
    const cachedResponse = responseCache.get<string>(cacheKey);
    
    if (cachedResponse) {
      console.log(`Cache hit for message starting with: "${sanitizedMessage.substring(0, 20)}..."`);
      return cachedResponse;
    }
    
    // Log request attempt (without revealing full message for privacy)
    console.log(`Generating AI response for message starting with: "${sanitizedMessage.substring(0, 20)}..."`);
    
    // Use performance.now() for more accurate timing
    const startTime = performance.now();
    
    // Make the API call with appropriate error handling
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          {
            role: "user",
            content: sanitizedMessage
          }
        ],
        max_tokens: 250,
        temperature: 0.7,
        // Additional optimizations
        presence_penalty: 0.1,  // Slight penalty to discourage repetition
        frequency_penalty: 0.1, // Slight penalty to encourage diverse language
      });
      
      // Log timing information with more precision
      const duration = performance.now() - startTime;
      console.log(`Generated AI response in ${duration.toFixed(2)}ms`);
      
      // Validate the response
      if (!response.choices || response.choices.length === 0 || !response.choices[0].message) {
        throw new Error("Invalid response format from OpenAI");
      }
      
      const aiResponse = response.choices[0].message.content || 
        "I'm sorry, I couldn't generate a response. Please try again.";
      
      // Cache the successful response
      responseCache.set(cacheKey, aiResponse);
      
      return aiResponse;
    } catch (apiError: any) {
      // Enhanced error handling with more specific error messages
      if (apiError.status === 429) {
        console.error("OpenAI rate limit exceeded:", apiError);
        throw new Error("AI service is currently handling many requests. Please try again in a moment.");
      } else if (apiError.status === 401) {
        console.error("OpenAI authentication error:", apiError);
        throw new Error("AI service authentication failed. Please contact support.");
      } else if (apiError.status === 403) {
        console.error("OpenAI permission error:", apiError);
        throw new Error("Request blocked by AI service policy. Please try a different query.");
      } else if (apiError.status === 500 || apiError.status === 503) {
        console.error("OpenAI server error:", apiError);
        throw new Error("AI service is temporarily unavailable. Please try again later.");
      } else if (apiError.code === 'ECONNRESET' || apiError.code === 'ETIMEDOUT') {
        console.error("OpenAI connection error:", apiError);
        throw new Error("Connection to AI service timed out. Please check your network and try again.");
      }
      
      // Re-throw the error for the general catch block
      throw apiError;
    }
  } catch (error: any) {
    // Log the error with appropriate context
    console.error("Error generating OpenAI response:", error);
    
    // Clean and structured error propagation
    throw new Error(
      error.message || "Failed to generate AI response. Please try again later."
    );
  }
}