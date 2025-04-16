import express, { Router, Request, Response } from 'express';
import { storage } from '../storage';

const portfolioRouter = Router();

// Get all portfolio items
portfolioRouter.get('/', async (req: Request, res: Response) => {
  try {
    const portfolioItems = await storage.getAllPortfolioItems();
    return res.status(200).json({ portfolioItems });
  } catch (error) {
    console.error('Error fetching portfolio items:', error);
    return res.status(500).json({ error: 'Failed to fetch portfolio items' });
  }
});

// Get featured portfolio items
portfolioRouter.get('/featured', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const portfolioItems = await storage.getFeaturedPortfolioItems(limit);
    return res.status(200).json({ portfolioItems });
  } catch (error) {
    console.error('Error fetching featured portfolio items:', error);
    return res.status(500).json({ error: 'Failed to fetch featured portfolio items' });
  }
});

// Get portfolio item by ID
portfolioRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid portfolio item ID' });
    }
    
    const portfolioItem = await storage.getPortfolioItemById(id);
    if (!portfolioItem) {
      return res.status(404).json({ error: 'Portfolio item not found' });
    }
    
    return res.status(200).json({ portfolioItem });
  } catch (error) {
    console.error('Error fetching portfolio item:', error);
    return res.status(500).json({ error: 'Failed to fetch portfolio item' });
  }
});

// Get portfolio items by industry
portfolioRouter.get('/industry/:industry', async (req: Request, res: Response) => {
  try {
    const industry = req.params.industry;
    const portfolioItems = await storage.getPortfolioItemsByIndustry(industry);
    return res.status(200).json({ portfolioItems });
  } catch (error) {
    console.error('Error fetching portfolio items by industry:', error);
    return res.status(500).json({ error: 'Failed to fetch portfolio items by industry' });
  }
});

export default portfolioRouter;