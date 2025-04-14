import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { analyzeSentiment, processPendingFeedbackSentiment, getSentimentTrends } from '../utils/sentimentAnalysis';
import { isAdmin } from '../utils/auth';

const router = express.Router();

// Analyze sentiment for provided text
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
        message: "Invalid input",
        errors: errors.array()
      });
    }

    const { text } = req.body;
    
    // Analyze the text
    const sentiment = await analyzeSentiment(text);
    
    res.status(200).json({
      success: true,
      data: sentiment
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

// Process pending feedback sentiment - admin only
router.post('/process-feedback', async (req: Request, res: Response) => {
  try {
    // Verify admin privileges
    if (!req.isAuthenticated || !req.isAuthenticated() || !isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Administrator access required"
      });
    }
    
    // Get limit from request, default to 50
    const limit = req.body.limit ? parseInt(req.body.limit, 10) : 50;
    
    // Process pending feedback
    const processed = await processPendingFeedbackSentiment(limit);
    
    res.status(200).json({
      success: true,
      message: `Processed sentiment for ${processed} feedback items`,
      processedCount: processed
    });
  } catch (error) {
    console.error("Error processing sentiment:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    res.status(500).json({
      success: false,
      message: "Failed to process sentiment",
      error: errorMessage
    });
  }
});

// Get sentiment trends for dashboard - admin only
router.get('/trends', async (req: Request, res: Response) => {
  try {
    // Verify admin privileges
    if (!req.isAuthenticated || !req.isAuthenticated() || !isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Administrator access required"
      });
    }
    
    // Get days parameter, default to 30
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
    
    // Get sentiment trends
    const trends = await getSentimentTrends(days);
    
    res.status(200).json({
      success: true,
      data: trends
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

export default router;