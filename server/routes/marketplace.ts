import { Router, Request, Response } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../utils/validation';
import { authenticate, authorize } from '../utils/auth';
import { storage } from '../storage';
import { getPublishableKey, createPaymentIntent, createStripeCustomer, createSubscription, getSubscription, cancelSubscription } from '../utils/stripe';
import { insertMarketplaceItemSchema, users, mockupRequests, marketplaceItems, marketplaceOrders, marketplaceServiceEngagement } from '@shared/schema';
import { z } from 'zod';
import { grokApi } from '../grok';
import { db } from '../db';
import { eq, desc, inArray } from 'drizzle-orm';
import NodeCache from 'node-cache';

const marketplaceRouter = Router();

// Create a cache for recommendations to avoid unnecessary AI calls
const recommendationCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

// Create a cache for listing descriptions to avoid unnecessary AI calls
const listingDescriptionCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

// Create a cache for social media post suggestions to avoid unnecessary AI calls
const socialPostSuggestionCache = new NodeCache({ stdTTL: 7200, checkperiod: 600 }); // 2 hour TTL

// Create a cache for business ad suggestions to avoid unnecessary AI calls
const adSuggestionCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 }); // 1 hour TTL

// Get all marketplace items
marketplaceRouter.get('/', async (req: Request, res: Response) => {
  try {
    const items = await storage.getAvailableMarketplaceItems();
    return res.status(200).json({ 
      success: true, 
      data: items 
    });
  } catch (error) {
    console.error('Error getting marketplace items:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error retrieving marketplace items' 
    });
  }
});

// Get marketplace item by ID
marketplaceRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const item = await storage.getMarketplaceItem(id);
    
    if (!item) {
      return res.status(404).json({ 
        success: false, 
        error: 'Marketplace item not found' 
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      data: item 
    });
  } catch (error) {
    console.error('Error getting marketplace item:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error retrieving marketplace item' 
    });
  }
});

// Create a marketplace item
marketplaceRouter.post(
  '/',
  authenticate,
  validate([
    body('name').isString().notEmpty(),
    body('description').isString().notEmpty(),
    body('price').isNumeric(),
    body('category').isString().notEmpty(),
    body('tags').isArray().optional(),
    body('images').isArray().optional(),
    body('isAvailable').isBoolean().optional(),
  ]),
  async (req: Request, res: Response) => {
    try {
      const sellerId = req.user.id;
      const itemData = {
        ...insertMarketplaceItemSchema.parse(req.body),
        sellerId
      };
      
      // In a production environment, we would create this in Stripe
      // For now, let's generate mock IDs for development
      const stripeProductId = `prod_${Math.random().toString(36).substring(2, 15)}`;
      const stripePriceId = `price_${Math.random().toString(36).substring(2, 15)}`;
      
      // Create the item in our database
      const item = await storage.createMarketplaceItem({
        ...itemData,
        stripeProductId,
        stripePriceId
      });
      
      return res.status(201).json({ 
        success: true, 
        data: item 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid marketplace item data', 
          details: error.errors 
        });
      }
      
      console.error('Error creating marketplace item:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Error creating marketplace item' 
      });
    }
  }
);

// Update a marketplace item
marketplaceRouter.patch(
  '/:id',
  authenticate,
  validate([
    body('name').isString().notEmpty().optional(),
    body('description').isString().notEmpty().optional(),
    body('price').isNumeric().optional(),
    body('category').isString().notEmpty().optional(),
    body('tags').isArray().optional(),
    body('images').isArray().optional(),
    body('isAvailable').isBoolean().optional(),
  ]),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = req.user.id;
      
      // Get the item
      const item = await storage.getMarketplaceItem(id);
      if (!item) {
        return res.status(404).json({ 
          success: false, 
          error: 'Marketplace item not found' 
        });
      }
      
      // Check if user is the seller
      if (item.sellerId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ 
          success: false, 
          error: 'Unauthorized to update this item' 
        });
      }
      
      // Update the item in our database
      const updatedItem = await storage.updateMarketplaceItem(id, req.body);
      
      return res.status(200).json({ 
        success: true, 
        data: updatedItem 
      });
    } catch (error) {
      console.error('Error updating marketplace item:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Error updating marketplace item' 
      });
    }
  }
);

// Purchase a marketplace item
marketplaceRouter.post(
  '/purchase',
  authenticate,
  validate([
    body('itemId').isNumeric().toInt(),
    body('quantity').isNumeric().toInt().optional(),
  ]),
  async (req: Request, res: Response) => {
    try {
      const { itemId, quantity = 1 } = req.body;
      const buyerId = req.user.id;
      
      // Get the item
      const item = await storage.getMarketplaceItem(itemId);
      if (!item) {
        return res.status(404).json({ 
          success: false, 
          error: 'Marketplace item not found' 
        });
      }
      
      if (!item.isAvailable) {
        return res.status(400).json({ 
          success: false, 
          error: 'Item is not available for purchase' 
        });
      }
      
      // Calculate total price
      const totalPrice = parseFloat(item.price.toString()) * quantity;
      
      // Get or create Stripe customer
      const user = await storage.getUser(buyerId);
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          error: 'User not found' 
        });
      }
      
      // Default customer ID in case Stripe creation fails
      let stripeCustomerId = 'cus_' + Math.random().toString(36).substring(2, 15);
      
      try {
        // Create or retrieve Stripe customer 
        stripeCustomerId = await createStripeCustomer(user);
      } catch (error) {
        console.error('Error creating Stripe customer:', error);
        // Continue with the mock customer ID
      }
      
      // Create payment intent for the marketplace item
      let clientSecret = '';
      let paymentIntentId = '';
      
      try {
        // Create a payment intent for the purchase
        const amount = Math.round(parseFloat(item.price.toString()) * 100 * quantity);
        const paymentIntent = await createPaymentIntent(amount, 'usd', stripeCustomerId);
        
        clientSecret = paymentIntent.client_secret || '';
        paymentIntentId = paymentIntent.id;
      } catch (error) {
        console.error('Error creating payment intent:', error);
        paymentIntentId = `pi_${Math.random().toString(36).substring(2, 15)}`;
        clientSecret = `pi_${Math.random().toString(36).substring(2, 15)}_secret_${Math.random().toString(36).substring(2, 15)}`;
      }
      
      // Create order in our database
      const order = await storage.createMarketplaceOrder({
        buyerId,
        itemId,
        quantity,
        totalPrice,
        status: 'pending',
        stripePaymentIntentId: paymentIntentId
      });
      
      return res.status(201).json({ 
        success: true, 
        data: {
          order,
          clientSecret
        }
      });
    } catch (error) {
      console.error('Error purchasing item:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Error processing purchase' 
      });
    }
  }
);

