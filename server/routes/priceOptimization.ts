import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { priceOptimizationService } from '../utils/priceOptimizationService';
import { z } from 'zod';

const router = Router();

// Get all subscription plans
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const plans = await storage.getActiveSubscriptionPlans();
    res.json(plans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
});

// Get price recommendations
router.get('/recommendations', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const status = req.query.status as string | undefined;
    const recommendations = await storage.getPriceRecommendations(status);
    res.json(recommendations);
  } catch (error) {
    console.error('Error fetching price recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch price recommendations' });
  }
});

// Get price recommendation by ID
router.get('/recommendations/:id', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const id = parseInt(req.params.id);
    const recommendation = await storage.getPriceRecommendation(id);
    
    if (!recommendation) {
      return res.status(404).json({ error: 'Price recommendation not found' });
    }
    
    res.json(recommendation);
  } catch (error) {
    console.error('Error fetching price recommendation:', error);
    res.status(500).json({ error: 'Failed to fetch price recommendation' });
  }
});

// Generate a new price recommendation
router.post('/recommendations/generate', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const schema = z.object({
      planId: z.number()
    });
    
    const { planId } = schema.parse(req.body);
    
    // Generate recommendation
    const recommendation = await priceOptimizationService.generatePriceRecommendation(planId);
    
    if (!recommendation) {
      return res.status(500).json({ error: 'Failed to generate price recommendation' });
    }
    
    res.status(201).json(recommendation);
  } catch (error) {
    console.error('Error generating price recommendation:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to generate price recommendation' });
  }
});

// Update recommendation status (approve/reject)
router.patch('/recommendations/:id/status', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const schema = z.object({
      status: z.enum(['pending', 'approved', 'rejected']),
      reviewNotes: z.string().optional()
    });
    
    const id = parseInt(req.params.id);
    const { status, reviewNotes } = schema.parse(req.body);
    
    // Get the recommendation
    const recommendation = await storage.getPriceRecommendation(id);
    if (!recommendation) {
      return res.status(404).json({ error: 'Price recommendation not found' });
    }
    
    // Update the recommendation
    const updatedRecommendation = await storage.updatePriceRecommendation(id, {
      status,
      reviewedAt: new Date(),
      reviewedByUserId: req.user?.id,
      reviewNotes
    });
    
    res.json(updatedRecommendation);
  } catch (error) {
    console.error('Error updating recommendation status:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to update recommendation status' });
  }
});

// Apply a price recommendation
router.post('/recommendations/:id/apply', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const id = parseInt(req.params.id);
    
    // Check that the recommendation exists and is approved
    const recommendation = await storage.getPriceRecommendation(id);
    if (!recommendation) {
      return res.status(404).json({ error: 'Price recommendation not found' });
    }
    
    if (recommendation.status !== 'approved') {
      return res.status(400).json({ error: 'Recommendation must be approved before it can be applied' });
    }
    
    // Apply the recommendation
    const success = await priceOptimizationService.applyPriceRecommendation(id, req.user.id);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to apply price recommendation' });
    }
    
    res.json({ success: true, message: 'Price recommendation applied successfully' });
  } catch (error) {
    console.error('Error applying price recommendation:', error);
    res.status(500).json({ error: 'Failed to apply price recommendation' });
  }
});

// Get price history for a subscription plan
router.get('/plans/:id/history', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const planId = parseInt(req.params.id);
    
    // Check that the plan exists
    const plan = await storage.getSubscriptionPlan(planId);
    if (!plan) {
      return res.status(404).json({ error: 'Subscription plan not found' });
    }
    
    // Get price history
    const history = await storage.getPriceHistory(planId);
    
    res.json(history);
  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
});

// Schedule automatic price analysis for all plans
router.post('/analyze-all', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Start the analysis process
    await priceOptimizationService.scheduleAutomaticPriceAnalysis();
    
    res.json({ 
      success: true, 
      message: 'Price analysis scheduled for all active subscription plans' 
    });
  } catch (error) {
    console.error('Error scheduling price analysis:', error);
    res.status(500).json({ error: 'Failed to schedule price analysis' });
  }
});

export default router;