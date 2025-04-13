import express, { Request, Response } from 'express';
import { storage } from '../storage';
import { analyzeErrorLogs, analyzeUserFeedback, generateBugSummaryReport } from '../utils/bugMonitoringService';
import { body, param, validationResult } from 'express-validator';
import { Logger } from '../middlewares/logger';
import path from 'path';
import fs from 'fs';

export const bugMonitoringRouter = express.Router();

// Get all bug reports with optional filtering by status
bugMonitoringRouter.get('/reports', async (req: Request, res: Response) => {
  try {
    const { status, limit = 50 } = req.query;
    
    const reports = await storage.getBugReports(
      status as string | undefined, 
      parseInt(limit as string, 10)
    );
    
    // Create a sanitized version that doesn't expose sensitive code snippets to client
    const sanitizedReports = reports.map(report => ({
      ...report,
      autoFixCode: report.autoFixCode ? '[Code snippet available]' : null,
    }));
    
    res.json({
      success: true,
      count: sanitizedReports.length,
      data: sanitizedReports
    });
  } catch (error: any) {
    Logger.error('Error fetching bug reports', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bug reports',
      error: error.message
    });
  }
});

// Get a specific bug report by ID
bugMonitoringRouter.get('/reports/:id', [
  param('id').isNumeric().withMessage('Report ID must be a number')
], async (req: Request<{ id: string }>, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID',
        errors: errors.array()
      });
    }

    // Check user permissions
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to access bug reports'
      });
    }
    
    const reportId = parseInt(req.params.id, 10);
    const report = await storage.getBugReport(reportId);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: `Bug report with ID ${reportId} not found`
      });
    }
    
    res.json({
      success: true,
      data: report
    });
  } catch (error: any) {
    Logger.error(`Error fetching bug report ${req.params.id}`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bug report',
      error: error.message
    });
  }
});

// Trigger manual analysis of error logs
bugMonitoringRouter.post('/analyze-logs', async (req: Request, res: Response) => {
  try {
    // Check user permissions
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to analyze logs'
      });
    }
    
    const { timeframe = 'last_day' } = req.body;
    
    // Start the analysis process
    const bugAnalyses = await analyzeErrorLogs(timeframe);
    
    res.json({
      success: true,
      message: `Log analysis completed. Found ${bugAnalyses.length} potential bugs.`,
      count: bugAnalyses.length,
      data: bugAnalyses.map(bug => ({
        affectedComponent: bug.affectedComponent,
        severity: bug.severity,
        description: bug.description,
        suggestedFix: bug.suggestedFix,
      }))
    });
  } catch (error: any) {
    Logger.error('Error analyzing logs', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze logs',
      error: error.message
    });
  }
});

// Trigger manual analysis of user feedback
bugMonitoringRouter.post('/analyze-feedback', async (req: Request, res: Response) => {
  try {
    // Check user permissions
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to analyze feedback'
      });
    }
    
    // Start the analysis process
    const feedbackAnalyses = await analyzeUserFeedback();
    
    // Filter to only show bug reports
    const bugReports = feedbackAnalyses.filter(analysis => analysis.isBugReport);
    
    res.json({
      success: true,
      message: `Feedback analysis completed. Found ${bugReports.length} potential bugs in ${feedbackAnalyses.length} feedback items.`,
      totalAnalyzed: feedbackAnalyses.length,
      bugsFound: bugReports.length,
      data: bugReports.map(bug => ({
        category: bug.category,
        priority: bug.priority,
        description: bug.description,
        suggestedAction: bug.suggestedAction,
      }))
    });
  } catch (error: any) {
    Logger.error('Error analyzing feedback', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze feedback',
      error: error.message
    });
  }
});

// Update the status of a bug report
bugMonitoringRouter.patch('/reports/:id', [
  param('id').isNumeric().withMessage('Report ID must be a number'),
  body('status').isIn(['open', 'in-progress', 'resolved', 'closed'])
    .withMessage('Status must be one of: open, in-progress, resolved, closed')
], async (req: Request<{ id: string }>, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: errors.array()
      });
    }

    // Check user permissions
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to update bug reports'
      });
    }
    
    const reportId = parseInt(req.params.id, 10);
    const { status } = req.body;
    
    // Add additional fields based on the new status
    const updateData: any = { status };
    
    if (status === 'resolved' || status === 'closed') {
      updateData.resolvedAt = new Date();
    }
    
    if (status === 'in-progress' && !req.body.assignedTo) {
      updateData.assignedTo = req.user.id; // Assign to the current user
    }
    
    const updatedReport = await storage.updateBugReport(reportId, updateData);
    
    if (!updatedReport) {
      return res.status(404).json({
        success: false,
        message: `Bug report with ID ${reportId} not found`
      });
    }
    
    res.json({
      success: true,
      message: `Bug report status updated to ${status}`,
      data: updatedReport
    });
  } catch (error: any) {
    Logger.error(`Error updating bug report ${req.params.id}`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bug report',
      error: error.message
    });
  }
});