// Get user's orders
marketplaceRouter.get(
  '/orders/user',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const orders = await storage.getUserMarketplaceOrders(userId);
      
      return res.status(200).json({ 
        success: true, 
        data: orders 
      });
    } catch (error) {
      console.error('Error getting user orders:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Error retrieving user orders' 
      });
    }
  }
);

// AI-powered service recommendations based on user preferences
marketplaceRouter.get(
  '/recommend',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const cacheKey = `recommendations_${userId}`;
      
      // Check cache first
      const cachedRecommendations = recommendationCache.get(cacheKey);
      if (cachedRecommendations) {
        return res.status(200).json({
          success: true,
          data: cachedRecommendations,
          cached: true
        });
      }
      
      // Get user preferences
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      // Use default preferences if none specified
      const preferences = user.preferences || 'web development, small business, digital presence';
      
      // Get all marketplace items
      const items = await storage.getAllMarketplaceItems();
      
      if (items.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            recommendations: [],
            message: 'No marketplace items available for recommendation'
          }
        });
      }
      
      // Format marketplace items for AI processing
      const itemsData = items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        tags: item.tags || []
      }));
      
      // Prepare the prompt for xAI
      const promptContent = `
        Based on user preferences: "${preferences}", recommend the most suitable services 
        from the following marketplace items:
        
        ${JSON.stringify(itemsData, null, 2)}
        
        Return a JSON object with the following structure:
        {
          "recommendations": [
            {
              "id": number,
              "reason": string,
              "suitabilityScore": number (1-10)
            }
          ],
          "topCategories": [string],
          "suggestedFeatures": [string]
        }
      `;
      
      try {
        // Make the AI call with a timeout
        const aiResponse = await Promise.race([
          grokApi.generateJson(promptContent, "You are an expert business consultant that helps match users with the right web development services based on their needs."),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('AI recommendation timed out')), 30000)
          )
        ]);
        
        // Format and cache the response
        const recommendations = {
          recommendations: aiResponse.recommendations || [],
          topCategories: aiResponse.topCategories || [],
          suggestedFeatures: aiResponse.suggestedFeatures || []
        };
        
        // Cache the successful response
        recommendationCache.set(cacheKey, recommendations);
        
        return res.status(200).json({
          success: true,
          data: recommendations,
          cached: false
        });
      } catch (error) {
        console.error("AI recommendation error:", error);
        
        // Fallback: basic recommendation algorithm if AI fails
        const fallbackRecommendations = items
          .filter(item => item.isAvailable)
          .slice(0, 3)
          .map(item => ({
            id: item.id,
            reason: `This service matches your general needs`,
            suitabilityScore: 7
          }));
        
        return res.status(200).json({
          success: true,
          data: {
            recommendations: fallbackRecommendations,
            topCategories: ['Web Development', 'Design'],
            suggestedFeatures: ['Responsive Design', 'SEO Optimization'],
            fallback: true
          }
        });
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return res.status(500).json({
        success: false,
        error: 'Error generating service recommendations'
      });
    }
  }
);

// AI-powered feature suggestions based on user's business type
marketplaceRouter.get('/suggest-features/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const cacheKey = `feature_suggestions_${userId}`;
    
    // Check cache first
    const cachedSuggestions = recommendationCache.get(cacheKey);
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
      recommendationCache.set(cacheKey, aiResponse, 7200); // 2-hour cache
      
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
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Suggest a listing description for marketplace items
marketplaceRouter.post('/suggest-listing', async (req: Request, res: Response) => {
  try {
    const { serviceName } = req.body;
    
    if (!serviceName || typeof serviceName !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Service name is required'
      });
    }
    
    // Check cache first to avoid unnecessary API calls
    const cacheKey = `listing_description_${serviceName.toLowerCase().replace(/\s+/g, '_')}`;
    const cachedDescription = listingDescriptionCache.get(cacheKey);
    
    if (cachedDescription) {
      return res.status(200).json({
        success: true,
        description: cachedDescription,
        cached: true
      });
    }
    
    // Prepare prompt for the AI
    const messages = [
      {
        role: 'system' as const,
        content: 'You are an expert web development service copywriter who specializes in creating compelling marketplace listings. Create a professional, detailed, and persuasive description for the following web development service. Focus on benefits, key features, and unique selling points. Keep the description between 100-200 words.'
      },
      {
        role: 'user' as const,
        content: `Create a marketplace listing description for: ${serviceName}`
      }
    ];
    
    try {
      // Make the AI call with a timeout
      const aiResponse = await Promise.race([
        grokApi.createChatCompletion(messages, {
          model: 'grok-3-mini',
          temperature: 0.7
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('AI description generation timed out')), 30000)
        )
      ]);
      
      const description = aiResponse.choices[0].message.content;
      
      // Cache the successful response
      listingDescriptionCache.set(cacheKey, description);
      
      return res.status(200).json({
        success: true,
        description,
        cached: false
      });
    } catch (error) {
      console.error("AI description generation error:", error);
      
      // Fallback response with generic description
      const fallbackDescription = `${serviceName} - Professional web development service tailored to meet your business needs. Our team of experts will create a custom solution that helps your business thrive online with modern design and powerful functionality. We focus on responsive design, user experience, and performance optimization to ensure your website stands out from the competition.`;
      
      return res.status(200).json({
        success: true,
        description: fallbackDescription,
        fallback: true
      });
    }
  } catch (error) {
    console.error('Error generating listing description:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate listing description'
    });
  }
});

