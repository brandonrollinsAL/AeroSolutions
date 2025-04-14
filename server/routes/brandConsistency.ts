import express from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { monitorBrandConsistency } from '../utils/brandConsistencyService';

const router = express.Router();

// Define a common response wrapper
const wrapResponse = <T>(success: boolean, message: string, data?: T) => {
  return {
    success,
    message,
    data
  };
};

// Get all brand consistency issues with optional filtering
router.get('/issues', async (req: express.Request, res: express.Response) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json(wrapResponse(false, 'Unauthorized'));
    }

    const { status } = req.query;
    const brandIssues = await storage.getBrandConsistencyIssues(status as string);
    
    return res.json(wrapResponse(true, 'Brand consistency issues retrieved successfully', brandIssues));
  } catch (error: any) {
    console.error('Error fetching brand consistency issues:', error);
    return res.status(500).json(wrapResponse(false, `Error fetching brand consistency issues: ${error.message}`));
  }
});

// Get a specific brand consistency issue by ID
router.get('/issues/:id', async (req: express.Request<{ id: string }>, res: express.Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json(wrapResponse(false, 'Unauthorized'));
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json(wrapResponse(false, 'Invalid issue ID'));
    }

    const issue = await storage.getBrandConsistencyIssue(id);
    if (!issue) {
      return res.status(404).json(wrapResponse(false, 'Brand consistency issue not found'));
    }

    return res.json(wrapResponse(true, 'Brand consistency issue retrieved successfully', issue));
  } catch (error: any) {
    console.error('Error fetching brand consistency issue:', error);
    return res.status(500).json(wrapResponse(false, `Error fetching brand consistency issue: ${error.message}`));
  }
});

// Update a brand consistency issue
router.patch('/issues/:id', async (req: express.Request<{ id: string }>, res: express.Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json(wrapResponse(false, 'Unauthorized'));
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json(wrapResponse(false, 'Invalid issue ID'));
    }

    // Validate the request body
    const updateSchema = z.object({
      status: z.enum(['open', 'fixed', 'ignored']).optional(),
      description: z.string().optional(),
      recommendation: z.string().optional(),
      canAutoFix: z.boolean().optional(),
      autoFixCode: z.string().nullable().optional()
    });

    const validationResult = updateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json(wrapResponse(
        false, 
        'Invalid update data', 
        validationResult.error.format()
      ));
    }

    const updateData = validationResult.data;
    updateData.updatedAt = new Date();

    const updated = await storage.updateBrandConsistencyIssue(id, updateData);
    if (!updated) {
      return res.status(404).json(wrapResponse(false, 'Brand consistency issue not found or could not be updated'));
    }

    return res.json(wrapResponse(true, 'Brand consistency issue updated successfully', updated));
  } catch (error: any) {
    console.error('Error updating brand consistency issue:', error);
    return res.status(500).json(wrapResponse(false, `Error updating brand consistency issue: ${error.message}`));
  }
});

// Run a brand consistency check
router.post('/run-check', async (req: express.Request, res: express.Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json(wrapResponse(false, 'Unauthorized'));
    }

    const consistencyIssues = await monitorBrandConsistency();
    return res.json(wrapResponse(true, 'Brand consistency check completed successfully', consistencyIssues));
  } catch (error: any) {
    console.error('Error running brand consistency check:', error);
    return res.status(500).json(wrapResponse(false, `Error running brand consistency check: ${error.message}`));
  }
});

// Apply an auto-fix to a brand consistency issue
router.post('/issues/:id/apply-fix', async (req: express.Request<{ id: string }>, res: express.Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json(wrapResponse(false, 'Unauthorized'));
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json(wrapResponse(false, 'Invalid issue ID'));
    }

    // Get the brand consistency issue
    const issue = await storage.getBrandConsistencyIssue(id);
    if (!issue) {
      return res.status(404).json(wrapResponse(false, 'Brand consistency issue not found'));
    }

    // Check if the issue can be auto-fixed
    if (!issue.canAutoFix || !issue.autoFixCode) {
      return res.status(400).json(wrapResponse(false, 'This issue cannot be automatically fixed'));
    }

    // In a real implementation, this would apply the fix to the codebase
    // For this demo, we just update the issue status
    const updated = await storage.updateBrandConsistencyIssue(id, {
      status: 'fixed',
      updatedAt: new Date()
    });

    return res.json(wrapResponse(true, 'Auto-fix applied successfully', updated));
  } catch (error: any) {
    console.error('Error applying auto-fix:', error);
    return res.status(500).json(wrapResponse(false, `Error applying auto-fix: ${error.message}`));
  }
});

// Get recent content for brand analysis
router.get('/content', async (req: express.Request, res: express.Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json(wrapResponse(false, 'Unauthorized'));
    }

    const { limit } = req.query;
    const limitNum = limit ? parseInt(limit as string) : 20;
    
    const content = await storage.getRecentContent(limitNum);
    return res.json(wrapResponse(true, 'Content retrieved successfully', content));
  } catch (error: any) {
    console.error('Error fetching content for brand analysis:', error);
    return res.status(500).json(wrapResponse(false, `Error fetching content: ${error.message}`));
  }
});

export default router;