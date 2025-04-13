import express from 'express';
import { Request, Response } from 'express';
import { grokApi } from '../grok';
import NodeCache from 'node-cache';

const router = express.Router();
const mockupCache = new NodeCache({ stdTTL: 3600 }); // Cache suggestions for 1 hour

// Helper function to get a detailed prompt for mockup suggestions
function getDetailedPrompt(businessType: string): string {
  return `Generate creative and professional website design suggestions for a ${businessType} business. 
  Include the following in your response:
  
  1. Color scheme (3-5 colors with hex codes that would work well for this business type)
  2. Typography suggestions (2-3 font pairings that would be appropriate)
  3. Layout recommendations (homepage structure, important sections to include)
  4. Visual elements (types of imagery, graphics, or illustrations that would enhance the design)
  5. Key features the website should have to be effective for this specific business type
  
  Make your suggestions specific to the ${businessType} industry, considering typical customer expectations 
  and industry standards. Focus on modern, responsive design principles.`;
}

// Endpoint to generate mockup suggestions
router.post('/suggest-mockup', async (req: Request, res: Response) => {
  try {
    const { businessType } = req.body;
    
    if (!businessType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Business type is required' 
      });
    }

    // Check cache first
    const cacheKey = `mockup-suggestion-${businessType.toLowerCase().replace(/\s+/g, '-')}`;
    const cachedSuggestions = mockupCache.get(cacheKey);
    
    if (cachedSuggestions) {
      return res.json({
        success: true,
        designIdeas: cachedSuggestions,
        source: 'cache'
      });
    }

    // Generate new suggestions
    const detailedPrompt = getDetailedPrompt(businessType);
    const suggestions = await grokApi.analyzeText(detailedPrompt);
    
    // Cache the result
    mockupCache.set(cacheKey, suggestions);
    
    res.json({
      success: true,
      designIdeas: suggestions,
      source: 'fresh'
    });
  } catch (error: any) {
    console.error('Error generating mockup suggestions:', error);
    
    // Provide fallback content for reliability
    const fallbackContent = `
      # Website Design Suggestions
      
      Here are some general design recommendations for your website:
      
      ## Color Scheme
      - Primary: #3B5B9D (Slate Blue)
      - Secondary: #00D1D1 (Electric Cyan)
      - Accent: #FF7043 (Sunset Orange)
      - Background: #EDEFF2 (Light Gray)
      - Text: #333333 (Dark Gray)
      
      ## Typography
      - Headings: Poppins (Sans-serif)
      - Body: Lato (Sans-serif)
      - UI Elements: Inter (Sans-serif)
      
      ## Layout Recommendations
      - Clean, minimal design with plenty of whitespace
      - Hero section with clear value proposition
      - Features/services section with icons
      - Testimonials from satisfied clients
      - Contact form with minimal required fields
      
      ## Visual Elements
      - High-quality photographs relevant to your business
      - Simple iconography for services/features
      - Subtle animations for engagement
      
      ## Key Features
      - Mobile-responsive design
      - Fast loading times
      - Clear call-to-action buttons
      - Easy navigation
      - Contact information easily accessible
    `;
    
    res.status(200).json({
      success: true,
      designIdeas: fallbackContent,
      source: 'fallback'
    });
  }
});

export default router;