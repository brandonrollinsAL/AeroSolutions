import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { callXAI, getGrokCompletion } from '../utils/xaiClient';
import { db } from '../db';
import { eq, desc, sql } from 'drizzle-orm';

const router = Router();

/**
 * Suggestion 1: Debug Code Internally
 * Endpoint to analyze code snippets for errors using Grok AI
 */
router.post('/analyze-code', [
  body('code')
    .notEmpty().withMessage('Code snippet is required')
    .isString().withMessage('Code must be a string')
    .isLength({ max: 5000 }).withMessage('Code snippet must be less than 5000 characters')
], async (req: Request, res: Response) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { code, language = 'javascript' } = req.body;

    // Analyze code with Grok
    const prompt = `As an expert developer, analyze the following ${language} code for bugs, performance issues, and improvement opportunities:
    
\`\`\`${language}
${code}
\`\`\`

Please provide your analysis in the following JSON format:
{
  "issues": [
    {
      "type": "bug|performance|security|best_practice",
      "severity": "high|medium|low",
      "description": "Description of the issue",
      "line": "line number or range",
      "recommendation": "Suggested fix"
    }
  ],
  "summary": "Brief summary of findings",
  "improved_code": "Suggested improved version of the code (if applicable)"
}`;

    const response = await callXAI('/chat/completions', {
      model: 'grok-3-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1000
    });

    // Save analysis in debug logs table if available
    try {
      // Potential table structure, depends on actual schema
      // await db.insert(debugLogs).values({
      //   code_snippet: code.substring(0, 500), // storing just the beginning for reference
      //   analysis: JSON.stringify(response.choices[0].message.content),
      //   created_at: new Date()
      // });
    } catch (dbError) {
      console.warn('Failed to save debug log:', dbError);
      // Continue anyway, don't fail the request if logging fails
    }

    return res.status(200).json({
      success: true,
      analysis: JSON.parse(response.choices[0].message.content)
    });
  } catch (error: any) {
    console.error('Code analysis error:', error);
    return res.status(500).json({
      success: false,
      message: 'Code analysis failed',
      error: error.message
    });
  }
});

/**
 * Suggestion 2: Analyze Debugging Trends
 * Analyze debug logs for patterns and trends
 */
router.post('/analyze-trends', async (req: Request, res: Response) => {
  try {
    // Note: This would need a debug_logs table in the schema
    // Placeholder query that would need to be modified based on actual schema
    // const logs = await db.query.debugLogs.findMany({
    //   orderBy: [desc(debugLogs.created_at)],
    //   limit: 100
    // });
    
    // Mock data for demonstration
    const logs = [
      { message: "TypeError: Cannot read property 'id' of undefined in UserProfile.jsx", created_at: new Date() },
      { message: "API error: 429 Too Many Requests in AuthService.ts", created_at: new Date() },
      { message: "React warning: Each child in a list should have a unique 'key' prop in ProductList.jsx", created_at: new Date() }
    ];
    
    const logData = logs.map(log => log.message).join('\n');
    
    const prompt = `Analyze these debug logs for patterns and trends. Categorize the issues and suggest potential solutions:

Debug Logs:
${logData}

Provide your analysis in JSON format with these sections:
- Common error patterns
- Root cause suggestions
- Recommended fixes
- Priority areas for improvement`;

    const analysis = await getGrokCompletion(prompt, 'grok-3-mini');
    
    return res.status(200).json({
      success: true,
      trends: analysis
    });
  } catch (error: any) {
    console.error('Debug trend analysis error:', error);
    return res.status(500).json({
      success: false,
      message: 'Debug trend analysis failed',
      error: error.message
    });
  }
});

/**
 * Suggestion 3: Performance Optimization Analysis
 * Analyzes component performance metrics and provides optimization suggestions
 */
router.post('/performance-optimization', [
  body('component_data')
    .notEmpty().withMessage('Component performance data is required')
    .isObject().withMessage('Component data must be an object')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { component_data } = req.body;
    
    // Format the component data as string
    const formattedData = JSON.stringify(component_data, null, 2);
    
    const prompt = `Analyze this React component performance data and suggest optimizations:
    
${formattedData}

Provide recommendations for improving performance in these areas:
1. Render optimization
2. State management
3. Effects and lifecycle
4. Network/data fetching
5. Memory utilization`;

    const analysis = await getGrokCompletion(prompt, 'grok-3-mini');
    
    return res.status(200).json({
      success: true,
      optimization_suggestions: analysis
    });
  } catch (error: any) {
    console.error('Performance analysis error:', error);
    return res.status(500).json({
      success: false,
      message: 'Performance analysis failed',
      error: error.message
    });
  }
});

/**
 * Suggestion 4: API Usage Optimization
 * Analyzes API call patterns and provides optimization suggestions
 */
router.post('/api-optimization', async (req: Request, res: Response) => {
  try {
    // This would typically fetch from logs or analytics DB
    // Mock data for demonstration
    const apiLogs = [
      { endpoint: '/api/products', method: 'GET', response_time: 320, success: true, timestamp: new Date() },
      { endpoint: '/api/users/profile', method: 'GET', response_time: 450, success: true, timestamp: new Date() },
      { endpoint: '/api/orders', method: 'POST', response_time: 620, success: false, timestamp: new Date() }
    ];
    
    const apiData = JSON.stringify(apiLogs, null, 2);
    
    const prompt = `Analyze these API usage patterns and suggest optimizations:
    
${apiData}

Consider:
1. Response time optimization
2. Caching opportunities
3. Request patterns that could be batched
4. Error patterns
5. Resource utilization`;

    const analysis = await getGrokCompletion(prompt, 'grok-3-mini');
    
    return res.status(200).json({
      success: true,
      api_optimization: analysis
    });
  } catch (error: any) {
    console.error('API optimization analysis error:', error);
    return res.status(500).json({
      success: false,
      message: 'API optimization analysis failed',
      error: error.message
    });
  }
});

/**
 * Suggestion 5: User Flow Optimization
 * Analyzes user session flows and suggests UX improvements
 */
router.post('/user-flow-analysis', [
  body('session_data')
    .notEmpty().withMessage('Session data is required')
    .isArray().withMessage('Session data must be an array')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { session_data } = req.body;
    
    const prompt = `Analyze these user session flows and suggest UX improvements:
    
${JSON.stringify(session_data, null, 2)}

For each flow pattern, provide:
1. Identified friction points
2. Drop-off analytics
3. Suggested UI/UX improvements
4. Potential A/B test ideas
5. Priority recommendations`;

    const analysis = await getGrokCompletion(prompt, 'grok-3-mini');
    
    return res.status(200).json({
      success: true,
      user_flow_analysis: analysis
    });
  } catch (error: any) {
    console.error('User flow analysis error:', error);
    return res.status(500).json({
      success: false,
      message: 'User flow analysis failed',
      error: error.message
    });
  }
});

export default router;