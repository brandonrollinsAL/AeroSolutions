import express, { Request, Response, Router } from 'express';
import { callXAI } from '../utils/xaiClient';
import NodeCache from 'node-cache';
import { db } from '../db';
import { mockupRequests } from '@shared/schema';
import { desc, sql } from 'drizzle-orm';

const router = Router();

// Simple cache with 1-hour TTL
const mockupSuggestionsCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });
// Cache for onboarding suggestions with 2-hour TTL
const onboardingSuggestionsCache = new NodeCache({ stdTTL: 7200, checkperiod: 120 });
// Cache for website copy suggestions with 2-hour TTL
const websiteCopySuggestionsCache = new NodeCache({ stdTTL: 7200, checkperiod: 120 });
// Cache for branding ideas with 2-hour TTL
const brandingSuggestionsCache = new NodeCache({ stdTTL: 7200, checkperiod: 120 });
// Cache for navigation suggestions with 2-hour TTL
const navigationSuggestionsCache = new NodeCache({ stdTTL: 7200, checkperiod: 120 });
// Cache for performance optimization suggestions with 2-hour TTL
const performanceOptimizationCache = new NodeCache({ stdTTL: 7200, checkperiod: 120 });
// Cache for blog content suggestions with 2-hour TTL
const blogContentSuggestionsCache = new NodeCache({ stdTTL: 7200, checkperiod: 120 });

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

/**
 * Suggestion 26: Auto-Suggestions for Client Onboarding
 * Suggest onboarding steps for new clients based on their business type
 */