/**
 * Suggestion 20: Auto-Suggestions for Marketing Strategies
 * Suggest marketing strategies for small businesses based on their industry
 */
marketplaceRouter.get(
  '/suggest-marketing/:userId',
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      // Create cache key for this user's marketing strategies
      const cacheKey = `marketing_strategies_${userId}`;
      
      // Check cache first for faster response times
      const cachedResult = recommendationCache.get(cacheKey);
      if (cachedResult) {
        console.log(`[Cache Hit] Returning cached marketing strategies for user ${userId}`);
        return res.json(cachedResult);
      }
      
      // Get user from database
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, parseInt(userId)));
      
      // Parse preferences or use default
      const preferences = user?.preferences ? JSON.parse(user.preferences) : null;
      const businessType = preferences?.businessType || preferences?.industry || 'small business';
      
      // Generate marketing strategies using grok-3 for more comprehensive responses
      const response = await grokApi.generateJson<{
        strategies: {
          title: string;
          description: string;
          estimatedCost: string;
          timeToImplement: string;
          difficulty: 'Easy' | 'Medium' | 'Hard';
          potentialROI: 'Low' | 'Medium' | 'High';
        }[];
        industry: string;
        overview: string;
      }>(
        `Based on a ${businessType} business, suggest 5 effective marketing strategies that would help grow their customer base and increase sales.
        For each strategy, provide:
        1. A clear title
        2. A concise description (2-3 sentences)
        3. Estimated cost range
        4. Time to implement
        5. Difficulty level (Easy/Medium/Hard)
        6. Potential ROI (Low/Medium/High)
        
        Also include an "overview" field with general marketing advice for this specific business type.`,
        `You are a marketing expert for Elevion, a web development company. Generate a JSON object with:
        1. "strategies" array containing objects with title, description, estimatedCost, timeToImplement, difficulty, and potentialROI fields.
        2. "industry" string showing what business type these strategies are for.
        3. "overview" string with a brief paragraph of general marketing advice for this industry.`
      );
      
      // Create the result
      const result = {
        success: true,
        userId,
        businessType,
        marketingStrategies: response,
        timestamp: new Date().toISOString()
      };
      
      // Cache the result
      recommendationCache.set(cacheKey, result);
      
      return res.json(result);
    } catch (error: any) {
      console.error('Marketing strategy suggestion failed:', error);
      
      // Provide fallback strategies to ensure UI always has content
      const fallbackStrategies = {
        strategies: [
          {
            title: "Content Marketing Campaign",
            description: "Create valuable blog posts, videos, and guides targeted at your industry audience. Establishes your business as an authority and drives organic traffic.",
            estimatedCost: "$500-$2,000/month",
            timeToImplement: "1-3 months",
            difficulty: "Medium",
            potentialROI: "High"
          },
          {
            title: "Local SEO Optimization",
            description: "Optimize your Google Business profile and website for local search. Makes your business more visible to nearby customers searching for your services.",
            estimatedCost: "$300-$1,000/month",
            timeToImplement: "1-2 months",
            difficulty: "Easy",
            potentialROI: "Medium"
          },
          {
            title: "Email Marketing Automation",
            description: "Set up automated email sequences for nurturing leads and maintaining customer relationships. Helps convert prospects and encourages repeat business.",
            estimatedCost: "$200-$500/month",
            timeToImplement: "2-4 weeks",
            difficulty: "Medium",
            potentialROI: "High"
          },
          {
            title: "Social Media Advertising",
            description: "Run targeted ad campaigns on platforms where your audience is most active. Reaches potential customers with precise demographic and interest targeting.",
            estimatedCost: "$500-$2,000/month",
            timeToImplement: "1-2 weeks",
            difficulty: "Medium",
            potentialROI: "Medium"
          },
          {
            title: "Referral Program",
            description: "Implement a system that rewards existing customers for referring new business. Leverages word-of-mouth marketing through incentives.",
            estimatedCost: "$300-$1,000 to set up + rewards",
            timeToImplement: "2-4 weeks",
            difficulty: "Easy",
            potentialROI: "High"
          }
        ],
        industry: "small business",
        overview: "For small businesses, the most effective marketing strategies focus on targeted local efforts, building strong customer relationships, and maximizing return on minimal investment. Digital marketing offers the best balance of affordability and reach, while strategic networking helps establish your local presence."
      };
      
      return res.json({
        success: false,
        userId,
        businessType: "small business",
        marketingStrategies: fallbackStrategies,
        timestamp: new Date().toISOString(),
        fallback: true,
        error: error.message
      });
    }
  }
);

// Create a cache for SEO strategy suggestions to avoid unnecessary AI calls
const seoStrategyCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

