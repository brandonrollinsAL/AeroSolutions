import express from 'express';
import { db } from '../db';
import { callXAI } from '../utils/xaiClient';

const router = express.Router();

/**
 * Debug code endpoint
 * Analyzes code snippets for errors using Grok AI
 */
router.post('/code', async (req, res) => {
  const { code } = req.body;
  
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: 'Code snippet is required' 
    });
  }
  
  try {
    const response = await callXAI('/chat/completions', {
      model: 'grok-3-latest',
      messages: [{ 
        role: 'user', 
        content: `Debug this code and suggest fixes. Focus on JavaScript/TypeScript errors, 
        potential performance issues, and security vulnerabilities. Format your response with 
        markdown for code blocks and clear section headers:
        
        ${code}` 
      }],
    });
    
    res.json({ 
      success: true, 
      suggestions: response.choices[0].message.content 
    });
  } catch (error: any) {
    console.error('Code debugging failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Code debugging failed', 
      error: error.message,
      fallback: {
        suggestions: "I couldn't analyze your code at this time, but here are some general debugging tips:\n\n" +
          "1. Check for syntax errors like missing brackets, semicolons, or quotes\n" +
          "2. Verify all variables are properly declared and initialized\n" +
          "3. Look for common issues like undefined references or type mismatches\n" +
          "4. Consider adding console logs to trace execution flow\n" +
          "5. Review your error handling strategy\n\n" +
          "Please try again later or contact our support team for assistance."
      }
    });
  }
});

/**
 * Analyze debug trends endpoint
 * Uses Grok AI to analyze debug logs for trends
 */
router.post('/analyze-trends', async (req, res) => {
  try {
    // Get recent debug logs from database
    const { rows } = await db.query('SELECT * FROM debug_logs ORDER BY created_at DESC LIMIT 100');
    
    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No debug logs found'
      });
    }
    
    const logData = rows.map(log => `[${log.level}] [${log.created_at}] ${log.message}`).join('\n');
    
    const response = await callXAI('/chat/completions', {
      model: 'grok-3-latest',
      messages: [{ 
        role: 'user', 
        content: `Analyze these debug logs for trends and patterns. Identify common errors, 
        potential issues, and suggest possible solutions. Format your response with clear 
        section headers and bullet points:
        
        ${logData}` 
      }],
    });
    
    res.json({ 
      success: true, 
      trends: response.choices[0].message.content 
    });
  } catch (error: any) {
    console.error('Debug trend analysis failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Debug trend analysis failed', 
      error: error.message,
      fallback: {
        trends: "I couldn't analyze the debug logs at this time, but here are some general troubleshooting suggestions:\n\n" +
          "1. Look for repeated error patterns in your logs\n" +
          "2. Check for timing issues or sequence-related problems\n" +
          "3. Monitor system resource usage during error periods\n" +
          "4. Review recent code changes that might have introduced bugs\n" +
          "5. Consider environment-specific issues (dev vs. production)\n\n" +
          "Please try again later or contact our support team for assistance."
      }
    });
  }
});

/**
 * Analyze performance bottlenecks
 * Uses Grok AI to identify performance issues in application logs
 */
router.post('/performance', async (req, res) => {
  const { logs } = req.body;
  
  if (!logs || typeof logs !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: 'Application logs are required' 
    });
  }
  
  try {
    const response = await callXAI('/chat/completions', {
      model: 'grok-3-latest',
      messages: [{ 
        role: 'user', 
        content: `Analyze these application logs to identify performance bottlenecks. 
        Focus on slow operations, resource usage patterns, and optimize suggestions.
        Format your response with clear sections for different types of issues:
        
        ${logs}` 
      }],
    });
    
    res.json({ 
      success: true, 
      analysis: response.choices[0].message.content 
    });
  } catch (error: any) {
    console.error('Performance analysis failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Performance analysis failed', 
      error: error.message,
      fallback: {
        analysis: "I couldn't analyze the application logs at this time, but here are some general performance optimization tips:\n\n" +
          "1. Look for slow database queries that might need indexing\n" +
          "2. Check for memory leaks or excessive resource consumption\n" +
          "3. Consider implementing caching for frequently accessed data\n" +
          "4. Review frontend rendering performance and bundle sizes\n" +
          "5. Optimize API calls and reduce unnecessary network requests\n\n" +
          "Please try again later or contact our support team for assistance."
      }
    });
  }
});

export default router;