router.post('/suggest-onboarding', async (req: Request, res: Response) => {
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
    const cacheKey = `onboarding_${normalizedBusinessType}`;
    
    // Check cache first
    const cachedSteps = onboardingSuggestionsCache.get(cacheKey);
    if (cachedSteps) {
      console.log(`Returning cached onboarding steps for business type: ${normalizedBusinessType}`);
      return res.json({
        success: true,
        onboardingSteps: cachedSteps,
        source: 'cache'
      });
    }
    
    console.log(`Generating new onboarding steps for business type: ${normalizedBusinessType}`);
    
    // Set timeout for Grok call (30 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out after 30 seconds')), 30000);
    });
    
    const prompt = `
Create a comprehensive client onboarding plan for a ${normalizedBusinessType} business that is building a new website with Elevion.

Please structure your response with these sections:

## Initial Client Meeting (Week 1)
List 3-5 key questions to ask during the initial meeting and important information to collect.

## Information Gathering Phase (Week 1-2)
Outline the specific content, assets, and information we need to collect from this type of business.

## Project Setup (Week 2)
Detail the technical setup steps our team needs to complete, including domain and hosting requirements specific to this business type.

## Milestone Schedule
Provide a timeline with key milestones for a typical ${normalizedBusinessType} business website project.

## Client Approval Points
List the critical points in the process where client approval should be obtained.

## Website Launch Checklist
Provide a pre-launch verification checklist specific to a ${normalizedBusinessType} business website.

## Post-Launch Support
Recommend 2-3 post-launch services or support options particularly valuable for this business type.
`;
    
    // Generate onboarding steps using Grok API
    const grokPromise = callXAI('/chat/completions', {
      model: 'grok-3-mini', // Using mini model for faster responses
      messages: [
        { 
          role: 'system', 
          content: 'You are a seasoned project manager at Elevion, specializing in client onboarding for web development projects. Provide practical, detailed onboarding plans based on business types.'
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
    
    const onboardingSteps = response.choices[0].message.content;
    
    // Cache the successful response
    onboardingSuggestionsCache.set(cacheKey, onboardingSteps);
    
    console.log(`Successfully generated onboarding steps for business type: ${normalizedBusinessType}`);
    
    return res.json({
      success: true,
      onboardingSteps,
      source: 'fresh'
    });
  } catch (error: any) {
    console.error("Error generating onboarding suggestions:", error);
    
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
    
    // Fallback content for when API fails
    const fallbackOnboarding = `
## Initial Client Meeting (Week 1)
- Understand business goals and target audience
- Discuss project scope, timeline, and budget
- Review competitor websites
- Gather content requirements and branding materials
- Set expectations and communication preferences

## Information Gathering Phase (Week 1-2)
- Collect brand assets (logos, images, brand guidelines)
- Request content for key pages
- Identify technical requirements and integrations
- Conduct SEO keyword research
- Review existing analytics (if applicable)

## Project Setup (Week 2)
- Register/transfer domain name if needed
- Set up hosting environment
- Configure development environment
- Create project management workspace
- Set up version control repository

## Milestone Schedule
- Week 3: Wireframes and sitemap approval
- Week 5: Design mockups approval
- Week 7: Development completion
- Week 8: Testing and revisions
- Week 9: Final approval and launch

## Client Approval Points
- Sitemap and information architecture
- Design concepts and mockups
- Content placement and formatting
- Functionality testing
- Pre-launch review

## Website Launch Checklist
- Cross-browser compatibility testing
- Mobile responsiveness verification
- Form functionality testing
- SEO elements verification
- Security checks
- Performance optimization
- 404 page and error handling
- Analytics implementation

## Post-Launch Support
- 30-day support package
- Content update training
- Monthly maintenance plan
- Analytics review and reporting
`;
    
    return res.status(500).json({
      success: false,
      message: "Failed to generate onboarding suggestions",
      fallbackOnboarding,
      error: error.message || "Unknown error"
    });
  }
});

/**
 * Suggestion 29: Auto-Suggestions for Client Website Copy
 * Suggest website copy for clients based on their business type
 */
router.post('/suggest-website-copy', async (req: Request, res: Response) => {
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
    const cacheKey = `website_copy_${normalizedBusinessType}`;
    
    // Check cache first
    const cachedCopy = websiteCopySuggestionsCache.get(cacheKey);
    if (cachedCopy) {
      console.log(`[Website Copy API] Returning cached copy for business type: ${normalizedBusinessType}`);
      return res.json({
        success: true,
        copy: cachedCopy,
        source: 'cache'
      });
    }
    
    console.log(`[Website Copy API] Generating new website copy for business type: ${normalizedBusinessType}`);
    
    // Set timeout for Grok call (15 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out after 15 seconds')), 15000);
    });
    
    // Generate website copy using Grok API
    const grokPromise = callXAI('/chat/completions', {
      model: 'grok-3', // Using standard model for better quality copy
      messages: [
        { 
          role: 'system', 
          content: 'You are a professional copywriter specializing in creating compelling website copy for various business types. Provide clear, concise, and persuasive website copy that converts visitors into customers.'
        },
        { 
          role: 'user', 
          content: `Create compelling website copy for a ${businessType} business. Include:

1. Headline (attention-grabbing main headline)
2. Subheadline (supporting the main headline)
3. About Us section (1-2 paragraphs)
4. Services/Products section (with 3-4 key offerings)
5. Unique Value Proposition (what makes this business special)
6. Call to Action statements (2-3 variations)
7. Customer testimonial templates (2 examples)
8. Contact section copy

Make the copy professional, concise, and optimized for conversion. Use language that resonates with the target audience of this business type.`
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
    
    const websiteCopy = response.choices[0].message.content;
    
    // Cache the successful response
    websiteCopySuggestionsCache.set(cacheKey, websiteCopy);
    
    console.log(`[Website Copy API] Successfully generated website copy for business type: ${normalizedBusinessType}`);
    
    return res.json({
      success: true,
      copy: websiteCopy,
      source: 'fresh'
    });
  } catch (error: any) {
    console.error("[Website Copy API] Error generating website copy:", error);
    
    // Handle different types of errors
    if (error.message === 'Request timed out after 15 seconds') {
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
      message: "Failed to generate website copy",
      error: error.message || "Unknown error"
    });
  }
});

/**
 * Suggestion 31: Auto-Suggestions for Client Branding
 * Suggest branding ideas for clients based on their industry
 */
router.post('/suggest-branding', async (req: Request, res: Response) => {
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
    const cacheKey = `branding_${normalizedBusinessType}`;
    
    // Check cache first
    const cachedBranding = brandingSuggestionsCache.get(cacheKey);
    if (cachedBranding) {
      console.log(`[Branding API] Returning cached branding ideas for business type: ${normalizedBusinessType}`);
      return res.json({
        success: true,
        brandingIdeas: cachedBranding,
        source: 'cache'
      });
    }
    
    console.log(`[Branding API] Generating new branding ideas for business type: ${normalizedBusinessType}`);
    
    // Set timeout for Grok call (15 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out after 15 seconds')), 15000);
    });
    
    // Generate branding ideas using Grok API
    const grokPromise = callXAI('/chat/completions', {
      model: 'grok-3-mini', // Using mini model for faster responses
      messages: [
        { 
          role: 'system', 
          content: 'You are a professional branding expert specializing in creating comprehensive branding strategies for various business types. Provide thoughtful, industry-appropriate branding suggestions.'
        },
        { 
          role: 'user', 
          content: `Create comprehensive branding suggestions for a ${normalizedBusinessType} business. Include:

1. Brand Name Ideas (3-5 creative but relevant options)
2. Color Palette (primary, secondary, and accent colors with hex codes)
3. Brand Voice (formal, conversational, technical, etc.)
4. Logo Concept Ideas (3 distinct approaches)
5. Typography Recommendations (header and body font pairings)
6. Tagline Options (3-4 memorable options)
7. Brand Values (3-5 core values that should guide the brand)
8. Target Audience Description

Make the suggestions professional, modern, and industry-appropriate. Consider current design trends and business goals for this specific industry.`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });
    
    // Race between API call and timeout
    const response: any = await Promise.race([grokPromise, timeoutPromise]);
    
    if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
      throw new Error('Invalid response from Grok API');
    }
    
    const brandingIdeas = response.choices[0].message.content;
    
    // Cache the successful response
    brandingSuggestionsCache.set(cacheKey, brandingIdeas);
    
    console.log(`[Branding API] Successfully generated branding ideas for business type: ${normalizedBusinessType}`);
    
    return res.json({
      success: true,
      brandingIdeas,
      source: 'fresh'
    });
  } catch (error: any) {
    console.error("[Branding API] Error generating branding ideas:", error);
    
    // Handle different types of errors
    if (error.message === 'Request timed out after 15 seconds') {
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
      message: "Failed to generate branding ideas",
      error: error.message || "Unknown error"
    });
  }
});