// Suggest SEO strategies for client websites based on their content
marketplaceRouter.post(
  '/suggest-seo',
  validate([
    body('websiteContent').isString().notEmpty().withMessage('Website content is required')
  ]),
  async (req: Request, res: Response) => {
    try {
      const { websiteContent } = req.body;
      
      // Generate a cache key based on content hash to avoid redundant processing
      const contentHash = require('crypto').createHash('md5').update(websiteContent).digest('hex');
      const cacheKey = `seo_strategy_${contentHash}`;
      
      // Check if we have a cached result
      const cachedResult = seoStrategyCache.get(cacheKey);
      if (cachedResult) {
        console.log(`[Cache Hit] Using cached SEO strategy suggestions`);
        return res.json(cachedResult);
      }
      
      // Set up the prompt for the AI
      const prompt = `As an SEO expert, analyze the following website content and suggest comprehensive SEO strategies.
      Include recommendations for keywords, meta tags, content structure, backlink strategies, and technical SEO improvements.
      Format your response as a detailed, actionable plan that a business owner can implement.
      
      Website Content:
      ${websiteContent}
      
      Provide your SEO strategy recommendations in the following JSON format:
      {
        "overall_assessment": "A brief assessment of the current content's SEO potential",
        "keyword_recommendations": {
          "primary_keywords": ["list", "of", "3-5", "recommended", "primary", "keywords"],
          "secondary_keywords": ["list", "of", "5-8", "secondary", "or", "long-tail", "keywords"],
          "keyword_placement_tips": "Tips on where and how to place keywords"
        },
        "content_recommendations": {
          "structure_improvements": ["list", "of", "recommendations", "for", "content", "structure"],
          "content_gaps": ["identified", "topics", "or", "sections", "to", "add"],
          "readability_tips": "Suggestions to improve content readability"
        },
        "technical_seo": {
          "meta_title": "Suggested meta title",
          "meta_description": "Suggested meta description",
          "url_structure": "Recommendation for URL structure",
          "schema_markup": "Suggestions for appropriate schema markup"
        },
        "link_building": {
          "internal_linking": ["strategies", "for", "internal", "links"],
          "external_linking": ["potential", "sources", "for", "backlinks"]
        },
        "additional_strategies": ["list", "of", "other", "SEO", "tactics", "specific", "to", "this", "business"]
      }`;
      
      // Call the Grok AI API
      const response = await grokApi.generateJson(prompt);
      
      // Create the result object
      const result = {
        success: true,
        seoStrategies: response,
        timestamp: new Date().toISOString()
      };
      
      // Cache the result
      seoStrategyCache.set(cacheKey, result);
      
      // Return the SEO strategy suggestions
      return res.json(result);
    } catch (error: any) {
      console.error('Error generating SEO strategies:', error);
      
      // Prepare fallback SEO strategies for reliability
      const fallbackStrategies = {
        overall_assessment: "Unable to perform a complete analysis of your content. Here are general SEO best practices that apply to most websites.",
        keyword_recommendations: {
          primary_keywords: ["your business name", "main product/service", "location (if local business)"],
          secondary_keywords: ["industry + benefits", "solutions for + customer pain points", "how to + related task", "best + product category", "affordable + service type"],
          keyword_placement_tips: "Include primary keywords in titles, headings, first paragraph, and last paragraph. Use secondary keywords throughout content naturally."
        },
        content_recommendations: {
          structure_improvements: [
            "Use proper heading hierarchy (H1, H2, H3)",
            "Keep paragraphs under 3-4 sentences",
            "Include bullet points for scannable content",
            "Add subheadings every 300 words"
          ],
          content_gaps: [
            "Frequently Asked Questions section",
            "Customer testimonials",
            "Case studies or examples",
            "Detailed service/product descriptions"
          ],
          readability_tips: "Aim for 8th-grade reading level. Use shorter sentences, active voice, and clear language. Break up text with images and formatting."
        },
        technical_seo: {
          meta_title: "Primary Keyword | Business Name | Unique Value Proposition",
          meta_description: "150-160 character description with primary keyword and call to action",
          url_structure: "Use short, descriptive URLs with keywords. Avoid parameters and special characters.",
          schema_markup: "Implement organization, local business, and product/service schema markup based on your business type."
        },
        link_building: {
          internal_linking: [
            "Link between related content pages",
            "Create a resource center or blog",
            "Link from high-authority pages to important conversion pages"
          ],
          external_linking: [
            "Local business directories",
            "Industry associations",
            "Partner websites",
            "Guest blogging opportunities"
          ]
        },
        additional_strategies: [
          "Optimize page loading speed",
          "Ensure mobile-friendly design",
          "Create location-specific pages (if applicable)",
          "Implement social sharing capabilities",
          "Set up Google Business Profile (for local businesses)"
        ]
      };
      
      return res.json({
        success: true,
        seoStrategies: fallbackStrategies,
        timestamp: new Date().toISOString(),
        fallback: true,
        error: error.message
      });
    }
  }
);

// Create a cache for content marketing suggestions to avoid unnecessary AI calls
const contentMarketingCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

