import express, { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { 
  ABTest, 
  createABTest, 
  getABTest, 
  getActiveABTests, 
  getAllABTests,
  recordImpression, 
  recordConversion,
  updateABTest,
  analyzeTestResults,
  generateABTestVariants
} from '../utils/abTesting';
import { isAdmin } from '../utils/auth';

const router = express.Router();

// Get all A/B tests - admin only
router.get('/tests', async (req: Request, res: Response) => {
  try {
    // Verify admin privileges
    if (!req.isAuthenticated || !req.isAuthenticated() || !isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Administrator access required"
      });
    }
    
    const tests = getAllABTests();
    
    res.status(200).json({
      success: true,
      data: tests
    });
  } catch (error) {
    console.error("Error getting A/B tests:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    res.status(500).json({
      success: false,
      message: "Failed to get A/B tests",
      error: errorMessage
    });
  }
});

// Get a specific A/B test by ID - admin only
router.get('/tests/:id', [
  param('id').isString().withMessage('Test ID must be a valid string')
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
    
    const { id } = req.params;
    const test = getABTest(id);
    
    if (!test) {
      return res.status(404).json({
        success: false,
        message: `A/B test with ID ${id} not found`
      });
    }
    
    res.status(200).json({
      success: true,
      data: test
    });
  } catch (error) {
    console.error("Error getting A/B test:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    res.status(500).json({
      success: false,
      message: "Failed to get A/B test",
      error: errorMessage
    });
  }
});

// Create a new A/B test - admin only
router.post('/tests', [
  body('name').isString().notEmpty().withMessage('Test name is required'),
  body('elementSelector').isString().notEmpty().withMessage('Element selector is required'),
  body('goalType').isIn(['click', 'form_submit', 'page_view', 'custom']).withMessage('Invalid goal type'),
  body('minSampleSize').isInt({ min: 100 }).withMessage('Min sample size must be at least 100'),
  body('confidenceLevel').isFloat({ min: 0.8, max: 0.99 }).withMessage('Confidence level must be between 0.8 and 0.99'),
  body('variants').isArray({ min: 2 }).withMessage('At least 2 variants are required'),
  body('variants.*.id').isString().notEmpty().withMessage('Variant ID is required'),
  body('variants.*.name').isString().notEmpty().withMessage('Variant name is required'),
  body('variants.*.changes').isObject().withMessage('Variant changes must be an object')
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Invalid A/B test data",
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
    
    const testData = {
      ...req.body,
      status: 'draft',
      startDate: new Date()
    } as Omit<ABTest, 'id' | 'createdAt' | 'updatedAt'>;
    
    const test = await createABTest(testData);
    
    res.status(201).json({
      success: true,
      data: test,
      message: "A/B test created successfully"
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

// Update A/B test status - admin only
router.patch('/tests/:id/status', [
  param('id').isString().withMessage('Test ID must be a valid string'),
  body('status').isIn(['draft', 'running', 'completed', 'stopped']).withMessage('Invalid test status')
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
    
    const { id } = req.params;
    const { status } = req.body;
    
    // Additional logic for specific status changes
    const updates: Partial<ABTest> = { status };
    
    if (status === 'running') {
      updates.startDate = new Date();
    } else if (status === 'completed' || status === 'stopped') {
      updates.endDate = new Date();
    }
    
    const updatedTest = updateABTest(id, updates);
    
    if (!updatedTest) {
      return res.status(404).json({
        success: false,
        message: `A/B test with ID ${id} not found`
      });
    }
    
    res.status(200).json({
      success: true,
      data: updatedTest,
      message: `A/B test status updated to ${status}`
    });
  } catch (error) {
    console.error("Error updating A/B test status:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    res.status(500).json({
      success: false,
      message: "Failed to update A/B test status",
      error: errorMessage
    });
  }
});

// Record impression for a variant
router.post('/tests/:testId/variants/:variantId/impression', [
  param('testId').isString().withMessage('Test ID must be a valid string'),
  param('variantId').isString().withMessage('Variant ID must be a valid string')
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
    
    const { testId, variantId } = req.params;
    const success = recordImpression(testId, variantId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: "Test or variant not found"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Impression recorded"
    });
  } catch (error) {
    console.error("Error recording impression:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    res.status(500).json({
      success: false,
      message: "Failed to record impression",
      error: errorMessage
    });
  }
});

// Record conversion for a variant
router.post('/tests/:testId/variants/:variantId/conversion', [
  param('testId').isString().withMessage('Test ID must be a valid string'),
  param('variantId').isString().withMessage('Variant ID must be a valid string')
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
    
    const { testId, variantId } = req.params;
    const success = recordConversion(testId, variantId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: "Test or variant not found"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Conversion recorded"
    });
  } catch (error) {
    console.error("Error recording conversion:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    res.status(500).json({
      success: false,
      message: "Failed to record conversion",
      error: errorMessage
    });
  }
});

// Analyze test results - admin only
router.post('/tests/:id/analyze', [
  param('id').isString().withMessage('Test ID must be a valid string')
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
    
    const { id } = req.params;
    const analyzedTest = await analyzeTestResults(id);
    
    if (!analyzedTest) {
      return res.status(404).json({
        success: false,
        message: `A/B test with ID ${id} not found`
      });
    }
    
    res.status(200).json({
      success: true,
      data: analyzedTest,
      message: "A/B test analysis completed"
    });
  } catch (error) {
    console.error("Error analyzing A/B test:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    res.status(500).json({
      success: false,
      message: "Failed to analyze A/B test",
      error: errorMessage
    });
  }
});

// Generate A/B test variant ideas - admin only
router.post('/generate-variants', [
  body('elementType').isString().notEmpty().withMessage('Element type is required'),
  body('goalDescription').isString().notEmpty().withMessage('Goal description is required'),
  body('currentVersion').isString().notEmpty().withMessage('Current version is required')
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
    
    const { elementType, goalDescription, currentVersion } = req.body;
    
    const variantSuggestions = await generateABTestVariants(
      elementType,
      goalDescription,
      currentVersion
    );
    
    res.status(200).json({
      success: true,
      data: variantSuggestions
    });
  } catch (error) {
    console.error("Error generating A/B test variants:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    res.status(500).json({
      success: false,
      message: "Failed to generate A/B test variants",
      error: errorMessage
    });
  }
});

// Get active tests for client
router.get('/active', async (req: Request, res: Response) => {
  try {
    // Get all active tests
    const tests = getActiveABTests();
    
    // Return only necessary data to the client (not all test details)
    const clientTests = tests.map(test => ({
      id: test.id,
      elementSelector: test.elementSelector,
      goalType: test.goalType,
      goalSelector: test.goalSelector,
      variants: test.variants.map(variant => ({
        id: variant.id,
        changes: variant.changes
      }))
    }));
    
    res.status(200).json({
      success: true,
      data: clientTests
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

export default router;