// Get recent system logs with optional filtering by level
bugMonitoringRouter.get('/logs', async (req: Request, res: Response) => {
  try {
    const { level, limit = 100 } = req.query;
    
    // Check user permissions
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to access system logs'
      });
    }
    
    const logs = await storage.getRecentLogs(
      level as string | undefined, 
      parseInt(limit as string, 10)
    );
    
    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error: any) {
    Logger.error('Error fetching system logs', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system logs',
      error: error.message
    });
  }
});

// Generate a bug summary report
bugMonitoringRouter.get('/summary-report', async (req: Request, res: Response) => {
  try {
    // Check user permissions
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to generate bug summary report'
      });
    }
    
    const report = await generateBugSummaryReport();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      report
    });
  } catch (error: any) {
    Logger.error('Error generating bug summary report', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate bug summary report',
      error: error.message
    });
  }
});

// Get source code for a specific file
bugMonitoringRouter.get('/source', async (req: Request, res: Response) => {
  try {
    const { filePath } = req.query;
    
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'File path is required'
      });
    }

    // Check user permissions
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to access source code'
      });
    }
    
    // Security check: Prevent directory traversal attacks by ensuring path is within project directory
    const normalizedPath = path.normalize(filePath as string);
    const projectRoot = process.cwd();
    const absolutePath = path.resolve(projectRoot, normalizedPath);
    
    if (!absolutePath.startsWith(projectRoot)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Path is outside project directory'
      });
    }
    
    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({
        success: false,
        message: `File not found: ${normalizedPath}`
      });
    }
    
    // Read file content
    const fileContent = fs.readFileSync(absolutePath, 'utf8');
    
    // Get file stats
    const stats = fs.statSync(absolutePath);
    
    res.json({
      success: true,
      path: normalizedPath,
      size: stats.size,
      lastModified: stats.mtime,
      content: fileContent
    });
  } catch (error: any) {
    const filePath = req.query.filePath || 'unknown';
    Logger.error(`Error reading source file ${filePath}`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to read source file',
      error: error.message
    });
  }
});

// Get insights on bug patterns
bugMonitoringRouter.get('/insights', async (req: Request, res: Response) => {
  try {
    // Check user permissions
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to access bug insights'
      });
    }
    
    // Get all bug reports
    const allBugs = await storage.getBugReports();
    
    if (allBugs.length === 0) {
      return res.json({
        success: true,
        message: 'No bug data available for analysis',
        insights: null
      });
    }
    
    // Calculate statistics
    const severityCounts = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };
    
    const statusCounts = {
      open: 0,
      'in-progress': 0,
      resolved: 0,
      closed: 0
    };
    
    const componentCounts: Record<string, number> = {};
    
    allBugs.forEach(bug => {
      // Count by severity
      if (bug.severity) {
        severityCounts[bug.severity as keyof typeof severityCounts]++;
      }
      
      // Count by status
      if (bug.status) {
        statusCounts[bug.status as keyof typeof statusCounts]++;
      }
      
      // Count by component
      if (bug.affectedComponent) {
        componentCounts[bug.affectedComponent] = (componentCounts[bug.affectedComponent] || 0) + 1;
      }
    });
    
    // Find most common components
    const topComponents = Object.entries(componentCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([component, count]) => ({ component, count }));
    
    // Calculate average resolution time for resolved bugs
    const resolvedBugs = allBugs.filter(bug => bug.resolvedAt && bug.createdAt);
    let avgResolutionTimeMs = 0;
    
    if (resolvedBugs.length > 0) {
      const totalResolutionTimeMs = resolvedBugs.reduce((total, bug) => {
        const created = new Date(bug.createdAt);
        const resolved = new Date(bug.resolvedAt!);
        return total + (resolved.getTime() - created.getTime());
      }, 0);
      
      avgResolutionTimeMs = totalResolutionTimeMs / resolvedBugs.length;
    }
    
    // Convert milliseconds to hours
    const avgResolutionTimeHours = avgResolutionTimeMs / (1000 * 60 * 60);
    
    const insights = {
      totalBugs: allBugs.length,
      openBugs: statusCounts.open,
      resolvedBugs: statusCounts.resolved + statusCounts.closed,
      criticalBugs: severityCounts.critical,
      highBugs: severityCounts.high,
      severityDistribution: severityCounts,
      statusDistribution: statusCounts,
      avgResolutionTimeHours: avgResolutionTimeHours.toFixed(2),
      topAffectedComponents: topComponents,
      bugCreationTrend: [], // Would require time-series analysis
      recommendations: []
    };
    
    res.json({
      success: true,
      insights
    });
  } catch (error: any) {
    Logger.error('Error generating bug insights', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate bug insights',
      error: error.message
    });
  }
});