// Generate content marketing suggestions based on business type
marketplaceRouter.post(
  '/content-marketing-suggestions',
  validate([
    body('businessType').isString().notEmpty().withMessage('Business type is required'),
    body('userId').optional().isNumeric().toInt()
  ]),
  async (req: Request, res: Response) => {
    try {
      const { businessType, userId } = req.body;
      
      // Generate a cache key based on business type - standardized format
      const normalizedBizType = businessType.toLowerCase().replace(/\s+/g, '_');
      const cacheKey = `content-marketing-${normalizedBizType}`;
      
      // Check if we have a cached result
      console.log(`[Content Marketing API] Checking cache for key: ${cacheKey}`);
      const cachedResult = contentMarketingCache.get(cacheKey);
      if (cachedResult) {
        console.log(`[Content Marketing API] Cache HIT for business type: ${businessType}`);
        return res.json({
          ...cachedResult,
          cacheHit: true
        });
      }
      console.log(`[Content Marketing API] Cache MISS for business type: ${businessType}`);

      // If userId is provided, try to get more context from their mockup requests
      let businessGoals = '';
      let targetAudience = '';
      let industryCategory = '';
      
      if (userId) {
        try {
          // Get the most recent mockup request for this user to get more context
          const [recentMockup] = await db
            .select()
            .from(mockupRequests)
            .where(eq(mockupRequests.userId, userId))
            .orderBy(desc(mockupRequests.createdAt))
            .limit(1);
            
          if (recentMockup) {
            businessGoals = recentMockup.businessGoals || '';
            targetAudience = recentMockup.targetAudience || '';
            industryCategory = recentMockup.industryCategory || '';
          }
        } catch (error) {
          console.error('Error fetching user mockup data:', error);
          // Continue without the additional context
        }
      }
      
      // Set up the prompt for the AI - use grok-3-mini model for faster responses
      const prompt = `As a content marketing specialist for ${businessType} businesses, provide actionable content marketing suggestions.
      ${businessGoals ? `The business has stated these goals: ${businessGoals}` : ''}
      ${targetAudience ? `Their target audience is: ${targetAudience}` : ''}
      ${industryCategory ? `They are in the ${industryCategory} industry` : ''}
      
      Provide content marketing recommendations in the following JSON format:
      {
        "overview": "A brief assessment of content marketing opportunities for this business type",
        "content_strategy": {
          "primary_topics": ["list", "of", "5-7", "recommended", "content", "topics"],
          "content_types": ["list", "of", "recommended", "content", "formats"],
          "frequency_recommendations": "How often to publish different types of content",
          "content_distribution": ["list", "of", "channels", "for", "content", "distribution"]
        },
        "content_calendar": {
          "month_1": [
            {
              "topic": "Suggested topic",
              "content_type": "Article/Video/Infographic/etc",
              "distribution_channels": ["list", "of", "channels"],
              "target_outcome": "Expected benefit from this content piece"
            }
          ],
          "month_2": [
            // Similar structure
          ],
          "month_3": [
            // Similar structure
          ]
        },
        "topic_ideas": {
          "educational": ["list", "of", "5", "educational", "topic", "ideas"],
          "promotional": ["list", "of", "3-5", "promotional", "topic", "ideas"],
          "engagement": ["list", "of", "3-5", "engagement-focused", "topic", "ideas"]
        },
        "success_metrics": {
          "kpis": ["list", "of", "key", "performance", "indicators"],
          "measurement_tools": ["list", "of", "suggested", "tools"]
        },
        "additional_tips": ["list", "of", "3-5", "content", "marketing", "tips", "for", "this", "business", "type"]
      }`;
      
      // First check if we have recommendations for a similar/related business type in cache
      // This helps with faster responses and handling system load
      const similarBusinessTypes = {
        "dentist": "dental clinic",
        "dental office": "dental clinic",
        "lawyer": "law firm",
        "attorney": "law firm",
        "legal office": "law firm",
        "restaurant": "local restaurant",
        "cafe": "local restaurant",
        "eatery": "local restaurant",
        "store": "retail shop",
        "shop": "retail shop",
        "boutique": "retail shop",
        "salon": "beauty salon",
        "beauty parlor": "beauty salon",
        "spa": "beauty salon",
        "gym": "fitness center",
        "fitness studio": "fitness center",
        "workout studio": "fitness center",
      };

      // Normalize the business type for better cache hits
      const normalizedType = businessType.toLowerCase();
      const mappedType = (similarBusinessTypes as any)[normalizedType] || normalizedType;
      const mappedCacheKey = `content-marketing-${mappedType}`;
      
      // Check if we have a cached result for the mapped business type
      const mappedCachedResult = contentMarketingCache.get(mappedCacheKey);
      if (mappedCachedResult) {
        console.log(`[Content Marketing API] Using cached result for similar business type: ${mappedType}`);
        // Return the cached result but update the business type in the response
        return res.json({
          ...mappedCachedResult,
          businessType: businessType, // Use the original business type in the response
          similarTypeCacheHit: true,
          mappedFrom: mappedType
        });
      }
      
      // Call the Grok AI API with a reduced timeout (10 seconds for faster response)
      try {
        console.log(`[Content Marketing API] Generating suggestions for business type: ${businessType}`);
        const response = await Promise.race([
          grokApi.generateJson(prompt, "You are an expert content marketer who specializes in creating tailored content strategies for different business types. Be efficient and straight to the point.", "grok-3-mini"),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('AI content marketing suggestions timed out')), 10000)
          )
        ]);
        
        // Create the result object
        const result = {
          success: true,
          contentMarketing: response,
          businessType: businessType,
          timestamp: new Date().toISOString()
        };
        
        // Cache the result for the exact business type
        contentMarketingCache.set(cacheKey, result);
        
        // Also cache under the normalized/mapped type for future similar requests
        if (mappedType !== normalizedType) {
          contentMarketingCache.set(mappedCacheKey, result);
          console.log(`[Content Marketing API] Also cached result for mapped business type: ${mappedType}`);
        }
        
        // Return the content marketing suggestions
        return res.json(result);
      } catch (aiError: any) {
        console.error('Error generating content marketing suggestions with AI:', aiError?.message || aiError);
        
        // Prepare fallback content marketing suggestions for reliability
        const fallbackSuggestions = {
          overview: `Content marketing is essential for ${businessType} businesses to build authority, attract customers, and demonstrate expertise.`,
          content_strategy: {
            primary_topics: [
              "Industry trends and news",
              "How-to guides and tutorials",
              "Client success stories",
              "Product/service highlights",
              "Expert opinions and insights",
              "FAQ and common challenges",
              "Industry best practices"
            ],
            content_types: [
              "Blog posts (800-1500 words)",
              "Email newsletters",
              "Social media posts",
              "Video tutorials",
              "Infographics",
              "Case studies",
              "Podcasts or interviews"
            ],
            frequency_recommendations: "Blog posts: 2-4 times monthly; Social media: 3-5 times weekly; Email newsletter: 1-2 times monthly; Video content: 1-2 times monthly",
            content_distribution: [
              "Company website/blog",
              "Email marketing",
              "LinkedIn",
              "Facebook",
              "Instagram",
              "YouTube",
              "Industry forums"
            ]
          },
          content_calendar: {
            month_1: [
              {
                topic: "Industry trends affecting clients in 2025",
                content_type: "Blog post + infographic",
                distribution_channels: ["Website", "LinkedIn", "Email newsletter"],
                target_outcome: "Establish authority and demonstrate industry knowledge"
              },
              {
                topic: "How our services solve common client problems",
                content_type: "Video tutorial",
                distribution_channels: ["YouTube", "Website", "Social media"],
                target_outcome: "Address pain points and showcase solutions"
              }
            ],
            month_2: [
              {
                topic: "Client success story: Measurable results",
                content_type: "Case study",
                distribution_channels: ["Website", "LinkedIn", "Sales materials"],
                target_outcome: "Build trust through social proof"
              },
              {
                topic: "Expert tips for improving business outcomes",
                content_type: "Checklist/guide",
                distribution_channels: ["Website", "Email newsletter", "Social media"],
                target_outcome: "Generate leads through valuable downloadable content"
              }
            ],
            month_3: [
              {
                topic: "Behind the scenes: Our process",
                content_type: "Photo/video series",
                distribution_channels: ["Instagram", "Facebook", "Website"],
                target_outcome: "Humanize the brand and build connection"
              },
              {
                topic: "Industry expert interview/Q&A",
                content_type: "Podcast or written interview",
                distribution_channels: ["Website", "LinkedIn", "Industry forums"],
                target_outcome: "Expand reach through partnered content"
              }
            ]
          },
          topic_ideas: {
            educational: [
              "Essential tools/resources every client should know about",
              "Step-by-step guide to solving a common problem",
              "Industry terms explained in plain language",
              "How to evaluate quality in our industry",
              "Future trends and how to prepare for them"
            ],
            promotional: [
              "How our approach differs from competitors",
              "New service announcement with special offer",
              "Client testimonial spotlight",
              "Before/after project showcase"
            ],
            engagement: [
              "Ask Me Anything session with company expert",
              "Industry survey with shared results",
              "Community spotlight featuring client success",
              "Reaction to recent industry news/developments"
            ]
          },
          success_metrics: {
            kpis: [
              "Website traffic",
              "Time on page",
              "Email open and click rates",
              "Social media engagement",
              "Content downloads",
              "Lead generation from content",
              "Conversion rate from content-sourced leads"
            ],
            measurement_tools: [
              "Google Analytics",
              "Email marketing platform analytics",
              "Social media platform insights",
              "CRM lead tracking",
              "Customer feedback surveys"
            ]
          },
          additional_tips: [
            "Repurpose content across multiple formats to maximize value",
            "Focus on solving problems rather than promoting services",
            "Include clear calls-to-action in all content pieces",
            "Create a consistent publishing schedule to build audience expectations",
            "Analyze performance data monthly and adjust strategy accordingly"
          ]
        };
        
        // Create the fallback result object
        const fallbackResult = {
          success: true,
          contentMarketing: fallbackSuggestions,
          businessType: businessType,
          timestamp: new Date().toISOString(),
          fallback: true,
          error: aiError.message
        };
        
        // Cache the fallback result for both the exact business type and the mapped type
        contentMarketingCache.set(cacheKey, fallbackResult);
        if (mappedType !== normalizedType) {
          contentMarketingCache.set(mappedCacheKey, fallbackResult);
          console.log(`[Content Marketing API] Cached fallback result for mapped business type: ${mappedType}`);
        }
        
        return res.json(fallbackResult);
      }
    } catch (error: any) {
      console.error('Error generating content marketing suggestions:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Error generating content marketing suggestions',
        message: error.message
      });
    }
  }
);

