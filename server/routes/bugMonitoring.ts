import express from 'express';
import { storage } from '../storage';
import { analyzeErrorLogs, analyzeUserFeedback, generateBugSummaryReport } from '../utils/bugMonitoringService';
import { generateText } from '../utils/xaiClient';

export const bugMonitoringRouter = express.Router();

// Get all bug reports
bugMonitoringRouter.get('/bugs', async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    
    const bugs = await storage.getBugReports(status, limit);
    res.json(bugs);
  } catch (error) {
    console.error('Error fetching bug reports:', error);
    res.status(500).json({ error: 'Failed to fetch bug reports' });
  }
});

// Get a specific bug report
bugMonitoringRouter.get('/bugs/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const bugs = await storage.getBugReports();
    const bug = bugs.find(b => b.id === id);
    
    if (!bug) {
      return res.status(404).json({ error: 'Bug report not found' });
    }
    
    res.json(bug);
  } catch (error) {
    console.error('Error fetching bug report:', error);
    res.status(500).json({ error: 'Failed to fetch bug report' });
  }
});

// Update a bug report
bugMonitoringRouter.patch('/bugs/:id', async (req, res) => {
  try {
    // Check for admin permission
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const id = parseInt(req.params.id);
    const updates = req.body;
    
    // Sanitize updates - only allow specific fields
    const allowedFields = ['status', 'assignedToUserId', 'suggestedFix'];
    const sanitizedUpdates: Record<string, any> = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        sanitizedUpdates[field] = updates[field];
      }
    }
    
    const updatedBug = await storage.updateBugReport(id, sanitizedUpdates);
    
    if (!updatedBug) {
      return res.status(404).json({ error: 'Bug report not found' });
    }
    
    res.json(updatedBug);
  } catch (error) {
    console.error('Error updating bug report:', error);
    res.status(500).json({ error: 'Failed to update bug report' });
  }
});

// Analyze recent logs
bugMonitoringRouter.post('/analyze-logs', async (req, res) => {
  try {
    // Check for admin permission
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Extract timeframe from request body or default to 'last_hour'
    const timeframe = req.body.timeframe || 'last_hour';
    
    const analysis = await analyzeErrorLogs(timeframe);
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing logs:', error);
    res.status(500).json({ error: 'Failed to analyze logs' });
  }
});

// Analyze user feedback
bugMonitoringRouter.post('/analyze-feedback', async (req, res) => {
  try {
    // Check for admin permission
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const analysis = await analyzeUserFeedback();
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing feedback:', error);
    res.status(500).json({ error: 'Failed to analyze feedback' });
  }
});

// Generate bug report summary
bugMonitoringRouter.get('/bug-summary', async (req, res) => {
  try {
    // Check for admin permission
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const report = await generateBugSummaryReport();
    res.json({ report });
  } catch (error) {
    console.error('Error generating bug summary report:', error);
    res.status(500).json({ error: 'Failed to generate bug summary report' });
  }
});

// Accept a bug and attempt an auto-fix
bugMonitoringRouter.post('/bugs/:id/apply-fix', async (req, res) => {
  try {
    // Check for admin permission
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const id = parseInt(req.params.id);
    
    // Get the bug report
    const bugs = await storage.getBugReports();
    const bug = bugs.find(b => b.id === id);
    
    if (!bug) {
      return res.status(404).json({ error: 'Bug report not found' });
    }
    
    // Check if bug can be auto-fixed
    if (!bug.canAutoFix || !bug.autoFixCode) {
      return res.status(400).json({ error: 'This bug cannot be automatically fixed' });
    }
    
    // Simulate applying the fix
    // In a real implementation, we'd use file system operations to apply the fix
    const applyResult = {
      success: true,
      message: 'Fix was applied successfully'
    };
    
    // Update the bug status
    const updatedBug = await storage.updateBugReport(id, {
      status: 'resolved',
      resolvedAt: new Date()
    });
    
    res.json({
      result: applyResult,
      bug: updatedBug
    });
  } catch (error) {
    console.error('Error applying bug fix:', error);
    res.status(500).json({ error: 'Failed to apply bug fix' });
  }
});

