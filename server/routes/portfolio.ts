import { Router } from 'express';
import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertPortfolioItemSchema, type PortfolioItem } from '@shared/schema';
import { z } from 'zod';

// Extend Express Request to include authentication
interface AuthRequest extends Request {
  isAuthenticated(): boolean;
  user: {
    id: number;
    isAdmin: boolean;
  };
}

export const portfolioRouter = Router();

// Get all portfolio items
portfolioRouter.get('/', async (req: Request, res: Response) => {
  try {
    const items = await storage.getAllPortfolioItems();
    res.json(items);
  } catch (error) {
    console.error('Error fetching portfolio items:', error);
    res.status(500).json({ message: 'Error fetching portfolio items' });
  }
});

// Get featured portfolio items (optionally limited)
portfolioRouter.get('/featured', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const items = await storage.getFeaturedPortfolioItems(limit);
    res.json(items);
  } catch (error) {
    console.error('Error fetching featured portfolio items:', error);
    res.status(500).json({ message: 'Error fetching featured portfolio items' });
  }
});

// Get a specific portfolio item by ID
portfolioRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const item = await storage.getPortfolioItemById(id);
    
    if (!item) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error fetching portfolio item:', error);
    res.status(500).json({ message: 'Error fetching portfolio item' });
  }
});

// Get portfolio items by industry
portfolioRouter.get('/industry/:industry', async (req: Request, res: Response) => {
  try {
    const industry = req.params.industry;
    const items = await storage.getPortfolioItemsByIndustry(industry);
    res.json(items);
  } catch (error) {
    console.error('Error fetching portfolio items by industry:', error);
    res.status(500).json({ message: 'Error fetching portfolio items by industry' });
  }
});

// Create a new portfolio item (admin only)
portfolioRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is authenticated and is an admin
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized - Admin access required' });
    }
    
    // Validate request body
    const validatedData = insertPortfolioItemSchema.parse(req.body);
    
    // Create the portfolio item
    const newItem = await storage.createPortfolioItem(validatedData);
    res.status(201).json(newItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid portfolio data', errors: error.errors });
    }
    
    console.error('Error creating portfolio item:', error);
    res.status(500).json({ message: 'Error creating portfolio item' });
  }
});

// Update an existing portfolio item (admin only)
portfolioRouter.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is authenticated and is an admin
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized - Admin access required' });
    }
    
    const id = parseInt(req.params.id);
    
    // Validate the item exists
    const existingItem = await storage.getPortfolioItemById(id);
    if (!existingItem) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }
    
    // Validate request body
    const validatedData = insertPortfolioItemSchema.partial().parse(req.body);
    
    // Update the portfolio item
    const updatedItem = await storage.updatePortfolioItem(id, validatedData);
    res.json(updatedItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid portfolio data', errors: error.errors });
    }
    
    console.error('Error updating portfolio item:', error);
    res.status(500).json({ message: 'Error updating portfolio item' });
  }
});

// Delete a portfolio item (admin only)
portfolioRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is authenticated and is an admin
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized - Admin access required' });
    }
    
    const id = parseInt(req.params.id);
    
    // Validate the item exists
    const existingItem = await storage.getPortfolioItemById(id);
    if (!existingItem) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }
    
    // Delete the portfolio item
    const success = await storage.deletePortfolioItem(id);
    
    if (success) {
      res.status(204).send();
    } else {
      res.status(500).json({ message: 'Failed to delete portfolio item' });
    }
  } catch (error) {
    console.error('Error deleting portfolio item:', error);
    res.status(500).json({ message: 'Error deleting portfolio item' });
  }
});