import { Router } from 'express';
import { z } from 'zod';
import { generateJson } from '../utils/xaiClient';
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
      sessionId: req.sessionID,
      requestId: req.headers['x-request-id'] as string,
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
 * Get platform compatibility issues
 */
router.get('/platform-issues', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get recent platform errors from logs
    const recentPlatformLogs = await db.select()
      .from(logs)
      .where(logs.message.like('Platform error:%'))
      .orderBy(logs.timestamp, 'desc')
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
    
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing platform issues:', error);
    res.status(500).json({ error: 'Failed to analyze platform issues' });
  }
});

export default router;