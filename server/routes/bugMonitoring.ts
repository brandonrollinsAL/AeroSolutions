import express from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { analyzeErrorLogs, analyzeUserFeedback, generateBugSummaryReport } from '../utils/bugMonitoringService';

const router = express.Router();

// Define a common response wrapper
const wrapResponse = <T>(success: boolean, message: string, data?: T) => {
  return {
    success,
    message,
    data
  };
};

// Get all bug reports with optional filtering
router.get('/reports', async (req: express.Request, res: express.Response) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json(wrapResponse(false, 'Unauthorized'));
    }

    const { status, severity, source } = req.query;

    // Apply filters if provided
    let filters: Record<string, string> = {};
    if (status && status !== 'all') {
      filters.status = status as string;
    }
    if (severity) {
      filters.severity = severity as string;
    }
    if (source) {
      filters.source = source as string;
    }

    const bugReports = await storage.getBugReports(filters);
    return res.json(wrapResponse(true, 'Bug reports retrieved successfully', bugReports));
  } catch (error: any) {
    console.error('Error fetching bug reports:', error);
    return res.status(500).json(wrapResponse(false, `Error fetching bug reports: ${error.message}`));
  }
});

// Get a specific bug report by ID
router.get('/reports/:id', async (req: express.Request<{ id: string }>, res: express.Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json(wrapResponse(false, 'Unauthorized'));
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json(wrapResponse(false, 'Invalid bug report ID'));
    }

    const bugReport = await storage.getBugReport(id);
    if (!bugReport) {
      return res.status(404).json(wrapResponse(false, 'Bug report not found'));
    }

    return res.json(wrapResponse(true, 'Bug report retrieved successfully', bugReport));
  } catch (error: any) {
    console.error('Error fetching bug report:', error);
    return res.status(500).json(wrapResponse(false, `Error fetching bug report: ${error.message}`));
  }
});

// Get error logs for analysis
router.get('/logs', async (req: express.Request, res: express.Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json(wrapResponse(false, 'Unauthorized'));
    }

    const { limit, level } = req.query;
    const limitNum = limit ? parseInt(limit as string) : 100;
    
    const logs = await storage.getErrorLogs({
      limit: limitNum,
      level: level as string | undefined
    });

    return res.json(wrapResponse(true, 'Error logs retrieved successfully', logs));
  } catch (error: any) {
    console.error('Error fetching error logs:', error);
    return res.status(500).json(wrapResponse(false, `Error fetching error logs: ${error.message}`));
  }
});

// Update a bug report (e.g., change status)
router.patch('/reports/:id', async (req: express.Request<{ id: string }>, res: express.Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json(wrapResponse(false, 'Unauthorized'));
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json(wrapResponse(false, 'Invalid bug report ID'));
    }

    // Validate the request body
    const updateSchema = z.object({
      status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
      severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      affectedComponent: z.string().nullable().optional(),
      suggestedFix: z.string().nullable().optional(),
      resolvedAt: z.date().nullable().optional(),
      closedAt: z.date().nullable().optional(),
      autoFixApplied: z.boolean().optional()
    });

    const validationResult = updateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json(wrapResponse(
        false, 
        'Invalid update data', 
        validationResult.error.format()
      ));
    }

    // If status is being updated to resolved, set resolvedAt if not provided
    const updateData = validationResult.data;
    if (updateData.status === 'resolved' && !updateData.resolvedAt) {
      updateData.resolvedAt = new Date();
    }

    // If status is being updated to closed, set closedAt if not provided
    if (updateData.status === 'closed' && !updateData.closedAt) {
      updateData.closedAt = new Date();
    }

    const updated = await storage.updateBugReport(id, updateData);
    if (!updated) {
      return res.status(404).json(wrapResponse(false, 'Bug report not found or could not be updated'));
    }

    return res.json(wrapResponse(true, 'Bug report updated successfully', updated));
  } catch (error: any) {
    console.error('Error updating bug report:', error);
    return res.status(500).json(wrapResponse(false, `Error updating bug report: ${error.message}`));
  }
});

// Analyze error logs for bugs
router.post('/analyze-logs', async (req: express.Request, res: express.Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json(wrapResponse(false, 'Unauthorized'));
    }

    // Get the latest error logs
    const logs = await storage.getErrorLogs({ limit: 100 });
    
    // Use AI to analyze logs for bugs
    const bugAnalysis = await analyzeErrorLogs(logs);
    
    // Return the analysis results
    return res.json(wrapResponse(true, 'Error logs analyzed successfully', bugAnalysis));
  } catch (error: any) {
    console.error('Error analyzing logs:', error);
    return res.status(500).json(wrapResponse(false, `Error analyzing logs: ${error.message}`));
  }
});

// Analyze user feedback for issues
router.post('/analyze-feedback', async (req: express.Request, res: express.Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json(wrapResponse(false, 'Unauthorized'));
    }

    const feedbackAnalysis = await analyzeUserFeedback();
    return res.json(wrapResponse(true, 'User feedback analyzed successfully', feedbackAnalysis));
  } catch (error: any) {
    console.error('Error analyzing user feedback:', error);
    return res.status(500).json(wrapResponse(false, `Error analyzing user feedback: ${error.message}`));
  }
});

// Generate a summary report of bugs
router.get('/summary-report', async (req: express.Request, res: express.Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json(wrapResponse(false, 'Unauthorized'));
    }

    const report = await generateBugSummaryReport();
    return res.json(wrapResponse(true, 'Bug summary report generated successfully', { report }));
  } catch (error: any) {
    console.error('Error generating bug summary report:', error);
    return res.status(500).json(wrapResponse(false, `Error generating bug summary report: ${error.message}`));
  }
});

// Apply an auto-fix to a bug
router.post('/reports/:id/apply-fix', async (req: express.Request<{ id: string }>, res: express.Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json(wrapResponse(false, 'Unauthorized'));
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json(wrapResponse(false, 'Invalid bug report ID'));
    }

    // Get the bug report
    const bugReport = await storage.getBugReport(id);
    if (!bugReport) {
      return res.status(404).json(wrapResponse(false, 'Bug report not found'));
    }

    // Check if the bug can be auto-fixed
    if (!bugReport.canAutoFix || !bugReport.autoFixCode) {
      return res.status(400).json(wrapResponse(false, 'This bug cannot be automatically fixed'));
    }

    // In a real implementation, this would apply the fix to the codebase
    // For this demo, we just update the bug status
    const updated = await storage.updateBugReport(id, {
      autoFixApplied: true,
      status: 'resolved',
      resolvedAt: new Date()
    });

    return res.json(wrapResponse(true, 'Auto-fix applied successfully', updated));
  } catch (error: any) {
    console.error('Error applying auto-fix:', error);
    return res.status(500).json(wrapResponse(false, `Error applying auto-fix: ${error.message}`));
  }
});

export default router;