import express, { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { 
  analyzeSentiment,
  getSentimentStats,
  getFeedbackSentimentTrends as getSentimentTrends,
  getFeedbackSentimentBySource as getSentimentBySource
} from '../utils/sentimentAnalysis';
import { isAdmin } from '../utils/auth';

const router = express.Router();

// Analyze sentiment from text
router.post('/analyze', [
  body('text')
    .notEmpty().withMessage('Text is required')
    .isString().withMessage('Text must be a string')
    .isLength({ min: 5, max: 5000 }).withMessage('Text must be between 5 and 5000 characters')
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: errors.array()
      });
    }
    
    const { text } = req.body;
    const result = await analyzeSentiment(text);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    res.status(500).json({
      success: false,
      message: "Failed to analyze sentiment",
      error: errorMessage
    });
  }
});

// Get sentiment statistics - admin only
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Verify admin privileges
    if (!req.isAuthenticated || !req.isAuthenticated() || !isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Administrator access required"
      });
    }
    
    const timeRange = req.query.timeRange as string || 'week';
    const result = await getSentimentStats(timeRange);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Error getting sentiment stats:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    res.status(500).json({
      success: false,
      message: "Failed to get sentiment statistics",
      error: errorMessage
    });
  }
});

// Get sentiment trends - admin only
router.get('/trends', [
  query('startDate').optional().isDate().withMessage('Start date must be a valid date'),
  query('endDate').optional().isDate().withMessage('End date must be a valid date')
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Invalid parameters",
        errors: errors.array()
      });
    }
    
    // Verify admin privileges
    if (!req.isAuthenticated || !req.isAuthenticated() || !isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Administrator access required"
      });
    }
    
    const startDate = req.query.startDate as string || undefined;
    const endDate = req.query.endDate as string || undefined;
    
    const result = await getSentimentTrends(startDate, endDate);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Error getting sentiment trends:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    res.status(500).json({
      success: false,
      message: "Failed to get sentiment trends",
      error: errorMessage
    });
  }
});

// Get sentiment by source - admin only
router.get('/by-source', async (req: Request, res: Response) => {
  try {
    // Verify admin privileges
    if (!req.isAuthenticated || !req.isAuthenticated() || !isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Administrator access required"
      });
    }
    
    const timeRange = req.query.timeRange as string || 'month';
    const result = await getSentimentBySource(timeRange);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Error getting sentiment by source:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    res.status(500).json({
      success: false,
      message: "Failed to get sentiment by source",
      error: errorMessage
    });
  }
});

export default router;