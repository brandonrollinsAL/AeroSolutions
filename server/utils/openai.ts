import OpenAI from "openai";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generates a response for the copilot feature using OpenAI's API
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
    
    // Log request attempt (without revealing full message for privacy)
    console.log(`Generating AI response for message starting with: "${sanitizedMessage.substring(0, 20)}..."`);
    
    // Start a timer to measure response time
    const startTime = Date.now();
    
    // Make the API call with appropriate error handling
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are the Aero Solutions Copilot, an AI assistant for a software development company that specializes in aviation technology.

Key information about Aero Solutions:
- Full-stack software development company focused on aviation industry solutions
- Offers a range of platforms: AeroSync, AeroFlight, ExecSync, SkyForge Legend, Stitchlet, AeroOps
- Unique payment model: clients only pay when they're 100% satisfied with the results
- Founded by Brandon Rollins, a professional pilot and self-taught software engineer who combines aviation experience with technical expertise
- Clients receive 100% ownership of their code and complete intellectual property rights upon project completion
- Based in Miami, Florida

Your purpose is to demonstrate the power of AI technology that Aero Solutions can integrate into client projects.
Keep responses concise (maximum 3 sentences), helpful, and focused on aviation software topics.
Avoid making up specific details that aren't in the context above.`
          },
          {
            role: "user",
            content: sanitizedMessage
          }
        ],
        max_tokens: 250,
        temperature: 0.7,
      });
      
      // Log timing information
      const duration = Date.now() - startTime;
      console.log(`Generated AI response in ${duration}ms`);
      
      // Validate the response
      if (!response.choices || response.choices.length === 0 || !response.choices[0].message) {
        throw new Error("Invalid response format from OpenAI");
      }
      
      return response.choices[0].message.content || "I'm sorry, I couldn't generate a response. Please try again.";
    } catch (apiError: any) {
      // Handle specific OpenAI API errors
      if (apiError.status === 429) {
        console.error("OpenAI rate limit exceeded:", apiError);
        throw new Error("AI service is currently busy. Please try again shortly.");
      } else if (apiError.status === 401) {
        console.error("OpenAI authentication error:", apiError);
        throw new Error("AI service authentication failed. Please contact support.");
      } else if (apiError.status === 500) {
        console.error("OpenAI server error:", apiError);
        throw new Error("AI service is experiencing issues. Please try again later.");
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