// Create a cache for sales analytics to improve performance
const salesAnalyticsCache = new NodeCache({ stdTTL: 900, checkperiod: 300 }); // 15 minute cache

/**
 * Suggestion 32: Real-Time Analytics for Marketplace Sales
 * Analyze sales data for marketplace services
 */
marketplaceRouter.get('/sales-analytics', async (req: Request, res: Response) => {
  try {
    // Check if there's a cached result
    const cacheKey = 'marketplace_sales_analytics';
    const cachedAnalytics = salesAnalyticsCache.get(cacheKey);
    
    if (cachedAnalytics) {
      console.log('[Sales Analytics] Returning cached analytics data');
      return res.json({
        success: true,
        ...cachedAnalytics,
        source: 'cache'
      });
    }
    
    console.log('[Sales Analytics] Generating fresh sales analytics');
    
    // Fetch sales data from the database
    const orders = await db.select({
      id: marketplaceOrders.id,
      buyerId: marketplaceOrders.buyerId,
      itemId: marketplaceOrders.itemId,
      totalPrice: marketplaceOrders.totalPrice,
      status: marketplaceOrders.status,
      createdAt: marketplaceOrders.createdAt
    })
    .from(marketplaceOrders)
    .where(eq(marketplaceOrders.status, 'completed'))
    .orderBy(desc(marketplaceOrders.createdAt))
    .limit(100);
    
    // If no orders exist, return empty analytics
    if (orders.length === 0) {
      return res.json({
        success: true,
        message: 'No completed orders found to analyze',
        analytics: {
          totalSales: 0,
          orderCount: 0,
          averageOrderValue: 0,
          timeAnalysis: [],
          topProducts: []
        }
      });
    }
    
    // Get item details for the orders
    const itemIds = [...new Set(orders.map(order => order.itemId))];
    const items = await db.select({
      id: marketplaceItems.id,
      name: marketplaceItems.name,
      category: marketplaceItems.category
    })
    .from(marketplaceItems)
    .where(inArray(marketplaceItems.id, itemIds));
    
    // Create a map of item details for quick lookup
    const itemMap = items.reduce((map, item) => {
      map[item.id] = item;
      return map;
    }, {} as Record<number, typeof items[0]>);
    
    // Format data for analysis
    const salesData = orders.map(order => {
      const item = itemMap[order.itemId] || { name: `Unknown (ID: ${order.itemId})`, category: 'Unknown' };
      return {
        orderDate: order.createdAt.toISOString(),
        itemName: item.name,
        category: item.category,
        price: Number(order.totalPrice)
      };
    });
    
    // Basic analytics calculations (without AI)
    const totalSales = orders.reduce((sum, order) => sum + Number(order.totalPrice), 0);
    const orderCount = orders.length;
    const averageOrderValue = totalSales / orderCount;
    
    // Sales by category
    const salesByCategory: Record<string, { count: number, value: number }> = {};
    salesData.forEach(sale => {
      if (!salesByCategory[sale.category]) {
        salesByCategory[sale.category] = { count: 0, value: 0 };
      }
      salesByCategory[sale.category].count += 1;
      salesByCategory[sale.category].value += sale.price;
    });
    
    // Top selling products
    const salesByProduct: Record<string, { count: number, value: number }> = {};
    salesData.forEach(sale => {
      if (!salesByProduct[sale.itemName]) {
        salesByProduct[sale.itemName] = { count: 0, value: 0 };
      }
      salesByProduct[sale.itemName].count += 1;
      salesByProduct[sale.itemName].value += sale.price;
    });
    
    const topProducts = Object.entries(salesByProduct)
      .map(([itemName, data]) => ({ 
        itemName, 
        orderCount: data.count,
        totalValue: data.value 
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);
    
    // Additional AI-driven insights using Grok API
    let aiInsights = null;
    try {
      // Format data for the Grok API
      const formattedData = salesData
        .map(s => `Date: ${s.orderDate.substring(0, 10)}, Item: ${s.itemName}, Category: ${s.category}, Price: $${s.price.toFixed(2)}`)
        .join('\n');
      
      // Set timeout for Grok call (10 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AI insights timed out after 10 seconds')), 10000);
      });
      
      // Call the Grok API for insights
      const grokPromise = grokApi.generateJson(
        `Analyze the following marketplace sales data and provide insightful trends and recommendations:
        
        ${formattedData}
        
        Provide a JSON response with the following structure:
        {
          "keyTrends": [string array of 3-5 key trends identified],
          "customerBehaviorInsights": [string array of 2-3 insights about customer purchasing patterns],
          "salesOpportunities": [string array of 2-3 revenue growth opportunities],
          "recommendations": [string array of 3 actionable recommendations]
        }`,
        'You are a data analytics expert specializing in e-commerce sales analysis. Your task is to find valuable insights in sales data and provide actionable recommendations.'
      );
      
      // Race between API call and timeout
      aiInsights = await Promise.race([grokPromise, timeoutPromise]);
    } catch (error) {
      console.warn('[Sales Analytics] AI insights failed:', error.message);
      // Continue without AI insights if the API call fails
      aiInsights = {
        keyTrends: ['AI insights unavailable'],
        note: 'AI-powered insights could not be generated'
      };
    }
    
    // Prepare the final analytics result
    const analyticsResult = {
      totalSales,
      orderCount,
      averageOrderValue,
      topProducts,
      salesByCategory: Object.entries(salesByCategory).map(([category, data]) => ({
        category,
        orderCount: data.count,
        totalValue: data.value,
        percentOfTotal: (data.value / totalSales * 100).toFixed(1) + '%'
      })),
      aiInsights,
      generatedAt: new Date().toISOString()
    };
    
    // Cache the result
    salesAnalyticsCache.set(cacheKey, analyticsResult);
    
    // Return the analytics
    return res.json({
      success: true,
      ...analyticsResult,
      source: 'fresh'
    });
  } catch (error: any) {
    console.error('[Sales Analytics] Error analyzing sales data:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze sales data',
      error: error.message || 'Unknown error'
    });
  }
});

