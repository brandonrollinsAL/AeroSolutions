import express, { Request, Response, Router } from 'express';
import { body, validationResult } from 'express-validator';
import { generateFriendlyErrorMessage, handleError } from '../utils/errorHandler';
import { storage } from '../storage';
import { db } from '../db';
import { logs } from '@shared/schema';

const router = Router();

// Analyze an error and provide user-friendly message and troubleshooting steps
router.post('/analyze', [
  body('error').isString().notEmpty().withMessage('Error message is required'),
  body('stack').optional().isString(),
  body('context').optional().isString()
], async (req: Request, res: Response) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { error, stack, context } = req.body;
    
    // Create an Error object if only message was provided
    const errorObj = new Error(error);
    if (stack) {
      errorObj.stack = stack;
    }
    
    // Generate user-friendly error message
    const errorDetails = await generateFriendlyErrorMessage(errorObj, context);
    
    // Log the error occurrence
    await db.insert(logs).values({
      level: 'error',
      message: error,
      metadata: JSON.stringify({
        stack,
        context,
        errorDetails,
        userId: req.isAuthenticated() ? req.user.id : null,
        timestamp: new Date().toISOString()
      }),
      timestamp: new Date(),
      userId: req.isAuthenticated() ? req.user.id : null,
      userAgent: req.headers['user-agent'] || ''
    });
    
    res.status(200).json(errorDetails);
  } catch (error) {
    console.error('Error in analyze endpoint:', error);
    res.status(500).json({
      errorCode: 'ERR_INTERNAL',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      userFriendlyMessage: 'We encountered an issue analyzing this error. Our team has been notified.',
      troubleshootingSteps: [
        'Try refreshing the page',
        'Check your internet connection',
        'Try again later'
      ],
      severity: 'medium',
      potentialCauses: ['Internal system error']
    });
  }
});

// Get the most common errors (for admin dashboard)
router.get('/common', async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (!req.isAuthenticated() || req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    // Get date range from query params or use last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    if (req.query.startDate) {
      startDate.setTime(Date.parse(req.query.startDate as string));
    }
    
    if (req.query.endDate) {
      endDate.setTime(Date.parse(req.query.endDate as string));
    }
    
    // Query for log entries
    const errorLogs = await db.query.logs.findMany({
      where: (logs, { and, eq, gte, lte }) => and(
        eq(logs.level, 'error'),
        gte(logs.timestamp, startDate),
        lte(logs.timestamp, endDate)
      ),
      orderBy: (logs, { desc }) => [desc(logs.timestamp)]
    });
    
    // Process logs to find common errors
    const errorCounts: Record<string, { count: number, details: any }> = {};
    
    errorLogs.forEach(log => {
      try {
        const metadata = JSON.parse(log.metadata as string);
        const errorMessage = log.message;
        
        if (!errorCounts[errorMessage]) {
          errorCounts[errorMessage] = {
            count: 0,
            details: metadata.errorDetails || { 
              errorCode: 'ERR_UNKNOWN',
              severity: 'medium'
            }
          };
        }
        
        errorCounts[errorMessage].count++;
      } catch (e) {
        // Skip entries with invalid JSON
        console.error('Invalid JSON in error log metadata:', e);
      }
    });
    
    // Sort errors by count (descending)
    const commonErrors = Object.entries(errorCounts)
      .map(([message, { count, details }]) => ({
        message,
        count,
        details
      }))
      .sort((a, b) => b.count - a.count);
    
    res.status(200).json({
      success: true,
      errors: commonErrors,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching common errors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch common errors',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear error cache (for admin use)
router.post('/clear-cache', async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (!req.isAuthenticated() || req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const { clearErrorCache } = require('../utils/errorHandler');
    clearErrorCache();
    
    res.status(200).json({
      success: true,
      message: 'Error cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing error cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear error cache',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;