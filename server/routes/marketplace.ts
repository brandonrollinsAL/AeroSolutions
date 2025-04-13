import { Router, Request, Response } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../utils/validation';
import { authenticate, authorize } from '../utils/auth';
import { storage } from '../storage';
import { getPublishableKey, createPaymentIntent, createStripeCustomer, createSubscription, getSubscription, cancelSubscription } from '../utils/stripe';
import { insertMarketplaceItemSchema } from '@shared/schema';
import { z } from 'zod';
import { grokApi } from '../grok';
import { db } from '../db';
import NodeCache from 'node-cache';

const marketplaceRouter = Router();

// Create a cache for recommendations to avoid unnecessary AI calls
const recommendationCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

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

export default marketplaceRouter;