// Auto-Suggestions for Client Social Media Posts
marketplaceRouter.get('/suggest-social-posts/:userId', async (req: Request, res: Response) => {  
  const { userId } = req.params;  
  try {
    const cacheKey = `social_posts_${userId}`;
    
    // Check cache first
    const cachedPosts = socialPostSuggestionCache.get(cacheKey);
    if (cachedPosts) {
      return res.status(200).json({
        success: true,
        data: cachedPosts,
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
    
    try {
      // Make the AI call with a timeout
      const response = await Promise.race([
        grokApi.createChatCompletion([
          { 
            role: 'system', 
            content: 'You are a professional social media marketing expert who creates strategic content for businesses.' 
          },
          { 
            role: 'user', 
            content: `Suggest 5 engaging social media posts for a ${businessType} business that will increase engagement and drive traffic. Include posts for different platforms (Twitter, Facebook, Instagram, LinkedIn), and make them specific and relevant to the industry.` 
          }
        ], { 
          model: 'grok-3-mini',  // Use the mini model for faster responses
          temperature: 0.7 
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('AI social post suggestion timed out')), 15000)
        )
      ]);
      
      const posts = response.choices[0].message.content;
      
      // Cache the successful response
      socialPostSuggestionCache.set(cacheKey, posts);
      
      return res.status(200).json({
        success: true,
        data: { posts },
        cached: false
      });
    } catch (error: any) {
      console.error("AI social post suggestion error:", error);
      
      // Fallback response if AI fails
      const fallbackPosts = [
        "📈 LinkedIn: Excited to share our new approach to [specific service] that's helping our clients achieve [specific outcome]. #BusinessGrowth #Innovation",
        "🎯 Facebook: Don't miss our limited-time promotion on [product/service]! Perfect for businesses looking to [benefit]. Contact us to learn more.",
        "✨ Instagram: Behind the scenes at [business name]! Our team hard at work creating solutions that make a difference for our clients. #TeamworkMakesTheDreamWork",
        "💡 Twitter: \"The key to successful [industry] is [quick tip]\". What challenges are you facing in your business? We're here to help!",
        "🚀 LinkedIn: Just published a new case study showing how we helped [anonymous client] increase their [metric] by [percentage]. Check out the full story on our website!"
      ].join("\n\n");
      
      return res.status(200).json({
        success: true,
        data: { posts: fallbackPosts },
        fallback: true
      });
    }
  } catch (error: any) {
    console.error('Social post suggestion failed:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Social post suggestion failed', 
      error: error.message 
    });  
  }  
});

// Marketplace Service Engagement Analytics
// Get marketplace service engagement metrics
marketplaceRouter.get(
  '/service-engagement',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      // Fetch engagement data from storage
      const engagementData = await storage.getMarketplaceServiceEngagement();
      
      return res.status(200).json({
        success: true,
        data: engagementData
      });
    } catch (error) {
      console.error('Error fetching marketplace service engagement data:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve service engagement metrics'
      });
    }
  }
);

