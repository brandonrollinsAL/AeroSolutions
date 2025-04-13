import express, { Request, Response, Router } from 'express';
import { callXAI } from '../utils/xaiClient';
import NodeCache from 'node-cache';
import { db } from '../db';
import { mockupRequests } from '@shared/schema';
import { desc, sql } from 'drizzle-orm';

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

/**
 * Suggestion 22: Auto-Suggestions for Client Project Plans
 * Suggest project plans for clients based on their business goals
 */
router.post('/suggest-project-plan', async (req: Request, res: Response) => {
  try {
    const { businessGoals, businessType, budget, timeline } = req.body;
    
    if (!businessGoals || typeof businessGoals !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Business goals are required and must be a string"
      });
    }
    
    // Create a cache key based on the input parameters
    const cacheKey = `project_plan_${
      Buffer.from(businessGoals.substr(0, 50)).toString('base64')
    }_${businessType || 'general'}_${budget || 'any'}_${timeline || 'standard'}`;
    
    // Check cache first
    const cachedPlan = mockupSuggestionsCache.get(cacheKey);
    if (cachedPlan) {
      console.log(`Returning cached project plan for: ${businessGoals.substr(0, 30)}...`);
      return res.json({
        success: true,
        projectPlan: cachedPlan,
        source: 'cache'
      });
    }
    
    console.log(`Generating new project plan for: ${businessGoals.substr(0, 30)}...`);
    
    // Prepare prompt based on the input parameters
    let prompt = `Suggest a detailed project plan for a ${businessType || 'small business'} with these goals:\n${businessGoals}`;
    
    if (budget) {
      prompt += `\nBudget: ${budget}`;
    }
    
    if (timeline) {
      prompt += `\nTimeline: ${timeline}`;
    }
    
    prompt += `\n\nPlease structure your response with these sections:
1. Project Overview (brief summary)
2. Key Objectives (3-5 specific, measurable goals)
3. Phases of Development (with estimated timeframes)
4. Key Features/Deliverables (prioritized list with descriptions)
5. Technology Recommendations
6. Timeline Overview
7. Budget Allocation Recommendation
8. Success Metrics (how to measure the project's success)
    
Keep the plan practical, focused on web development needs, and aligned with the latest industry standards.`;
    
    // Set timeout for Grok call (30 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out after 30 seconds')), 30000);
    });
    
    // Generate project plan using Grok API
    const grokPromise = callXAI('/chat/completions', {
      model: 'grok-3', // Using standard model for better quality
      messages: [
        { 
          role: 'system', 
          content: 'You are a senior project manager at Elevion, specializing in web development projects for small to medium businesses. Create practical, detailed project plans based on client goals.'
        },
        { 
          role: 'user', 
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });
    
    // Race between API call and timeout
    const response: any = await Promise.race([grokPromise, timeoutPromise]);
    
    if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
      throw new Error('Invalid response from Grok API');
    }
    
    const projectPlan = response.choices[0].message.content;
    
    // Cache the successful response for 2 hours
    mockupSuggestionsCache.set(cacheKey, projectPlan, 7200);
    
    console.log(`Successfully generated project plan for: ${businessGoals.substr(0, 30)}...`);
    
    return res.json({
      success: true,
      projectPlan,
      source: 'fresh'
    });
  } catch (error: any) {
    console.error("Error generating project plan:", error);
    
    // Handle different types of errors
    if (error.message === 'Request timed out after 30 seconds') {
      return res.status(504).json({
        success: false,
        message: "The request timed out. Please try with more concise business goals."
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
      message: "Failed to generate project plan",
      error: error.message || "Unknown error"
    });
  }
});

/**
 * Suggestion 23: Real-Time Analytics for Client Mockup Requests
 * Analyze trends in mockup requests to identify popular business types and patterns
 */
