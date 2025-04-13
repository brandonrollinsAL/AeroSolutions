import express, { Request, Response, Router } from 'express';
import { callXAI } from '../utils/xaiClient';
import NodeCache from 'node-cache';

const router = Router();

// Simple cache with 1-hour TTL
const mockupSuggestionsCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

/**
 * Generate a detailed prompt for the business type
 */
function getDetailedPrompt(businessType: string): string {
  return `I need a comprehensive website design recommendation for a "${businessType}" business.
  
Please provide a detailed markdown response with the following sections:

## Color Scheme
Recommend 3-5 colors that would work well for this business type. Include:
- Primary color (with hex code)
- Secondary color (with hex code)
- Accent colors (with hex codes)
- Brief explanation of why these colors work well for this business type

## Typography
Recommend font pairings that would work well, including:
- Heading font suggestion
- Body text font suggestion
- UI elements font suggestion
- Explanation of why these fonts work well for this business type

## Layout and Structure
Describe the ideal website structure, including:
- Types of pages needed (e.g., home, about, services, gallery)
- Key elements for the home page
- Navigation structure recommendation
- Mobile responsiveness considerations

## Key Features
Recommend 4-6 essential features that websites in this industry should have, including:
- Functionality explanation
- Business benefit of each feature
- Priority level (must-have vs. nice-to-have)

## Media Elements
Suggest visual elements that would enhance the design:
- Types of imagery recommended
- Video or animation suggestions if applicable
- Icons or graphics that would enhance the user experience

## Call-to-Action Suggestions
Provide 2-3 effective call-to-action suggestions specific to this business type.

Keep the response detailed but concise, focusing on practical design recommendations that align with current design trends for this specific business type.`;
}

/**
 * Endpoint for generating mockup design suggestions based on business type
 */
router.post('/suggest-mockup', async (req: Request, res: Response) => {
  try {
    const { businessType } = req.body;
    
    if (!businessType || typeof businessType !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Business type is required and must be a string"
      });
    }
    
    // Normalize business type for caching (lowercase, trim)
    const normalizedBusinessType = businessType.toLowerCase().trim();
    const cacheKey = `mockup_suggestion_${normalizedBusinessType}`;
    
    // Check cache first
    const cachedSuggestions = mockupSuggestionsCache.get(cacheKey);
    if (cachedSuggestions) {
      console.log(`Returning cached mockup suggestions for business type: ${normalizedBusinessType}`);
      return res.json({
        success: true,
        designIdeas: cachedSuggestions,
        source: 'cache'
      });
    }
    
    console.log(`Generating new mockup suggestions for business type: ${normalizedBusinessType}`);
    
    // Set timeout for Grok call (30 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out after 30 seconds')), 30000);
    });
    
    // Generate design ideas using Grok API
    const grokPromise = callXAI('/chat/completions', {
      model: 'grok-3-mini', // Using mini model for faster responses
      messages: [
        { 
          role: 'system', 
          content: 'You are a professional web designer specializing in creating mockups and design systems for various business types. Provide detailed, practical design recommendations.'
        },
        { 
          role: 'user', 
          content: getDetailedPrompt(normalizedBusinessType) 
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });
    
    // Race between API call and timeout
    const response: any = await Promise.race([grokPromise, timeoutPromise]);
    
    if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
      throw new Error('Invalid response from Grok API');
    }
    
    const designIdeas = response.choices[0].message.content;
    
    // Cache the successful response
    mockupSuggestionsCache.set(cacheKey, designIdeas);
    
    console.log(`Successfully generated mockup suggestions for business type: ${normalizedBusinessType}`);
    
    return res.json({
      success: true,
      designIdeas,
      source: 'fresh'
    });
  } catch (error: any) {
    console.error("Error generating mockup suggestions:", error);
    
    // Handle different types of errors
    if (error.message === 'Request timed out after 30 seconds') {
      return res.status(504).json({
        success: false,
        message: "The request timed out. Please try again with a more specific business type."
      });
    }
    
    if (error.response && error.response.status === 429) {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later."
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Failed to generate design suggestions",
      error: error.message || "Unknown error"
    });
  }
});

export default router;