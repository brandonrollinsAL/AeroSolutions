import { performance } from 'node:perf_hooks';
import NodeCache from 'node-cache';
import { grokApi } from '../grok';

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
const SYSTEM_PROMPT = `You are the Elevion Copilot, an AI assistant for Elevion, a premier web development company. 
Your role is to help users understand Elevion's services and how the company can help with their web development needs.

About Elevion:
- Elevion specializes in creating modern, responsive websites and web applications
- The company offers services including website design, web application development, e-commerce solutions, and content management systems
- Elevion focuses on small to medium-sized businesses looking to establish or improve their online presence
- The company is known for its free, no-obligation mockup service where clients only pay after approving a design

When responding:
- Be helpful, professional, and concise
- Focus on Elevion's web development services and capabilities
- Avoid discussing aviation or aeronautical topics, as these are not Elevion's focus areas
- If asked about technical capabilities, emphasize modern web technologies like React, Node.js, and responsive design
- If asked about pricing, explain that Elevion offers custom quotes based on project requirements, starting with a free mockup
- Keep responses under 150 words for readability
- If you don't know the answer to a specific question, be honest and offer to connect the user with a team member

Remember that your goal is to help potential clients understand how Elevion can help with their web presence and business growth through effective digital solutions.`;

/**
 * Helper function to generate cache keys
 * @param input The input to use for generating the cache key
 * @returns A string key for cache storage
 */
function generateCacheKey(input: string): string {
  // Simple but effective way to generate cache keys
  // For more complex applications, consider using a hash function
  return Buffer.from(input.trim().toLowerCase()).toString('base64');
}

/**
 * Generates a response for the copilot feature using xAI's Grok API with caching and optimized performance
 * @param userMessage The message from the user
 * @returns A response from the AI assistant
 */
export async function generateCopilotResponse(userMessage: string): Promise<string> {
  // Ensure xAI API key is available
  if (!process.env.XAI_API_KEY) {
    console.error("Missing XAI_API_KEY in environment variables");
    throw new Error("xAI Grok API key not configured");
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
    console.log(`Generating Grok AI response for message starting with: "${sanitizedMessage.substring(0, 20)}..."`);
    
    // Use performance.now() for more accurate timing
    const startTime = performance.now();
    
    // Make the API call with appropriate error handling
    try {
      const response = await grokApi.createChatCompletion([
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: sanitizedMessage
        }
      ], {
        model: "grok-3-latest",
        max_tokens: 250,
        temperature: 0.7
      });
      
      // Log timing information with more precision
      const duration = performance.now() - startTime;
      console.log(`Generated Grok AI response in ${duration.toFixed(2)}ms`);
      
      // Validate the response
      if (!response.choices || response.choices.length === 0 || !response.choices[0].message) {
        throw new Error("Invalid response format from Grok API");
      }
      
      const aiResponse = response.choices[0].message.content || 
        "I'm sorry, I couldn't generate a response. Please try again.";
      
      // Cache the successful response
      responseCache.set(cacheKey, aiResponse);
      
      return aiResponse;
    } catch (apiError: any) {
      // Enhanced error handling with more specific error messages
      if (apiError.response?.status === 429) {
        console.error("Grok rate limit exceeded:", apiError);
        throw new Error("AI service is currently handling many requests. Please try again in a moment.");
      } else if (apiError.response?.status === 401) {
        console.error("Grok authentication error:", apiError);
        throw new Error("AI service authentication failed. Please contact support.");
      } else if (apiError.response?.status === 403) {
        console.error("Grok permission error:", apiError);
        throw new Error("Request blocked by AI service policy. Please try a different query.");
      } else if (apiError.response?.status === 500 || apiError.response?.status === 503) {
        console.error("Grok server error:", apiError);
        throw new Error("AI service is temporarily unavailable. Please try again later.");
      } else if (apiError.code === 'ECONNRESET' || apiError.code === 'ETIMEDOUT') {
        console.error("Grok connection error:", apiError);
        throw new Error("Connection to AI service timed out. Please check your network and try again.");
      }
      
      // Re-throw the error for the general catch block
      throw apiError;
    }
  } catch (error: any) {
    // Log the error with appropriate context
    console.error("Error generating Grok AI response:", error);
    
    // Clean and structured error propagation
    throw new Error(
      error.message || "Failed to generate AI response. Please try again later."
    );
  }
}