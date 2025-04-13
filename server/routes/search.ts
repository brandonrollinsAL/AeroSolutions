import { Router, Request, Response } from 'express';
import { db } from '../db';
import { eq, ilike, or, desc } from 'drizzle-orm';
import { grokApi } from '../grok';
import { authenticate } from '../utils/auth';
import { storage } from '../storage';
import NodeCache from 'node-cache';
import { posts, marketplaceItems, users } from '@shared/schema';

const searchRouter = Router();
const searchCache = new NodeCache({ stdTTL: 600, checkperiod: 120 }); // 10 minute cache

// Search endpoint for general site content
searchRouter.get('/content/:query', async (req: Request, res: Response) => {
  try {
    const { query } = req.params;
    const cacheKey = `content_search_${query}`;
    
    // Check cache first
    const cachedResults = searchCache.get(cacheKey);
    if (cachedResults) {
      return res.status(200).json({
        success: true,
        data: cachedResults,
        cached: true
      });
    }
    
    // Search in posts (content, title)
    const postResults = await db.select()
      .from(posts)
      .where(or(
        ilike(posts.title, `%${query}%`),
        ilike(posts.content, `%${query}%`)
      ))
      .orderBy(desc(posts.createdAt))
      .limit(10);
    
    // Search in marketplace items (name, description)
    const marketplaceResults = await db.select()
      .from(marketplaceItems)
      .where(or(
        ilike(marketplaceItems.name, `%${query}%`),
        ilike(marketplaceItems.description, `%${query}%`),
        ilike(marketplaceItems.category, `%${query}%`)
      ))
      .limit(10);
    
    // Combine raw search results
    const rawResults = {
      posts: postResults,
      marketplace: marketplaceResults
    };
    
    // Format data for AI ranking
    const searchData = {
      posts: postResults.map(p => ({
        id: p.id,
        type: 'post',
        title: p.title,
        content: p.content?.substring(0, 200) + '...',
      })),
      marketplace: marketplaceResults.map(m => ({
        id: m.id,
        type: 'marketplace',
        title: m.name,
        content: m.description,
        category: m.category
      }))
    };
    
    // Combine all items for ranking
    const allItems = [
      ...searchData.posts,
      ...searchData.marketplace
    ];
    
    if (allItems.length === 0) {
      // No results found
      const emptyResults = {
        ranked_results: [],
        suggestions: ["Try using more general keywords", "Check for spelling errors"],
        query_analyzed: query
      };
      
      // Cache empty results for a shorter time
      searchCache.set(cacheKey, emptyResults, 300); // 5 minute cache for empty results
      
      return res.status(200).json({
        success: true,
        data: emptyResults
      });
    }
    
    // Use xAI to analyze and rank search results
    const prompt = `Analyze and rank these search results for relevance to the query "${query}". 
    Each item has an id, type, title, and content.
    
    ${JSON.stringify(allItems, null, 2)}
    
    Return a JSON response with:
    1. ranked_results: The items ranked by relevance, including their id, type, title, and relevance_score (0-1)
    2. suggestions: 2-3 related search terms the user might try
    3. query_analyzed: Analysis of the search query
    
    Only include items that are actually relevant to the query.`;
    
    const response = await grokApi.generateJson(prompt);
    
    // Cache the results
    searchCache.set(cacheKey, response);
    
    return res.status(200).json({
      success: true,
      data: response
    });
  } catch (error: any) {
    console.error('Search failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message,
      fallback: {
        ranked_results: [],
        suggestions: ["Try again later", "Contact support if this persists"],
        query_analyzed: "Error processing query"
      }
    });
  }
});

// AI-powered feature suggestions based on user's business type
searchRouter.get('/suggest-features/:userId', authenticate, async (req: Request, res: Response) => {
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
    
    // Get user preferences or use defaults
    const preferences = user.preferences ? JSON.parse(user.preferences) : {};
    const businessType = preferences.businessType || 'small business';
    const industry = preferences.industry || 'general';
    const size = preferences.size || 'small';
    const goals = preferences.goals || ['online presence', 'customer engagement'];
    
    const prompt = `Suggest website features for a ${size} ${businessType} in the ${industry} industry.
    Their business goals include: ${goals.join(', ')}
    
    Return a JSON object with:
    1. essential_features: Array of must-have features with name, description, and priority (1-5)
    2. recommended_features: Array of recommended features with name, description, and priority (1-5)
    3. innovative_features: Array of innovative/differentiating features with name, description
    4. industry_specific: Industry-specific recommendations
    5. budget_considerations: Budget considerations for implementing these features
    `;
    
    const response = await grokApi.generateJson(prompt);
    
    // Cache the results
    searchCache.set(cacheKey, response, 3600); // 1 hour cache
    
    return res.status(200).json({
      success: true,
      data: response
    });
  } catch (error: any) {
    console.error('Feature suggestion failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Feature suggestion failed',
      error: error.message,
      fallback: {
        essential_features: [
          { name: "Responsive Design", description: "Mobile-friendly website layout", priority: 5 },
          { name: "Contact Form", description: "Easy way for customers to reach you", priority: 5 },
          { name: "About Page", description: "Information about your business", priority: 4 }
        ],
        recommended_features: [
          { name: "Blog/News Section", description: "Share updates and industry insights", priority: 3 },
          { name: "Social Media Integration", description: "Connect with customers on social platforms", priority: 3 }
        ],
        innovative_features: [
          { name: "Live Chat", description: "Real-time customer support" }
        ],
        industry_specific: "Generic business website features",
        budget_considerations: "Focus on essential features first"
      }
    });
  }
});

export default searchRouter;