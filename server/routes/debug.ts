import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { callXAI, getGrokCompletion } from '../utils/xaiClient';
import { db } from '../db';

const router = Router();

/**
 * Suggestion 1: Debug Code Internally
 * Endpoint to analyze code snippets for errors using Grok AI
 */
router.post('/analyze-code', [
  body('code')
    .notEmpty().withMessage('Code is required')
    .isString().withMessage('Code must be a string'),
  body('language')
    .notEmpty().withMessage('Language is required')
    .isString().withMessage('Language must be a string'),
  body('context')
    .optional()
    .isString().withMessage('Context must be a string')
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

    const { code, language, context = '' } = req.body;
    
    const contextText = context ? `Additional context: ${context}\n\n` : '';

    const prompt = `Analyze this ${language} code for errors, bugs, and optimization opportunities:

\`\`\`${language}
${code}
\`\`\`

${contextText}
Please provide a comprehensive analysis including:
1. Identified bugs and errors
2. Performance issues or inefficiencies
3. Security vulnerabilities
4. Code quality concerns
5. Optimization recommendations
6. A corrected version of the code (if applicable)

Return the analysis as a well-structured JSON object.`;

    const response = await callXAI('/chat/completions', {
      model: 'grok-3-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1500
    });
    
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
    const { logs } = req.body;
    
    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid logs array is required'
      });
    }

    // Format logs for analysis
    const logsText = logs.map((log: any, index: number) => {
      if (typeof log === 'string') {
        return `${index + 1}. ${log}`;
      } else if (typeof log === 'object') {
        return `${index + 1}. ${JSON.stringify(log)}`;
      }
      return `${index + 1}. ${String(log)}`;
    }).join('\n');

    const prompt = `Analyze these debugging logs to identify patterns, trends, and recurring issues:

Logs:
${logsText}

Provide a comprehensive analysis including:
1. Most frequent error types and their occurrence count
2. Time-based patterns (if timestamps are present)
3. Common error sequences or cascading failures
4. Component or module-specific error clusters
5. Root cause probability analysis
6. Actionable recommendations for fixing the most critical issues
7. Suggested monitoring improvements

Format the analysis as a JSON object with appropriate sections.`;

    const response = await callXAI('/chat/completions', {
      model: 'grok-3-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1000
    });
    
    return res.status(200).json({
      success: true,
      trend_analysis: JSON.parse(response.choices[0].message.content)
    });
  } catch (error: any) {
    console.error('Log trend analysis error:', error);
    return res.status(500).json({
      success: false,
      message: 'Log trend analysis failed',
      error: error.message
    });
  }
});

/**
 * Suggestion 3: Performance Optimization Analysis
 * Analyzes component performance metrics and provides optimization suggestions
 */
router.post('/performance-analysis', [
  body('metrics')
    .notEmpty().withMessage('Performance metrics are required')
    .isObject().withMessage('Metrics must be an object'),
  body('component_name')
    .optional()
    .isString().withMessage('Component name must be a string'),
  body('context')
    .optional()
    .isString().withMessage('Context must be a string')
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

    const { metrics, component_name = 'component', context = '' } = req.body;
    
    const metricsText = JSON.stringify(metrics, null, 2);
    const contextText = context ? `Additional context: ${context}\n\n` : '';

    const prompt = `Analyze these performance metrics for the "${component_name}" component:

${metricsText}

${contextText}
Provide a comprehensive performance optimization analysis including:
1. Performance bottlenecks identification
2. Resource usage inefficiencies
3. Loading time and rendering optimization suggestions
4. Caching recommendations
5. Network request optimizations
6. Bundle size reduction opportunities
7. Priority fixes with estimated impact
8. Long-term optimization strategy

Return the analysis as a JSON object with appropriate sections.`;

    const response = await callXAI('/chat/completions', {
      model: 'grok-3-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1000
    });
    
    return res.status(200).json({
      success: true,
      performance_analysis: JSON.parse(response.choices[0].message.content)
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
    const { api_calls } = req.body;
    
    if (!api_calls || !Array.isArray(api_calls) || api_calls.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid API calls array is required'
      });
    }

    // Format API calls for analysis
    const apiCallsText = JSON.stringify(api_calls, null, 2);

    const prompt = `Analyze these API call patterns and provide optimization recommendations:

API Calls:
${apiCallsText}

Provide a comprehensive API usage optimization analysis including:
1. Redundant API call patterns
2. Excessive polling or request frequency
3. Opportunities for batching or bulk operations
4. Caching recommendations with TTL suggestions
5. Rate limiting concerns and mitigation strategies
6. Parallel request optimization opportunities
7. Data payload size optimization
8. Error handling and retry strategy improvements

Format the analysis as a JSON object with appropriate sections.`;

    const response = await callXAI('/chat/completions', {
      model: 'grok-3-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1000
    });
    
    return res.status(200).json({
      success: true,
      api_optimization: JSON.parse(response.choices[0].message.content)
    });
  } catch (error: any) {
    console.error('API optimization error:', error);
    return res.status(500).json({
      success: false,
      message: 'API optimization failed',
      error: error.message
    });
  }
});

/**
 * Suggestion 5: User Flow Optimization
 * Analyzes user session flows and suggests UX improvements
 */
router.post('/user-flow-optimization', [
  body('session_data')
    .notEmpty().withMessage('Session data is required')
    .isArray().withMessage('Session data must be an array'),
  body('conversion_goal')
    .optional()
    .isString().withMessage('Conversion goal must be a string'),
  body('bounce_rate')
    .optional()
    .isNumeric().withMessage('Bounce rate must be a number')
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

    const { 
      session_data, 
      conversion_goal = 'general engagement', 
      bounce_rate = null 
    } = req.body;
    
    const sessionDataText = JSON.stringify(session_data, null, 2);
    const bounceRateText = bounce_rate !== null 
      ? `Current bounce rate: ${bounce_rate}%` 
      : 'Bounce rate not provided';

    const prompt = `Analyze these user session flows for a website with the conversion goal of "${conversion_goal}":

Session Data:
${sessionDataText}

${bounceRateText}

Provide a comprehensive user flow optimization analysis including:
1. Identified drop-off points and friction areas
2. Navigation path inefficiencies
3. Content engagement patterns
4. Form completion obstacles
5. Call-to-action effectiveness
6. Mobile vs desktop behavioral differences (if applicable)
7. Suggested A/B tests for improvement
8. Prioritized UX recommendations with expected impact

Format the analysis as a JSON object with appropriate sections.`;

    const response = await callXAI('/chat/completions', {
      model: 'grok-3-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1000
    });
    
    return res.status(200).json({
      success: true,
      user_flow_analysis: JSON.parse(response.choices[0].message.content)
    });
  } catch (error: any) {
    console.error('User flow optimization error:', error);
    return res.status(500).json({
      success: false,
      message: 'User flow optimization failed',
      error: error.message
    });
  }
});

export default router;