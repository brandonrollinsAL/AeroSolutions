import { Router } from 'express';
import { z } from 'zod';
import { generateJson } from '../utils/xaiClient';
import { storage } from '../storage';
import { insertPlatformCompatibilityIssueSchema } from '@shared/schema';
import { db } from '../db';
import { logs } from '@shared/schema';

const router = Router();

// Schema for platform error logging
const platformErrorSchema = z.object({
  timestamp: z.string(),
  error: z.object({
    name: z.string(),
    message: z.string(),
    stack: z.string().optional(),
  }),
  component: z.string(),
  platform: z.object({
    type: z.string(),
    os: z.string().optional(),
    browser: z.string().optional(),
    version: z.string().optional(),
    isMobile: z.boolean(),
    viewportWidth: z.number(),
    viewportHeight: z.number(),
    devicePixelRatio: z.number(),
  }),
});

/**
 * Endpoint to log platform-specific errors
 */
router.post('/log-platform-error', async (req, res) => {
  try {
    // Validate the request body
    const validatedData = platformErrorSchema.parse(req.body);
    
    // Store error in the logs table
    await db.insert(logs).values({
      level: 'error',
      message: `Platform error: ${validatedData.error.message}`,
      source: validatedData.component,
      context: validatedData,
      timestamp: new Date(validatedData.timestamp),
      userId: req.user?.id,
      sessionId: req.sessionID || '',
      requestId: req.headers['x-request-id'] as string || '',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error logging platform error:', error);
    res.status(400).json({ error: 'Invalid platform error data' });
  }
});

/**
 * Create a new platform compatibility issue
 */
router.post('/issues', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Validate the request body with our schema
    const validatedData = insertPlatformCompatibilityIssueSchema.parse(req.body);
    
    // Create the issue using our storage interface
    const newIssue = await storage.createPlatformCompatibilityIssue({
      ...validatedData,
      reportedBy: req.user.id,
      status: validatedData.status || 'open',
      occurrences: validatedData.occurrences || 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    res.status(201).json(newIssue);
  } catch (error) {
    console.error('Error creating platform compatibility issue:', error);
    res.status(400).json({ error: 'Failed to create platform compatibility issue' });
  }
});

/**
 * Get all platform compatibility issues with optional status filter
 */
router.get('/issues', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const status = req.query.status as string | undefined;
    const issues = await storage.getPlatformCompatibilityIssues(status);
    
    res.json({ issues });
  } catch (error) {
    console.error('Error fetching platform compatibility issues:', error);
    res.status(500).json({ error: 'Failed to fetch platform compatibility issues' });
  }
});

/**
 * Get platform compatibility issues for a specific platform
 */
router.get('/issues/platform/:platform', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const platform = req.params.platform;
    const issues = await storage.getPlatformIssuesByPlatform(platform);
    
    res.json({ issues });
  } catch (error) {
    console.error(`Error fetching platform issues for platform ${req.params.platform}:`, error);
    res.status(500).json({ error: 'Failed to fetch platform issues' });
  }
});

/**
 * Get a single platform compatibility issue by ID
 */
router.get('/issues/:id', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid issue ID' });
    }
    
    const issue = await storage.getPlatformCompatibilityIssue(id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    res.json(issue);
  } catch (error) {
    console.error(`Error fetching platform compatibility issue with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch platform compatibility issue' });
  }
});

/**
 * Update a platform compatibility issue
 */
router.patch('/issues/:id', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid issue ID' });
    }
    
    // Add updatedAt to the data
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    const updatedIssue = await storage.updatePlatformCompatibilityIssue(id, updateData);
    if (!updatedIssue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    res.json(updatedIssue);
  } catch (error) {
    console.error(`Error updating platform compatibility issue with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update platform compatibility issue' });
  }
});

/**
 * Increment occurrence count for an issue
 */
