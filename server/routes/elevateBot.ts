import { Request, Response } from 'express';
import { callXAI, getGrokCompletion } from '../utils/xaiClient';

// System message to guide AI responses for business-related queries
const BUSINESS_SYSTEM_MESSAGE = `
You are ElevateBot, Elevion's AI assistant for small business owners and entrepreneurs.
Your expertise is in web development, digital marketing, and business technology solutions.

When providing advice:
- Be concise, practical, and actionable
- Focus on solutions that are realistic for small businesses with limited budgets
- Provide step-by-step guidance when appropriate
- Reference relevant modern web technologies and business strategies
- Maintain a professional but friendly tone
- If you don't know the answer, say so rather than making up information

You work for Elevion, a web development company specializing in creating affordable,
high-quality websites and digital solutions for small businesses.
`;

/**
 * Handles business queries from the ElevateBot chat interface
 */
export async function handleElevateBotQuery(req: Request, res: Response) {
  const { message } = req.body;
  
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ 
      success: false, 
      error: 'Message is required and must be a string' 
    });
  }

  try {
    // Use the xAI API directly with system message for better control
    const response = await callXAI('/chat/completions', {
      model: 'grok-3-mini', // Using mini model for faster responses
      messages: [
        { role: 'system', content: BUSINESS_SYSTEM_MESSAGE },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500
    }, 30000); // 30 second timeout for complex business queries

    if (!response.choices || !response.choices[0]?.message?.content) {
      throw new Error('Invalid response format from Grok API');
    }

    return res.json({ 
      success: true,
      response: response.choices[0].message.content,
      source: 'grok'
    });
  } catch (error: any) {
    console.error('Error in ElevateBot query:', error);
    
    // Provide a helpful fallback response
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Unknown error',
      response: "I'm sorry, I'm having trouble processing your request at the moment. Please try again later or contact our team for direct assistance.",
      source: 'fallback'
    });
  }
}

/**
 * Alternative implementation using the simplified helper function
 */
export async function handleElevateBotQuerySimple(req: Request, res: Response) {
  const { message } = req.body;
  
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ 
      success: false, 
      error: 'Message is required and must be a string' 
    });
  }

  try {
    // Construct prompt with business focus
    const prompt = `${BUSINESS_SYSTEM_MESSAGE}\n\nUser query: ${message}`;
    
    // Use the simplified helper function
    const response = await getGrokCompletion(prompt, {
      model: 'grok-3-mini',
      maxTokens: 500,
      temperature: 0.7,
      timeout: 30000 // 30 second timeout
    });

    return res.json({ 
      success: true,
      response,
      source: 'grok'
    });
  } catch (error: any) {
    console.error('Error in ElevateBot query (simple method):', error);
    
    // Provide a helpful fallback response
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Unknown error',
      response: "I'm sorry, I'm having trouble processing your request at the moment. Please try again later or contact our team for direct assistance.",
      source: 'fallback'
    });
  }
}