/**
 * Suggestion 36: Auto-Suggestions for Client Website Navigation
 * Suggest navigation structures for client websites based on their business type
 */
router.post('/suggest-navigation', async (req: Request, res: Response) => {
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
    const cacheKey = `navigation_suggestion_${normalizedBusinessType}`;
    
    // Check cache first
    const cachedNavigation = navigationSuggestionsCache.get(cacheKey);
    if (cachedNavigation) {
      console.log(`Returning cached navigation suggestions for business type: ${normalizedBusinessType}`);
      return res.json({
        success: true,
        navigation: cachedNavigation,
        source: 'cache'
      });
    }
    
    console.log(`Generating new navigation suggestions for business type: ${normalizedBusinessType}`);
    
    // Set timeout for Grok call (20 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out after 20 seconds')), 20000);
    });
    
    // Generate navigation using Grok API
    const grokPromise = callXAI('/chat/completions', {
      model: 'grok-3-mini', // Using mini model for faster responses
      messages: [
        { 
          role: 'system', 
          content: 'You are a professional UX/UI designer specializing in website navigation structures. Provide detailed, practical navigation recommendations in JSON format.'
        },
        { 
          role: 'user', 
          content: `Create a comprehensive website navigation structure for a ${normalizedBusinessType} business website. 
          
Include:
1. Main navigation items (maximum 7 items)
2. Dropdown sub-items for each main item where appropriate
3. Recommended footer navigation items
4. Recommended mobile navigation structure
5. Any special navigation considerations for this business type

Format your response as a JSON object with these sections. Each navigation item should include a label and a brief description explaining its purpose.`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1500
    });
    
    // Race between API call and timeout
    const response: any = await Promise.race([grokPromise, timeoutPromise]);
    
    if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
      throw new Error('Invalid response from Grok API');
    }
    
    const navigationSuggestion = response.choices[0].message.content;
    
    // Validate the response is proper JSON
    try {
      const parsedNavigation = JSON.parse(navigationSuggestion);
      
      // Cache the successful response
      navigationSuggestionsCache.set(cacheKey, parsedNavigation);
      
      console.log(`Successfully generated navigation suggestions for business type: ${normalizedBusinessType}`);
      
      return res.json({
        success: true,
        navigation: parsedNavigation,
        source: 'fresh'
      });
    } catch (jsonError) {
      console.error("Error parsing navigation JSON:", jsonError);
      
      // If JSON parsing fails, return the raw content
      navigationSuggestionsCache.set(cacheKey, navigationSuggestion);
      
      return res.json({
        success: true,
        navigation: navigationSuggestion,
        source: 'fresh',
        warning: 'Response could not be parsed as JSON'
      });
    }
  } catch (error: any) {
    console.error("Error generating navigation suggestions:", error);
    
    // Handle different types of errors
    if (error.message === 'Request timed out after 20 seconds') {
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
      message: "Failed to generate navigation suggestions",
      error: error.message || "Unknown error"
    });
  }
});

