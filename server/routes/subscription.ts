import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { validate } from '../utils/validation';
import { authMiddleware as authenticate, adminMiddleware as authorize } from '../utils/auth';
import { storage } from '../storage';
import { getPublishableKey, createPaymentIntent, createStripeCustomer, createSubscription, getSubscription, cancelSubscription } from '../utils/stripe';
import { insertSubscriptionPlanSchema } from '@shared/schema';
import { z } from 'zod';

const subscriptionRouter = Router();

// Get all subscription plans
subscriptionRouter.get('/plans', async (req: Request, res: Response) => {
  try {
    const plans = await storage.getActiveSubscriptionPlans();
    return res.status(200).json({ 
      success: true, 
      data: plans 
    });
  } catch (error) {
    console.error('Error getting subscription plans:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error retrieving subscription plans' 
    });
  }
});

// Get subscription plan by ID
subscriptionRouter.get('/plans/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const plan = await storage.getSubscriptionPlan(id);
    
    if (!plan) {
      return res.status(404).json({ 
        success: false, 
        error: 'Subscription plan not found' 
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      data: plan 
    });
  } catch (error) {
    console.error('Error getting subscription plan:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error retrieving subscription plan' 
    });
  }
});

// Create a subscription plan (admin only)
subscriptionRouter.post(
  '/plans',
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    // Admin check
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
  },
  [
    body('name').isString().notEmpty(),
    body('description').isString().notEmpty(),
    body('price').isNumeric(),
    body('interval').isIn(['month', 'year']),
    body('features').isArray(),
    body('isActive').isBoolean().optional(),
    validate()
  ],
  async (req: Request, res: Response) => {
    try {
      const planData = insertSubscriptionPlanSchema.parse(req.body);
      
      // In a production environment, we would create the price in Stripe
      // For now, we'll just mock a stripePriceId
      const stripePriceId = `price_${Math.random().toString(36).substring(2, 15)}`;
      
      // Create the plan in our database
      const plan = await storage.createSubscriptionPlan({
        ...planData,
        stripePriceId
      });
      
      return res.status(201).json({ 
        success: true, 
        data: plan 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid subscription plan data', 
          details: error.errors 
        });
      }
      
      console.error('Error creating subscription plan:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Error creating subscription plan' 
      });
    }
  }
);

// Subscribe to a plan
subscriptionRouter.post(
  '/subscribe',
  authenticate,
  [
    body('planId').isNumeric().toInt(),
    validate()
  ],
  async (req: Request, res: Response) => {
    try {
      const { planId } = req.body;
      
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          error: 'User not authenticated' 
        });
      }
      
      const userId = req.user.id;
      
      // Get the plan
      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        return res.status(404).json({ 
          success: false, 
          error: 'Subscription plan not found' 
        });
      }
      
      // Check if user already has an active subscription
      const activeSubscription = await storage.getUserActiveSubscription(userId);
      if (activeSubscription) {
        return res.status(400).json({ 
          success: false, 
          error: 'User already has an active subscription' 
        });
      }
      
      // Get or create Stripe customer
      const user = await storage.getUser(userId);
      
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
        return res.status(500).json({ 
          success: false, 
          error: 'Error creating Stripe customer' 
        });
      }
      
      // Create Stripe subscription
      let stripeSubscription;
      let subscriptionId = '';
      let clientSecret = '';
      
      try {
        stripeSubscription = await createSubscription(
          stripeCustomerId,
          plan.stripePriceId
        );
        
        subscriptionId = stripeSubscription.id;
        clientSecret = stripeSubscription.latest_invoice?.payment_intent?.client_secret || '';
      } catch (error) {
        console.error('Error creating Stripe subscription:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Error creating Stripe subscription' 
        });
      }
      
      // Set time periods
      const currentPeriodStart = Math.floor(new Date().getTime() / 1000); 
      const currentPeriodEnd = Math.floor(new Date().setMonth(new Date().getMonth() + 1) / 1000);
      
      // Create subscription in our database
      try {
        const userSubscription = await storage.createUserSubscription({
          userId,
          planId,
          status: 'active',
          currentPeriodStart: new Date(currentPeriodStart * 1000),
          currentPeriodEnd: new Date(currentPeriodEnd * 1000),
          cancelAtPeriodEnd: false,
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId
        });
        
        return res.status(201).json({ 
          success: true, 
          data: {
            subscription: userSubscription,
            clientSecret
          }
        });
      } catch (dbError) {
        console.error('Error creating subscription in database:', dbError);
        return res.status(500).json({ 
          success: false, 
          error: 'Error recording subscription' 
        });
      }
    } catch (error) {
      console.error('Error subscribing to plan:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Error subscribing to plan' 
      });
    }
  }
);

// Cancel a subscription
subscriptionRouter.post(
  '/cancel',
  authenticate,
  [
    body('subscriptionId').isNumeric().toInt(),
    validate()
  ],
  async (req: Request, res: Response) => {
    try {
      const { subscriptionId } = req.body;
      const userId = req.user.id;
      
      // Get the subscription
      const userSubscriptions = await storage.getUserSubscriptions(userId);
      const subscription = userSubscriptions.find(sub => sub.id === subscriptionId);
      
      if (!subscription) {
        return res.status(404).json({ 
          success: false, 
          error: 'Subscription not found' 
        });
      }
      
      // Cancel in Stripe
      await cancelSubscription(subscription.stripeSubscriptionId);
      
      // Update in our database
      await storage.updateUserSubscription(subscriptionId, {
        status: 'canceled',
        cancelAtPeriodEnd: true
      });
      
      return res.status(200).json({ 
        success: true, 
        message: 'Subscription canceled' 
      });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Error canceling subscription' 
      });
    }
  }
);

// Get user subscriptions
subscriptionRouter.get(
  '/user',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const subscriptions = await storage.getUserSubscriptions(userId);
      
      return res.status(200).json({ 
        success: true, 
        data: subscriptions 
      });
    } catch (error) {
      console.error('Error getting user subscriptions:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Error retrieving user subscriptions' 
      });
    }
  }
);

export default subscriptionRouter;