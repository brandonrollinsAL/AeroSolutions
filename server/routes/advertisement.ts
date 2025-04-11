import { Router, Request, Response } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../utils/validation';
import { authenticate, authorize } from '../utils/auth';
import { storage } from '../storage';
import { insertAdvertisementSchema } from '@shared/schema';
import { z } from 'zod';

const advertisementRouter = Router();

// Get active advertisements
advertisementRouter.get('/', async (req: Request, res: Response) => {
  try {
    const ads = await storage.getActiveAdvertisements();
    return res.status(200).json({ 
      success: true, 
      data: ads 
    });
  } catch (error) {
    console.error('Error getting active advertisements:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error retrieving advertisements' 
    });
  }
});

// Get active advertisements by type
advertisementRouter.get('/type/:type', async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const ads = await storage.getActiveAdvertisementsByType(type);
    
    return res.status(200).json({ 
      success: true, 
      data: ads 
    });
  } catch (error) {
    console.error('Error getting advertisements by type:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error retrieving advertisements' 
    });
  }
});

// Get advertisement by ID
advertisementRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const ad = await storage.getAdvertisement(id);
    
    if (!ad) {
      return res.status(404).json({ 
        success: false, 
        error: 'Advertisement not found' 
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      data: ad 
    });
  } catch (error) {
    console.error('Error getting advertisement:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error retrieving advertisement' 
    });
  }
});

// Create an advertisement (admin only)
advertisementRouter.post(
  '/',
  authenticate,
  authorize(['admin']),
  validate([
    body('name').isString().notEmpty(),
    body('type').isString().notEmpty(),
    body('imageUrl').isString().notEmpty(),
    body('targetUrl').isString().notEmpty(),
    body('startDate').isISO8601().toDate(),
    body('endDate').isISO8601().toDate(),
    body('isActive').isBoolean().optional(),
    body('position').isString().optional(),
  ]),
  async (req: Request, res: Response) => {
    try {
      const adData = insertAdvertisementSchema.parse(req.body);
      
      // Create the advertisement in our database
      const ad = await storage.createAdvertisement(adData);
      
      return res.status(201).json({ 
        success: true, 
        data: ad 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid advertisement data', 
          details: error.errors 
        });
      }
      
      console.error('Error creating advertisement:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Error creating advertisement' 
      });
    }
  }
);

// Update an advertisement (admin only)
advertisementRouter.patch(
  '/:id',
  authenticate,
  authorize(['admin']),
  validate([
    param('id').isNumeric().toInt(),
    body('name').isString().notEmpty().optional(),
    body('type').isString().notEmpty().optional(),
    body('imageUrl').isString().notEmpty().optional(),
    body('targetUrl').isString().notEmpty().optional(),
    body('startDate').isISO8601().toDate().optional(),
    body('endDate').isISO8601().toDate().optional(),
    body('isActive').isBoolean().optional(),
    body('position').isString().optional(),
  ]),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      
      // Get the advertisement
      const ad = await storage.getAdvertisement(id);
      if (!ad) {
        return res.status(404).json({ 
          success: false, 
          error: 'Advertisement not found' 
        });
      }
      
      // Update the advertisement in our database
      const updatedAd = await storage.updateAdvertisement(id, req.body);
      
      return res.status(200).json({ 
        success: true, 
        data: updatedAd 
      });
    } catch (error) {
      console.error('Error updating advertisement:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Error updating advertisement' 
      });
    }
  }
);

// Record ad impression
advertisementRouter.post(
  '/impression/:id',
  validate([
    param('id').isNumeric().toInt(),
  ]),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      
      // Get the advertisement
      const ad = await storage.getAdvertisement(id);
      if (!ad) {
        return res.status(404).json({ 
          success: false, 
          error: 'Advertisement not found' 
        });
      }
      
      // Increment impressions
      await storage.incrementAdImpressions(id);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Impression recorded' 
      });
    } catch (error) {
      console.error('Error recording ad impression:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Error recording impression' 
      });
    }
  }
);

// Record ad click
advertisementRouter.post(
  '/click/:id',
  validate([
    param('id').isNumeric().toInt(),
  ]),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      
      // Get the advertisement
      const ad = await storage.getAdvertisement(id);
      if (!ad) {
        return res.status(404).json({ 
          success: false, 
          error: 'Advertisement not found' 
        });
      }
      
      // Increment clicks
      await storage.incrementAdClicks(id);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Click recorded',
        redirectUrl: ad.targetUrl
      });
    } catch (error) {
      console.error('Error recording ad click:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Error recording click' 
      });
    }
  }
);

export default advertisementRouter;