router.post('/issues/:id/increment-occurrence', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid issue ID' });
    }
    
    await storage.incrementIssueOccurrence(id);
    const updatedIssue = await storage.getPlatformCompatibilityIssue(id);
    
    res.json({ success: true, issue: updatedIssue });
  } catch (error) {
    console.error(`Error incrementing occurrence for issue ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to increment occurrence count' });
  }
});

/**
 * Get platform compatibility analysis summary and issues
 */
router.get('/analysis', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const analysis = await storage.analyzeCompatibilityIssues();
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing platform compatibility issues:', error);
    res.status(500).json({ error: 'Failed to analyze platform compatibility issues' });
  }
});

/**
 * Get platform compatibility AI-powered analysis 
 */
router.get('/platform-issues', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get recent platform errors from logs
    const recentPlatformLogs = await db.select()
      .from(logs)
      .where((logs) => {
        if (typeof logs.message === 'object' && logs.message.like) {
          return logs.message.like('Platform error:%');
        }
        return false;
      })
      .orderBy('timestamp', 'desc')
      .limit(50);
    
    if (recentPlatformLogs.length === 0) {
      return res.json({ issues: [] });
    }
    
    // Analyze platform errors with XAI
    const analysisPrompt = `
      You are an expert in cross-platform web application compatibility.
      Analyze these platform-specific errors and identify patterns:
      
      ${JSON.stringify(recentPlatformLogs.map(log => log.context), null, 2)}
      
      Provide a structured analysis in JSON format with the following structure:
      {
        "platformIssues": [
          {
            "platform": "string", // e.g., "ios", "android", "web", or specific browser name
            "issueType": "string", // e.g., "rendering", "performance", "input handling"
            "affectedComponents": ["string"], // List of component names affected
            "description": "string", // Detailed description of the issue
            "recommendedFix": "string", // Detailed recommendation for fixing
            "priority": "high" | "medium" | "low", // Based on frequency and severity
            "occurrences": number // Number of times this issue has occurred
          }
        ],
        "summary": {
          "mostAffectedPlatforms": ["string"], // Platforms with most issues
          "mostAffectedComponents": ["string"], // Components with most issues
          "criticalIssues": number, // Count of high priority issues
          "topRecommendations": ["string"] // Top 3 recommendations
        }
      }
      
      Group similar errors together and provide clear, actionable recommendations.
    `;
    
    const systemPrompt = `
      You are an expert web application developer specializing in cross-platform compatibility.
      Your goal is to identify patterns in errors that are specific to different platforms (iOS, Android, web browsers)
      and provide actionable recommendations for fixing these issues.
      
      Focus on:
      1. Identifying platform-specific patterns
      2. Recommending concrete CSS, JavaScript, or React patterns to fix the issues
      3. Grouping similar issues to avoid repetition
      4. Prioritizing issues based on frequency and severity
      
      Your analysis should be comprehensive but focused on actionable insights.
    `;
    
    // Use XAI to analyze the platform errors
    const analysis = await generateJson(analysisPrompt, systemPrompt);
    
    // Store any new issues identified by the AI
    if (analysis && analysis.platformIssues && Array.isArray(analysis.platformIssues)) {
      for (const aiIssue of analysis.platformIssues) {
        try {
          // Create or update platform compatibility issues in our database
          await storage.createPlatformCompatibilityIssue({
            platform: aiIssue.platform,
            issueType: aiIssue.issueType,
            affectedComponents: aiIssue.affectedComponents,
            description: aiIssue.description,
            recommendedFix: aiIssue.recommendedFix,
            priority: aiIssue.priority,
            occurrences: aiIssue.occurrences,
            status: 'open',
            reportedBy: req.user.id,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } catch (issueError) {
          console.error('Error storing AI-identified platform issue:', issueError);
          // Continue with other issues even if one fails
        }
      }
    }
    
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing platform issues:', error);
    res.status(500).json({ error: 'Failed to analyze platform issues' });
  }
});

export default router;