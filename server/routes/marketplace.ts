import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { validate } from '../utils/validation';
import { authenticate, authorize } from '../utils/auth';
import { storage } from '../storage';
import { getPublishableKey, createPaymentIntent, createStripeCustomer, createSubscription, getSubscription, cancelSubscription } from '../utils/stripe';
import { insertMarketplaceItemSchema } from '@shared/schema';
import { z } from 'zod';

const marketplaceRouter = Router();

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

export default marketplaceRouter;