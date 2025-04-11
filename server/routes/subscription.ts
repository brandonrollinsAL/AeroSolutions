import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { validate } from '../utils/validation';
import { authenticate, authorize } from '../utils/auth';
import { storage } from '../storage';
import { stripeService } from '../utils/stripe';
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
  authorize(['admin']),
  validate([
    body('name').isString().notEmpty(),
    body('description').isString().notEmpty(),
    body('price').isNumeric(),
    body('interval').isIn(['month', 'year']),
    body('features').isArray(),
    body('isActive').isBoolean().optional(),
  ]),
  async (req: Request, res: Response) => {
    try {
      const planData = insertSubscriptionPlanSchema.parse(req.body);
      
      // Create the plan in Stripe
      const { stripePriceId } = await stripeService.createPlan(planData);
      
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
  validate([
    body('planId').isNumeric().toInt(),
  ]),
  async (req: Request, res: Response) => {
    try {
      const { planId } = req.body;
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
      const email = user.username; // In a real app, you'd have an email field
      let stripeCustomerId = 'cus_' + Math.random().toString(36).substring(2, 15); // Mock customer ID
      
      try {
        stripeCustomerId = await stripeService.createCustomer(user.username, email);
      } catch (error) {
        console.error('Error creating Stripe customer:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Error creating Stripe customer' 
        });
      }
      
      // Create Stripe subscription
      const { 
        subscriptionId,
        clientSecret,
        currentPeriodStart,
        currentPeriodEnd
      } = await stripeService.createSubscription(
        stripeCustomerId,
        plan.stripePriceId
      );
      
      // Create subscription in our database
      const subscription = await storage.createUserSubscription({
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
          subscription,
          clientSecret
        }
      });
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
  validate([
    body('subscriptionId').isNumeric().toInt(),
  ]),
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
      await stripeService.cancelSubscription(subscription.stripeSubscriptionId);
      
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