router.get('/mockup-trends', async (req: Request, res: Response) => {
  try {
    // Check for appropriate authorization
    // This endpoint should be restricted to staff/admins in a production environment
    
    // Get recent mockup requests (limited to 100 for performance)
    const requests = await db.select().from(mockupRequests)
      .orderBy(desc(mockupRequests.createdAt))
      .limit(100);
    
    if (requests.length === 0) {
      return res.json({
        success: true, 
        message: "No mockup request data available for analysis",
        trends: [],
        businessTypeBreakdown: {},
        popularIndustries: []
      });
    }
    
    // Format data for AI analysis
    const requestData = requests.map(r => 
      `Business Type: ${r.businessType}, Industry: ${r.industryCategory || 'Unspecified'}, Goals: ${r.businessGoals?.substring(0, 50) || 'None'}, Requested: ${r.createdAt.toISOString()}`
    ).join('\n');
    
    // Basic analytics without AI
    const businessTypeCount: Record<string, number> = {};
    const industryCount: Record<string, number> = {};
    const statusCount: Record<string, number> = {};
    
    requests.forEach(request => {
      // Count business types
      const type = request.businessType.toLowerCase();
      businessTypeCount[type] = (businessTypeCount[type] || 0) + 1;
      
      // Count industries
      if (request.industryCategory) {
        const industry = request.industryCategory.toLowerCase();
        industryCount[industry] = (industryCount[industry] || 0) + 1;
      }
      
      // Count statuses
      statusCount[request.status] = (statusCount[request.status] || 0) + 1;
    });
    
    // Sort business types by popularity
    const popularBusinessTypes = Object.entries(businessTypeCount)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count }));
    
    // Sort industries by popularity
    const popularIndustries = Object.entries(industryCount)
      .sort((a, b) => b[1] - a[1])
      .map(([industry, count]) => ({ industry, count }));
    
    // Calculate average completion time
    const completedRequests = requests.filter(r => r.status === 'completed' && r.completionTime);
    const avgCompletionTime = completedRequests.length > 0
      ? completedRequests.reduce((sum, r) => sum + Number(r.completionTime), 0) / completedRequests.length
      : null;
    
    // Use Grok API to analyze trends if there are enough requests
    if (requests.length >= 10) {
      try {
        const response = await callXAI('/chat/completions', {
          model: 'grok-3',
          messages: [
            {
              role: 'system',
              content: 'You are a business analytics expert specializing in identifying patterns and trends in customer requests. Analyze the data and provide 3-5 key insights about customer preferences and trends.'
            },
            {
              role: 'user',
              content: `Analyze the following mockup request data to identify business trends, patterns, and insights:\n\n${requestData}\n\nProvide insights about customer preferences, emerging business types, and any patterns you notice.`
            }
          ],
          temperature: 0.2,
          max_tokens: 1000
        });
        
        if (!response.choices || !response.choices[0] || !response.choices[0].message) {
          throw new Error('Invalid response from Grok API');
        }
        
        // Extract the insights from the response
        const aiTrends = response.choices[0].message.content;
        
        // Return the combined analysis
        return res.json({
          success: true,
          requestCount: requests.length,
          statusBreakdown: statusCount,
          businessTypeBreakdown: businessTypeCount,
          popularBusinessTypes: popularBusinessTypes.slice(0, 10),
          popularIndustries: popularIndustries.slice(0, 5),
          averageCompletionTime: avgCompletionTime,
          aiTrends,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error("Error analyzing mockup trends with AI:", error);
        
        // Return basic analysis if AI fails
        return res.json({
          success: true,
          requestCount: requests.length,
          statusBreakdown: statusCount,
          businessTypeBreakdown: businessTypeCount,
          popularBusinessTypes: popularBusinessTypes.slice(0, 10),
          popularIndustries: popularIndustries.slice(0, 5),
          averageCompletionTime: avgCompletionTime,
          aiTrends: null,
          error: "AI trend analysis failed",
          timestamp: new Date().toISOString()
        });
      }
    } else {
      // Not enough data for meaningful AI analysis
      return res.json({
        success: true,
        requestCount: requests.length,
        statusBreakdown: statusCount,
        businessTypeBreakdown: businessTypeCount,
        popularBusinessTypes: popularBusinessTypes,
        popularIndustries: popularIndustries,
        averageCompletionTime: avgCompletionTime,
        message: "Not enough data for AI trend analysis",
        timestamp: new Date().toISOString()
      });
    }
  } catch (error: any) {
    console.error('Mockup trend analysis failed:', error);
    res.status(500).json({ 
      success: false,
      message: 'Mockup trend analysis failed', 
      error: error.message || 'Unknown error'
    });
  }
});

export default router;