/**
 * Suggestion 37: Auto-Suggestions for Website Performance Optimization
 * Analyze and suggest performance improvements for client websites
 */
router.post('/suggest-performance-optimization', async (req: Request, res: Response) => {
  try {
    const { 
      businessType, 
      websiteUrl, 
      currentIssues, 
      targetAudience, 
      deviceTarget 
    } = req.body;
    
    if (!businessType || typeof businessType !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Business type is required and must be a string"
      });
    }
    
    // Create a unique cache key based on the input parameters
    const hashInput = `${businessType}_${websiteUrl || ''}_${currentIssues || ''}_${targetAudience || ''}_${deviceTarget || 'all'}`;
    const cacheKey = `performance_optimization_${Buffer.from(hashInput).toString('base64').substring(0, 40)}`;
    
    // Check cache first
    const cachedSuggestions = performanceOptimizationCache.get(cacheKey);
    if (cachedSuggestions) {
      console.log(`Returning cached performance optimization suggestions for: ${businessType}`);
      return res.json({
        success: true,
        optimizationSuggestions: cachedSuggestions,
        source: 'cache'
      });
    }
    
    console.log(`Generating new performance optimization suggestions for: ${businessType}`);
    
    // Build the prompt based on the available information
    let prompt = `Generate performance optimization suggestions for a ${businessType} business website.`;
    
    if (websiteUrl) {
      prompt += `\nWebsite URL: ${websiteUrl}`;
    }
    
    if (currentIssues) {
      prompt += `\nCurrent issues: ${currentIssues}`;
    }
    
    if (targetAudience) {
      prompt += `\nTarget audience: ${targetAudience}`;
    }
    
    if (deviceTarget) {
      prompt += `\nTarget devices: ${deviceTarget}`;
    }
    
    prompt += `\n\nPlease provide a comprehensive performance optimization plan with these sections:

1. Core Web Vitals Optimization
   - Largest Contentful Paint (LCP) improvements
   - First Input Delay (FID) improvements
   - Cumulative Layout Shift (CLS) improvements

2. Image Optimization Strategy
   - Recommendations for image formats
   - Lazy loading implementation
   - Image CDN recommendations

3. JavaScript and CSS Optimization
   - Code splitting recommendations
   - Critical CSS strategy
   - Third-party script management

4. Server and Hosting Recommendations
   - Caching strategy
   - CDN implementation
   - Hosting platform recommendations

5. Mobile Performance Optimization
   - Mobile-specific optimizations
   - Progressive Web App (PWA) considerations
   - Touch optimization

6. Implementation Priority
   - High-impact, quick wins
   - Medium-term improvements
   - Long-term strategic optimizations

Format your response as a JSON object with these sections. For each recommendation, include a brief explanation of the benefit and relative implementation difficulty (Easy, Medium, Hard).`;
    
    // Set timeout for Grok call (25 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out after 25 seconds')), 25000);
    });
    
    // Generate optimization suggestions using Grok API
    const grokPromise = callXAI('/chat/completions', {
      model: 'grok-3', // Using standard model for better quality analysis
      messages: [
        { 
          role: 'system', 
          content: 'You are a senior web performance engineer at Elevion, specializing in optimizing websites for various business types. Provide practical, actionable performance optimization recommendations in JSON format.'
        },
        { 
          role: 'user', 
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 2000
    });
    
    // Race between API call and timeout
    const response: any = await Promise.race([grokPromise, timeoutPromise]);
    
    if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
      throw new Error('Invalid response from Grok API');
    }
    
    const optimizationContent = response.choices[0].message.content;
    
    // Validate the response is proper JSON
    try {
      const parsedOptimizations = JSON.parse(optimizationContent);
      
      // Cache the successful response
      performanceOptimizationCache.set(cacheKey, parsedOptimizations);
      
      console.log(`Successfully generated performance optimization suggestions for: ${businessType}`);
      
      return res.json({
        success: true,
        optimizationSuggestions: parsedOptimizations,
        source: 'fresh'
      });
    } catch (jsonError) {
      console.error("Error parsing optimization JSON:", jsonError);
      
      // If JSON parsing fails, return the raw content with a warning
      return res.json({
        success: true,
        optimizationSuggestions: optimizationContent,
        source: 'fresh',
        warning: 'Response could not be parsed as JSON'
      });
    }
  } catch (error: any) {
    console.error("Error generating performance optimization suggestions:", error);
    
    // Handle different types of errors
    if (error.message === 'Request timed out after 25 seconds') {
      return res.status(504).json({
        success: false,
        message: "The request timed out. Please try again with more specific details."
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
      message: "Failed to generate performance optimization suggestions",
      error: error.message || "Unknown error"
    });
  }
});

