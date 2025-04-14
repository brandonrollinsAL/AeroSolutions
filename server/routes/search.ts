import { Router, Request, Response } from 'express';
import { validateParams } from '../utils/validation';
import { authMiddleware as authenticate } from '../utils/auth';
import { storage } from '../storage';
import { grokApi } from '../grok';
import NodeCache from 'node-cache';
import { db } from '../db';
import { SQL, and, asc, desc, eq, ilike, inArray, or } from 'drizzle-orm';
import { z } from 'zod';

const searchRouter = Router();

// Create a cache to improve performance and reduce AI API calls
const searchCache = new NodeCache({ 
  stdTTL: 1800, // 30 minutes
  checkperiod: 300, // 5 minutes
  maxKeys: 100 
});

// Content search endpoint with AI-enhanced results
searchRouter.get('/content/:query', 
  validateParams(z.object({
    query: z.string()
      .min(2, 'Search query is required and must be at least 2 characters')
      .max(100, 'Search query must be between 2 and 100 characters')
      .transform(val => val.trim())
  })),
  async (req: Request, res: Response) => {
    try {
      const { query } = req.params;
      
      // Cache key based on the query
      const cacheKey = `search_${query.toLowerCase()}`;
      
      // Check cache first
      const cachedResults = searchCache.get(cacheKey);
      if (cachedResults) {
        console.log(`Returning cached search results for: "${query}"`);
        return res.status(200).json({
          success: true,
          data: cachedResults,
          cached: true
        });
      }
      
      console.log(`Performing search for: "${query}"`);
      
      // First, get basic search results from DB using SQL search
      const basicResults = await getBasicSearchResults(query);
      
      if (basicResults.length === 0) {
        // If no basic results, generate AI-enhanced search response
        try {
          const enhancedResults = await enhanceSearchResultsWithAI(query, []);
          
          // Cache the results
          searchCache.set(cacheKey, enhancedResults);
          
          return res.status(200).json({
            success: true,
            data: enhancedResults,
            enhanced: true
          });
        } catch (aiError) {
          console.error("AI search enhancement failed:", aiError);
          
          // Return empty results with suggestions
          const fallbackResponse = {
            ranked_results: [],
            suggestions: generateFallbackSuggestions(query),
            query_analyzed: query
          };
          
          return res.status(200).json({
            success: true,
            data: fallbackResponse,
            fallback: true
          });
        }
      }
      
      // Enhance results with AI if available
      let finalResults;
      try {
        // Use xAI (Grok) to enhance the search results
        finalResults = await enhanceSearchResultsWithAI(query, basicResults);
      } catch (aiError) {
        console.error("AI search enhancement failed:", aiError);
        
        // Fallback to basic relevance sorting and suggestions
        finalResults = {
          ranked_results: basicResults.slice(0, 10).map(result => ({
            ...result,
            relevance_score: 0.7 // Default relevance score
          })),
          suggestions: generateFallbackSuggestions(query),
          query_analyzed: query
        };
      }
      
      // Cache the results
      searchCache.set(cacheKey, finalResults);
      
      return res.status(200).json({
        success: true,
        data: finalResults
      });
    } catch (error) {
      console.error("Search error:", error);
      return res.status(500).json({
        success: false,
        message: "Error performing search",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);

// Suggest features based on user's business type - authenticated route
searchRouter.get('/suggest-features/:userId', 
  authenticate,
  validateParams(z.object({
    userId: z.string().regex(/^\d+$/).transform(val => parseInt(val))
  })),
  async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const cacheKey = `feature_suggestions_${userId}`;
    
    // Check cache first
    const cachedSuggestions = searchCache.get(cacheKey);
    if (cachedSuggestions) {
      return res.status(200).json({
        success: true,
        data: cachedSuggestions,
        cached: true
      });
    }
    
    // Get user data
    const user = await storage.getUser(parseInt(userId, 10));
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get user business type from preferences or use default
    const preferences = user.preferences ? JSON.parse(user.preferences) : {};
    const businessType = preferences.businessType || 'small business';
    
    // Use xAI to suggest website features based on business type
    const prompt = `Suggest website features for a ${businessType}. 
    Return a JSON object with:
    1. essential_features: Array of must-have website features with name, description, and benefit
    2. recommended_features: Array of recommended features with name, description, and benefit
    3. innovative_features: Array of innovative/differentiating features with name, description, and benefit
    4. budget_estimate: Rough estimate of costs for implementing these features
    `;
    
    try {
      // Make the AI call with a timeout
      const aiResponse = await Promise.race([
        grokApi.generateJson(prompt, "You are an expert web consultant that helps businesses identify the most effective website features for their specific business type."),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('AI feature suggestion timed out')), 30000)
        )
      ]);
      
      // Cache the successful response
      searchCache.set(cacheKey, aiResponse, 7200); // 2-hour cache
      
      return res.status(200).json({
        success: true,
        data: aiResponse,
        cached: false
      });
    } catch (error) {
      console.error("AI feature suggestion error:", error);
      
      // Fallback response if AI fails
      const fallbackSuggestions = {
        essential_features: [
          { name: "Responsive Design", description: "Mobile-friendly website layout", benefit: "Reach customers on all devices" },
          { name: "Contact Form", description: "Easy way for customers to reach you", benefit: "Increase customer inquiries" },
          { name: "About Page", description: "Information about your business", benefit: "Build trust with potential customers" }
        ],
        recommended_features: [
          { name: "Blog/News Section", description: "Share updates and industry insights", benefit: "Improve SEO and demonstrate expertise" },
          { name: "Social Media Integration", description: "Connect with customers on social platforms", benefit: "Expand reach and engagement" }
        ],
        innovative_features: [
          { name: "Live Chat", description: "Real-time customer support", benefit: "Improve conversion rates" }
        ],
        budget_estimate: "Basic features: $3,000-5,000; All recommended features: $7,000-10,000"
      };
      
      return res.status(200).json({
        success: true,
        data: fallbackSuggestions,
        fallback: true
      });
    }
  } catch (error) {
    console.error('Feature suggestion failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Feature suggestion failed',
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Helper function to get basic search results from database
async function getBasicSearchResults(query: string) {
  try {
    // Sanitize the query for SQL search
    const sanitizedQuery = `%${query.replace(/[%_]/g, '\\$&')}%`;
    
    // Collection of all search results
    const results: any[] = [];
    
    // Search posts
    try {
      const posts = await storage.searchPosts(sanitizedQuery);
      results.push(...posts.map(post => ({
        id: post.id,
        type: 'post',
        title: post.title,
        content: post.content,
      })));
    } catch (err) {
      console.warn("Post search error:", err);
    }
    
    // Search marketplace items
    try {
      const marketplaceItems = await storage.searchMarketplaceItems(sanitizedQuery);
      results.push(...marketplaceItems.map(item => ({
        id: item.id,
        type: 'service',
        title: item.name,
        content: item.description,
      })));
    } catch (err) {
      console.warn("Marketplace search error:", err);
    }
    
    // Search service offerings
    try {
      const services = await storage.searchServices(sanitizedQuery);
      results.push(...services.map(service => ({
        id: service.id,
        type: 'service',
        title: service.name,
        content: service.description,
      })));
    } catch (err) {
      console.warn("Services search error:", err);
    }
    
    return results;
  } catch (error) {
    console.error("Basic search error:", error);
    return [];
  }
}

// Helper function to enhance search results with AI
async function enhanceSearchResultsWithAI(query: string, basicResults: any[]) {
  // If no AI API key or no basic results, return unmodified results
  if (basicResults.length === 0) {
    return {
      ranked_results: [],
      suggestions: generateAlternativeSearchTerms(query),
      query_analyzed: query
    };
  }
  
  // Prepare the prompt for xAI
  const promptContent = `
    Analyze this search query: "${query}"
    
    For the following search results, rank them by relevance to the search query,
    add a relevance score (0.0 to 1.0), and suggest alternative search terms.
    
    Search results:
    ${JSON.stringify(basicResults, null, 2)}
    
    Return a JSON object with:
    1. ranked_results: Array of results ranked by relevance with added relevance_score
    2. suggestions: Array of 3-5 alternative search terms related to the query
    3. query_analyzed: A corrected or expanded version of the query for better results
  `;
  
  const systemPrompt = 
    "You are an advanced search algorithm that provides relevant search results and suggestions. " +
    "Always provide a relevance_score between 0.0 and 1.0 for each result. " +
    "Ensure your suggestions are relevant to the original query and potential business needs.";
  
  // Call xAI API to enhance search results
  const enhancedResults = await grokApi.generateJson(
    promptContent,
    systemPrompt
  );
  
  // Ensure the response has the expected format
  const finalResults = {
    ranked_results: enhancedResults.ranked_results || basicResults.slice(0, 10),
    suggestions: enhancedResults.suggestions || generateAlternativeSearchTerms(query),
    query_analyzed: enhancedResults.query_analyzed || query
  };
  
  return finalResults;
}

// Helper function to generate alternative search terms if AI is unavailable
function generateAlternativeSearchTerms(query: string) {
  // Basic logic to suggest alternatives based on the query
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('website')) {
    return ['web development', 'web design', 'website builder', 'website templates', 'responsive design'];
  } else if (queryLower.includes('design')) {
    return ['UI design', 'graphic design', 'logo design', 'branding', 'website mockups'];
  } else if (queryLower.includes('marketing')) {
    return ['digital marketing', 'SEO', 'social media marketing', 'content marketing', 'email campaigns'];
  } else if (queryLower.includes('e-commerce') || queryLower.includes('ecommerce')) {
    return ['online store', 'shopping cart', 'product catalog', 'payment processing', 'inventory management'];
  } else if (queryLower.includes('mobile')) {
    return ['responsive design', 'mobile apps', 'progressive web apps', 'mobile optimization', 'mobile UX'];
  } else {
    // General web development related terms
    return ['web development', 'web design', 'digital marketing', 'SEO optimization', 'business website'];
  }
}

// Helper function to generate suggestions when search returns no results
function generateFallbackSuggestions(query: string) {
  // Generate some context-aware suggestions
  const alternatives = generateAlternativeSearchTerms(query);
  
  // Add some general suggestions
  const generalSuggestions = [
    'website development',
    'business website',
    'affordable web design',
    'website maintenance',
    'professional web services'
  ];
  
  // Combine and return unique suggestions
  return [...new Set([...alternatives, ...generalSuggestions.slice(0, 3)])].slice(0, 5);
}

export default searchRouter;