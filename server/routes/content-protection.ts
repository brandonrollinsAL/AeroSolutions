import express, { Request, Response } from 'express';
import { validateRequest } from '../utils/validation';
import { watermarkText, detectWatermark } from '../utils/watermarkText';
import { z } from 'zod';

// Create content protection router
const contentProtectionRouter = express.Router();

/**
 * Endpoint to watermark text content
 * POST /api/content/watermark
 */
contentProtectionRouter.post(
  '/watermark',
  validateRequest(z.object({
    content: z.string().min(1, 'Content is required'),
    contentId: z.string().or(z.number()).optional(),
    contentType: z.string().min(1, 'Content type is required'),
    customBrand: z.string().optional()
  })),
  async (req: Request, res: Response) => {
    try {
      const { content, contentId, contentType, customBrand } = req.body;
      
      // Apply XAI watermarking to the content
      const watermarkedContent = await watermarkText(content, customBrand || 'Elevion');
      
      return res.status(200).json({
        success: true,
        watermarkedContent,
        contentId,
        contentType
      });
    } catch (error) {
      console.error('Error watermarking content:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to watermark content'
      });
    }
  }
);

/**
 * Endpoint to detect if content has been watermarked
 * POST /api/content/detect-watermark
 */
contentProtectionRouter.post(
  '/detect-watermark',
  validateRequest(z.object({
    content: z.string().min(1, 'Content is required'),
    customBrand: z.string().optional()
  })),
  async (req: Request, res: Response) => {
    try {
      const { content, customBrand } = req.body;
      
      // Detect watermarking in content
      const detection = await detectWatermark(content, customBrand || 'Elevion');
      
      return res.status(200).json({
        success: true,
        detection
      });
    } catch (error) {
      console.error('Error detecting watermark:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to detect watermark'
      });
    }
  }
);

export default contentProtectionRouter;