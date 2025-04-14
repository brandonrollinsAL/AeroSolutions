import express, { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { 
  getActiveTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
  trackImpression,
  trackConversion,
  generateTestSuggestions
} from '../utils/abTesting';
import { isAdmin } from '../utils/auth';

const router = express.Router();

// Get all active A/B tests
router.get('/active', async (req: Request, res: Response) => {
  try {
    // For public routes, no auth required as active tests need to be loaded by client
    const activeTests = await getActiveTests();
    
    res.status(200).json({
      success: true,
      data: activeTests
    });
  } catch (error) {
    console.error("Error getting active A/B tests:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    res.status(500).json({
      success: false,
      message: "Failed to get active A/B tests",
      error: errorMessage
    });
  }
});

// Get a specific test by ID - admin only
router.get('/:id', async (req: Request, res: Response) => {
  try {
    // Verify admin privileges
    if (!req.isAuthenticated || !req.isAuthenticated() || !isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Administrator access required"
      });
    }
    
    const testId = req.params.id;
    const test = await getTestById(testId);
    
    if (!test) {
      return res.status(404).json({
        success: false,
        message: "A/B test not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: test
    });
  } catch (error) {
    console.error(`Error getting A/B test with ID ${req.params.id}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    res.status(500).json({
      success: false,
      message: "Failed to get A/B test",
      error: errorMessage
    });
  }
});

// Create a new A/B test - admin only
router.post('/', [
  body('name').notEmpty().withMessage('Name is required'),
  body('elementSelector').notEmpty().withMessage('Element selector is required'),
  body('goalType').isIn(['click', 'form_submit', 'page_view', 'custom']).withMessage('Valid goal type is required'),
  body('minSampleSize').isInt({ min: 10 }).withMessage('Minimum sample size must be at least 10'),
  body('confidenceLevel').isFloat({ min: 0.8, max: 0.99 }).withMessage('Confidence level must be between 0.8 and 0.99'),
  body('variants').isArray({ min: 2 }).withMessage('At least 2 variants are required')
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Invalid test data",
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
    
    const newTest = await createTest(req.body);
    
    res.status(201).json({
      success: true,
      message: "A/B test created successfully",
      data: newTest
    });
  } catch (error) {
    console.error("Error creating A/B test:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    res.status(500).json({
      success: false,
      message: "Failed to create A/B test",
      error: errorMessage
    });
  }
});

// Update an existing A/B test - admin only
router.put('/:id', [
  param('id').notEmpty().withMessage('Test ID is required'),
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('status').optional().isIn(['draft', 'running', 'completed', 'stopped']).withMessage('Valid status is required'),
  body('elementSelector').optional().notEmpty().withMessage('Element selector cannot be empty'),
  body('goalType').optional().isIn(['click', 'form_submit', 'page_view', 'custom']).withMessage('Valid goal type is required'),
  body('minSampleSize').optional().isInt({ min: 10 }).withMessage('Minimum sample size must be at least 10'),
  body('confidenceLevel').optional().isFloat({ min: 0.8, max: 0.99 }).withMessage('Confidence level must be between 0.8 and 0.99')
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Invalid test data",
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
    
    const testId = req.params.id;
    const test = await getTestById(testId);
    
    if (!test) {
      return res.status(404).json({
        success: false,
        message: "A/B test not found"
      });
    }
    
    const updatedTest = await updateTest(testId, req.body);
    
    res.status(200).json({
      success: true,
      message: "A/B test updated successfully",
      data: updatedTest
    });
  } catch (error) {
    console.error(`Error updating A/B test with ID ${req.params.id}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    res.status(500).json({
      success: false,
      message: "Failed to update A/B test",
      error: errorMessage
    });
  }
});

// Delete an A/B test - admin only
router.delete('/:id', [
  param('id').notEmpty().withMessage('Test ID is required')
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Invalid test ID",
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
    
    const testId = req.params.id;
    const test = await getTestById(testId);
    
    if (!test) {
      return res.status(404).json({
        success: false,
        message: "A/B test not found"
      });
    }
    
    await deleteTest(testId);
    
    res.status(200).json({
      success: true,
      message: "A/B test deleted successfully"
    });
  } catch (error) {
    console.error(`Error deleting A/B test with ID ${req.params.id}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    res.status(500).json({
      success: false,
      message: "Failed to delete A/B test",
      error: errorMessage
    });
  }
});

// Track an impression for a variant
router.post('/track/impression', [
  body('testId').notEmpty().withMessage('Test ID is required'),
  body('variantId').notEmpty().withMessage('Variant ID is required')
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Invalid tracking data",
        errors: errors.array()
      });
    }
    
    const { testId, variantId } = req.body;
    await trackImpression(testId, variantId);
    
    res.status(200).json({
      success: true,
      message: "Impression tracked successfully"
    });
  } catch (error) {
    console.error("Error tracking impression:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    res.status(500).json({
      success: false,
      message: "Failed to track impression",
      error: errorMessage
    });
  }
});

// Track a conversion for a variant
router.post('/track/conversion', [
  body('testId').notEmpty().withMessage('Test ID is required'),
  body('variantId').notEmpty().withMessage('Variant ID is required')
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Invalid tracking data",
        errors: errors.array()
      });
    }
    
    const { testId, variantId } = req.body;
    await trackConversion(testId, variantId);
    
    res.status(200).json({
      success: true,
      message: "Conversion tracked successfully"
    });
  } catch (error) {
    console.error("Error tracking conversion:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    res.status(500).json({
      success: false,
      message: "Failed to track conversion",
      error: errorMessage
    });
  }
});

// Generate A/B test suggestions for an element - admin only
router.post('/suggestions', [
  body('elementSelector').notEmpty().withMessage('Element selector is required'),
  body('elementType').notEmpty().withMessage('Element type is required (e.g., button, heading, form)')
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data",
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
    
    const { elementSelector, elementType, currentContent } = req.body;
    const suggestions = await generateTestSuggestions(elementSelector, elementType, currentContent);
    
    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error("Error generating A/B test suggestions:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    res.status(500).json({
      success: false,
      message: "Failed to generate A/B test suggestions",
      error: errorMessage
    });
  }
});

export default router;