/**
 * Suggestion 38: Auto-Suggestions for Client Blog Content
 * Suggest blog content for clients based on their business type
 */
router.post('/suggest-blog-content', async (req: Request, res: Response) => {
  try {
    const { businessType, targetAudience, contentLength, topics } = req.body;
    
    if (!businessType || typeof businessType !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Business type is required and must be a string"
      });
    }
    
    // Normalize business type for caching (lowercase, trim)
    const normalizedBusinessType = businessType.toLowerCase().trim();
    
    // Create a cache key based on request parameters
    const audienceKey = targetAudience ? Buffer.from(targetAudience.substr(0, 30)).toString('base64').substring(0, 20) : 'general';
    const lengthKey = contentLength || 'medium';
    const topicsKey = topics ? Buffer.from(topics.substr(0, 50)).toString('base64').substring(0, 20) : 'general';
    
    const cacheKey = `blog_content_${normalizedBusinessType}_${audienceKey}_${lengthKey}_${topicsKey}`;
    
    // Check cache first
    const cachedContent = blogContentSuggestionsCache.get(cacheKey);
    if (cachedContent) {
      console.log(`Returning cached blog content suggestions for business type: ${normalizedBusinessType}`);
      return res.json({
        success: true,
        blogContentSuggestions: cachedContent,
        source: 'cache'
      });
    }
    
    console.log(`Generating new blog content suggestions for business type: ${normalizedBusinessType}`);
    
    // Prepare prompt for blog content suggestion
    let prompt = `Suggest comprehensive blog content ideas for a ${businessType} business.`;
    
    if (targetAudience) {
      prompt += ` The target audience is ${targetAudience}.`;
    }
    
    if (contentLength) {
      prompt += ` The content should be ${contentLength} in length.`;
    }
    
    if (topics) {
      prompt += ` Focus on these topics or themes: ${topics}.`;
    }
    
    prompt += `\n\nPlease structure your response with these sections:
    
1. Blog Content Strategy (overview for this business type)
2. 5 Blog Post Ideas with:
   - Catchy title
   - Brief summary (1-2 sentences)
   - Key points to cover (3-5 bullet points)
   - Target keywords for SEO
   - Suggested call-to-action
3. Content Calendar Suggestion (how to schedule these posts)
4. Tips for Engagement (how to maximize reader engagement)

Make the suggestions specific to the ${businessType} industry, addressing common customer pain points and questions.`;
    
    // Set timeout for Grok call (30 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out after 30 seconds')), 30000);
    });
    
    // Generate blog content suggestions using Grok API
    const grokPromise = callXAI('/chat/completions', {
      model: 'grok-3-mini', // Using mini model for faster responses
      messages: [
        { 
          role: 'system', 
          content: 'You are a content marketing specialist at Elevion, with expertise in creating engaging blog content strategies for various business types. Provide practical, industry-specific blog content suggestions that will help businesses connect with their audience and drive conversions.'
        },
        { 
          role: 'user', 
          content: prompt
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
    
    const blogContentSuggestions = response.choices[0].message.content;
    
    // Cache the successful response
    blogContentSuggestionsCache.set(cacheKey, blogContentSuggestions);
    
    console.log(`Successfully generated blog content suggestions for business type: ${normalizedBusinessType}`);
    
    return res.json({
      success: true,
      blogContentSuggestions,
      source: 'fresh'
    });
  } catch (error: any) {
    console.error("Error generating blog content suggestions:", error);
    
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
      message: "Failed to generate blog content suggestions",
      error: error.message || "Unknown error"
    });
  }
});

export default router;