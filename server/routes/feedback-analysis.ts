/**
 * Feedback Analysis Route
 * 
 * This module provides routes for AI-powered feedback analysis using xAI integration.
 * It allows for sentiment analysis, thematic categorization, and actionable insights
 * from user feedback.
 */

import express, { Request, Response } from 'express';
import NodeCache from 'node-cache';
import { getGrokCompletion } from '../utils/xaiClient';
import { storage } from '../storage';
import { z } from 'zod';

// Router instance
const router = express.Router();

// Cache for feedback analysis results (TTL: 1 hour)
const analysisCache = new NodeCache({ stdTTL: 3600 });

/**
 * Submit new feedback
 * POST /api/feedback
 * 
 * Allows users to submit feedback about the platform
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // Validate feedback data
    const validatedData = FeedbackSubmissionSchema.parse(req.body);
    
    // Get the user ID if authenticated
    const userId = req.isAuthenticated?.() ? req.user?.id : null;
    
    // Create feedback entry
    const feedback = await storage.createFeedback({
      ...validatedData,
      userId,
      status: 'new',
    });
    
    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback
    });
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Invalid feedback data',
        details: error.errors
      });
    }
    
    return res.status(500).json({
      error: error.message || 'Failed to submit feedback',
      suggestion: 'Please try again later'
    });
  }
});

// Feedback submission schema
const FeedbackSubmissionSchema = z.object({
  message: z.string().min(10, { message: 'Feedback must be at least 10 characters long' }).max(5000),
  source: z.string().default('website'),
  category: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
});

// Feedback analysis schema
const FeedbackAnalysisSchema = z.object({
  feedbackId: z.number().optional(),
  text: z.string().min(3).max(5000),
});

/**
 * Analyze feedback content
 * POST /api/analyze-feedback
 * 
 * Analyzes feedback using xAI to provide:
 * - Sentiment breakdown (positive/negative/neutral)
 * - Key themes and topics
 * - Pain points and concerns
 * - Actionable recommendations
 * - Priority areas
 */
router.post('/analyze-feedback', async (req: Request, res: Response) => {
  try {
    // Validate request data
    const validatedData = FeedbackAnalysisSchema.parse(req.body);
    const { feedbackId, text } = validatedData;

    // Check cache first if feedbackId is provided
    const cacheKey = feedbackId ? `feedback_analysis_${feedbackId}` : `feedback_text_${text.substring(0, 50)}`;
    const cachedAnalysis = analysisCache.get(cacheKey);
    
    if (cachedAnalysis) {
      console.log('Returning cached feedback analysis');
      return res.json(cachedAnalysis);
    }
    
    // If feedbackId is provided, get the feedback from storage
    let feedbackText = text;
    if (feedbackId) {
      const feedback = await storage.getFeedback(feedbackId);
      if (!feedback) {
        return res.status(404).json({ error: 'Feedback not found' });
      }
      feedbackText = feedback.message;
    }

    const prompt = `
You are an expert feedback analyst working for Elevion, a web development company. 
Analyze the following customer feedback in depth and provide a comprehensive analysis in JSON format.

Customer Feedback:
"""
${feedbackText}
"""

Analyze this feedback and provide a structured JSON response with the following:

1. sentiment: A detailed sentiment analysis with percentages (positive, negative, neutral)
2. key_themes: Main topics and themes in the feedback (minimum 2, maximum 5)
3. pain_points: Any concerns, frustrations or issues mentioned (if applicable)
4. recommendations: Specific actionable steps to address this feedback (minimum 2 if negative feedback)
5. priority: A priority level for addressing this feedback (low, medium, high, critical)
6. summary: A concise summary of the overall feedback in 1-2 sentences

Respond with valid JSON only.
`;

    // Extended timeout (30s) for deeper analysis
    const analysisResult = await getGrokCompletion(prompt, {
      model: 'grok-3-mini',
      temperature: 0.2,
      responseFormat: 'json_object',
      timeout: 30000,
      maxTokens: 1000
    });

    // Parse the JSON response
    const analysisData = JSON.parse(analysisResult);

    // Store in cache
    analysisCache.set(cacheKey, analysisData);

    // If this is for a specific feedback ID, update the status
    if (feedbackId) {
      await storage.updateFeedbackStatus(feedbackId, 'analyzed');
    }

    return res.json(analysisData);
  } catch (error: any) {
    console.error('Error analyzing feedback:', error);
    
    // Provide a helpful error message
    const errorMessage = error.message || 'An error occurred during feedback analysis';
    return res.status(500).json({ 
      error: errorMessage,
      suggestion: 'Please try again with more specific feedback or contact support.'
    });
  }
});

/**
 * Analyzes multiple feedback items to generate aggregate insights
 * POST /api/analyze-feedback-trends
 */
router.post('/analyze-feedback-trends', async (req: Request, res: Response) => {
  try {
    // Validate request
    const { status, limit = 20 } = req.body;
    
    // Get feedback items from database
    const feedbackItems = await storage.getAllFeedback(limit, status);
    
    if (!feedbackItems || feedbackItems.length === 0) {
      return res.status(404).json({ error: 'No feedback found matching the criteria' });
    }
    
    // Combine all feedback content
    const combinedFeedback = feedbackItems.map(item => 
      `Feedback ${item.id} (${new Date(item.createdAt).toLocaleDateString()}): ${item.message}`
    ).join('\n\n');

    const prompt = `
You are a data analyst for Elevion, a web development company. 
Analyze the following collection of customer feedback items and identify patterns, trends, and actionable insights.

Feedback Collection:
"""
${combinedFeedback}
"""

Provide a comprehensive analysis in JSON format including:

1. overall_sentiment: An assessment of the overall sentiment across all feedback
2. trending_themes: The most frequently mentioned themes or topics
3. recurring_issues: Common problems or pain points that appear multiple times
4. improvement_opportunities: Specific areas where the company could improve
5. positive_highlights: Things customers are consistently happy with
6. recommendations: Prioritized list of actions the company should take
7. summary: A concise executive summary of the feedback trends

Respond with valid JSON only.
`;

    // Get analysis from Grok
    const trendsAnalysis = await getGrokCompletion(prompt, {
      model: 'grok-3-mini',
      temperature: 0.3,
      responseFormat: 'json_object',
      timeout: 45000,
      maxTokens: 1500
    });

    // Parse and return
    const analysisData = JSON.parse(trendsAnalysis);
    return res.json(analysisData);
    
  } catch (error: any) {
    console.error('Error analyzing feedback trends:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to analyze feedback trends',
      suggestion: 'Try again with fewer feedback items or a more specific status filter.'
    });
  }
});

export default router;