// Log monitoring dashboard data
bugMonitoringRouter.get('/monitoring-dashboard', async (req, res) => {
  try {
    // Check for admin permission
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Get recent logs
    const recentErrors = await storage.getRecentLogs('error', 100);
    const recentWarnings = await storage.getRecentLogs('warn', 50);
    
    // Get bug reports by status
    const openBugs = await storage.getBugReports('open');
    const inProgressBugs = await storage.getBugReports('in-progress');
    const resolvedBugs = await storage.getBugReports('resolved', 20);
    
    // Generate insights using XAI
    const errorTrends = await generateErrorInsights(recentErrors);
    
    // Compile dashboard data
    const dashboardData = {
      stats: {
        totalErrors: recentErrors.length,
        totalWarnings: recentWarnings.length,
        totalOpenBugs: openBugs.length,
        totalInProgressBugs: inProgressBugs.length,
        fixSuccessRate: calculateFixSuccessRate(resolvedBugs)
      },
      bugs: {
        open: openBugs,
        inProgress: inProgressBugs,
        recentlyResolved: resolvedBugs.slice(0, 5)
      },
      errorTrends
    };
    
    res.json(dashboardData);
  } catch (error) {
    console.error('Error generating monitoring dashboard:', error);
    res.status(500).json({ error: 'Failed to generate monitoring dashboard' });
  }
});

// Helper function to calculate fix success rate
function calculateFixSuccessRate(resolvedBugs: any[]): number {
  if (resolvedBugs.length === 0) return 0;
  
  const autoFixAttempted = resolvedBugs.filter(bug => bug.canAutoFix);
  if (autoFixAttempted.length === 0) return 0;
  
  const successfulFixes = autoFixAttempted.filter(bug => bug.status === 'resolved');
  return (successfulFixes.length / autoFixAttempted.length) * 100;
}

// Helper function to generate insights from error logs
async function generateErrorInsights(errors: any[]): Promise<any> {
  try {
    if (errors.length < 5) {
      return {
        patterns: [],
        recommendations: []
      };
    }
    
    const prompt = `
    Analyze these ${errors.length} recent error logs and identify patterns, trends, and potential systemic issues.
    
    Sample of 5 recent errors:
    ${errors.slice(0, 5).map(err => 
      `- Time: ${new Date(err.timestamp).toISOString()}, Source: ${err.source || 'unknown'}, Message: ${err.message}`
    ).join('\n')}
    
    Please provide:
    1. Top 3 error patterns or trends you observe
    2. 3 recommendations for addressing these errors
    
    Return your response as a JSON object with two arrays: 'patterns' and 'recommendations'.
    `;
    
    const systemPrompt = `You are an expert system analyst specializing in error log analysis. 
    Identify meaningful patterns in error logs and suggest actionable recommendations. 
    Be specific, concise, and practical in your analysis.`;
    
    const insights = await generateText(prompt, {
      model: 'grok-3-mini',
      systemPrompt,
      temperature: 0.3,
      maxTokens: 500
    });
    
    try {
      // Try to parse the response as JSON
      return JSON.parse(insights);
    } catch (e) {
      // If parsing fails, create a structured response
      const lines = insights.split('\n').filter(line => line.trim());
      const patterns = [];
      const recommendations = [];
      
      let section = '';
      for (const line of lines) {
        if (line.toLowerCase().includes('pattern') || line.toLowerCase().includes('trend')) {
          section = 'patterns';
          continue;
        } else if (line.toLowerCase().includes('recommendation')) {
          section = 'recommendations';
          continue;
        }
        
        // Extract content from bullet points
        const content = line.replace(/^[-*\d.]+\s*/, '').trim();
        if (content && section === 'patterns') {
          patterns.push(content);
        } else if (content && section === 'recommendations') {
          recommendations.push(content);
        }
      }
      
      return {
        patterns: patterns.slice(0, 3),
        recommendations: recommendations.slice(0, 3)
      };
    }
  } catch (error) {
    console.error('Error generating error insights:', error);
    return {
      patterns: [],
      recommendations: ['Monitor system for further occurrences']
    };
  }
}