// Track service click
marketplaceRouter.post(
  '/track/click/:serviceId',
  async (req: Request, res: Response) => {
    try {
      const serviceId = parseInt(req.params.serviceId, 10);
      
      if (isNaN(serviceId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid service ID'
        });
      }
      
      // Update click count in database
      const success = await storage.trackServiceClick(serviceId);
      
      if (!success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to track service click'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Service click tracked successfully'
      });
    } catch (error) {
      console.error('Error tracking service click:', error);
      return res.status(500).json({
        success: false,
        error: 'Error tracking service click'
      });
    }
  }
);

// Track service inquiry
marketplaceRouter.post(
  '/track/inquiry/:serviceId',
  async (req: Request, res: Response) => {
    try {
      const serviceId = parseInt(req.params.serviceId, 10);
      
      if (isNaN(serviceId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid service ID'
        });
      }
      
      // Update inquiry count in database
      const success = await storage.trackServiceInquiry(serviceId);
      
      if (!success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to track service inquiry'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Service inquiry tracked successfully'
      });
    } catch (error) {
      console.error('Error tracking service inquiry:', error);
      return res.status(500).json({
        success: false,
        error: 'Error tracking service inquiry'
      });
    }
  }
);

/**
 * Suggestion 50: Auto-Suggestions for Marketplace Business Ads
 * Suggest ad content for premium business slots in the marketplace
 */
marketplaceRouter.post('/suggest-ad', 
  validate([
    body('businessName').isString().notEmpty().withMessage('Business name is required'),
    body('businessType').isString().optional(),
    body('targetAudience').isString().optional(),
  ]),
  async (req: Request, res: Response) => {  
    const { businessName, businessType, targetAudience } = req.body;
    
    try {
      // Create a cache key based on input parameters
      const cacheKey = `ad_suggestion_${businessName}_${businessType || 'general'}_${targetAudience || 'all'}`;
      
      // Check cache first
      const cachedSuggestion = adSuggestionCache.get(cacheKey);
      if (cachedSuggestion) {
        return res.status(200).json({
          success: true,
          data: cachedSuggestion,
          cached: true
        });
      }
      
      // Build a more detailed prompt based on available information
      let promptContent = `Suggest a compelling ad for this business: ${businessName}.`;
      
      if (businessType) {
        promptContent += ` The business is in the ${businessType} industry.`;
      }
      
      if (targetAudience) {
        promptContent += ` The target audience is ${targetAudience}.`;
      }
      
      promptContent += ` 
      Return a JSON object with the following structure:
      {
        "headline": "Short, attention-grabbing headline",
        "subheadline": "Supporting text that expands on the headline",
        "body": "Main ad copy (2-3 sentences)",
        "callToAction": "Clear action for the viewer to take",
        "targetKeywords": ["keyword1", "keyword2", "keyword3"],
        "suggestedImageConcept": "Brief description of imagery that would complement this ad",
        "toneAndStyle": "Description of the ad's tone (professional, casual, etc.)"
      }`;
      
      // Make the AI call with a timeout using the Grok API
      try {
        const aiResponse = await Promise.race([
          grokApi.generateJson(
            promptContent,
            "You are an expert marketing copywriter specialized in creating effective digital ads for small businesses."
          ),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('AI ad suggestion timed out')), 15000)
          )
        ]);
        
        // Cache the successful response
        adSuggestionCache.set(cacheKey, aiResponse);
        
        return res.status(200).json({
          success: true,
          data: aiResponse,
          cached: false
        });
      } catch (error) {
        console.error("AI ad suggestion error:", error);
        
        // Fallback: provide basic ad structure if AI call fails
        const fallbackSuggestion = {
          headline: `${businessName} - Quality Service You Can Trust`,
          subheadline: "Serving our customers with excellence since 2010",
          body: `${businessName} offers premium services designed to meet your specific needs. Contact us today to learn how we can help you achieve your goals.`,
          callToAction: "Call now for a free consultation!",
          targetKeywords: ["local business", "quality service", "professional"],
          suggestedImageConcept: "Professional team or service in action",
          toneAndStyle: "Professional and trustworthy"
        };
        
        return res.status(200).json({
          success: true,
          data: fallbackSuggestion,
          fallback: true
        });
      }
    } catch (error) {
      console.error('Ad suggestion failed:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Ad suggestion failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
);

export default marketplaceRouter;