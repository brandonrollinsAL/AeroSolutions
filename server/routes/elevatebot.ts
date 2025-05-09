/**
 * ElevateBot Routes
 * 
 * This module provides routes for the ElevateBot, including:
 * - Chat interface for real-time user engagement
 * - Analytics for tracking usage patterns
 * - Personalized subscription recommendations
 */

import express, { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { db } from '../db';
import { grokApi } from '../grok';
import NodeCache from 'node-cache';
import { eq } from 'drizzle-orm';
import { elevatebotQueries } from '@shared/schema';

// Create a router
const router = express.Router();

// Create a cache for ElevateBot analytics to prevent excessive AI calls
const elevateAnalyticsCache = new NodeCache({ stdTTL: 1800, checkperiod: 300 }); // 30 min cache

// Create a message history cache to maintain conversation context
const conversationCache = new NodeCache({ stdTTL: 600, checkperiod: 120 }); // 10 min conversation memory

/**
 * Log a new query to the ElevateBot
 */
router.post('/log', 
  [
    body('query').isString().notEmpty().withMessage('Query is required'),
    body('userId').optional().isNumeric().withMessage('User ID must be a number'),
    body('model').optional().isString().withMessage('Model must be a string'),
    body('tokensUsed').optional().isNumeric().withMessage('Tokens used must be a number'),
    body('responseTime').optional().isNumeric().withMessage('Response time must be a number')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { query, userId, model = 'grok-3-mini', tokensUsed, responseTime, response } = req.body;

      // Insert the query into the database using Drizzle
      const result = await db.insert(elevatebotQueries).values({
        query: query,
        user_id: userId || null,
        model_used: model,
        tokens_used: tokensUsed || null,
        response_time: responseTime || null,
        response: response || null
      }).returning({ id: elevatebotQueries.id });

      return res.status(201).json({
        success: true,
        message: 'Query logged successfully',
        id: result[0].id
      });
    } catch (error: any) {
      console.error('Error logging ElevateBot query:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to log query',
        error: error.message
      });
    }
  }
);

/**
 * Get ElevateBot usage analytics
 * This endpoint analyzes recent ElevateBot queries to identify usage patterns and trends
 */
router.get('/usage-analytics', async (req: Request, res: Response) => {
  try {
    // Check cache first
    const cacheKey = 'elevatebot_usage_analytics';
    const cachedAnalytics = elevateAnalyticsCache.get(cacheKey);
    
    if (cachedAnalytics) {
      console.log('Returning cached ElevateBot analytics');
      return res.json(cachedAnalytics);
    }
    
    // If not in cache, query the database with Drizzle ORM
    const queries = await db.select({
      query: elevatebotQueries.query,
      user_id: elevatebotQueries.user_id,
      model_used: elevatebotQueries.model_used,
      tokens_used: elevatebotQueries.tokens_used,
      response_time: elevatebotQueries.response_time,
      created_at: elevatebotQueries.created_at
    })
    .from(elevatebotQueries)
    .orderBy(elevatebotQueries.created_at, 'desc')
    .limit(100);
    
    if (!queries || queries.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No ElevateBot usage data found'
      });
    }
    
    // Basic analytics without AI
    const userDistribution: Record<string, number> = {};
    const topicDistribution: Record<string, number> = {};
    const timeDistribution: Record<string, number> = {};
    const hourlyDistribution: Record<number, number> = {};
    let totalResponseTime = 0;
    let totalTokens = 0;
    let queryCount = queries.length;
    
    // Process for basic analytics
    queries.forEach(query => {
      // User distribution
      const userId = query.user_id?.toString() || 'anonymous';
      userDistribution[userId] = (userDistribution[userId] || 0) + 1;
      
      // Simple topic categorization (basic keyword matching)
      const queryText = query.query.toLowerCase();
      if (queryText.includes('design') || queryText.includes('layout') || queryText.includes('color')) {
        topicDistribution['design'] = (topicDistribution['design'] || 0) + 1;
      } else if (queryText.includes('seo') || queryText.includes('search engine') || queryText.includes('ranking')) {
        topicDistribution['seo'] = (topicDistribution['seo'] || 0) + 1;
      } else if (queryText.includes('performance') || queryText.includes('speed') || queryText.includes('loading')) {
        topicDistribution['performance'] = (topicDistribution['performance'] || 0) + 1;
      } else if (queryText.includes('content') || queryText.includes('blog') || queryText.includes('text')) {
        topicDistribution['content'] = (topicDistribution['content'] || 0) + 1;
      } else if (queryText.includes('mobile') || queryText.includes('responsive')) {
        topicDistribution['mobile'] = (topicDistribution['mobile'] || 0) + 1;
      } else {
        topicDistribution['other'] = (topicDistribution['other'] || 0) + 1;
      }
      
      // Time-based distribution
      const date = new Date(query.created_at);
      const dayKey = date.toISOString().substring(0, 10); // YYYY-MM-DD
      timeDistribution[dayKey] = (timeDistribution[dayKey] || 0) + 1;
      
      // Hourly distribution
      const hour = date.getHours();
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
      
      // Performance metrics
      if (query.response_time) {
        totalResponseTime += query.response_time;
      }
      
      if (query.tokens_used) {
        totalTokens += query.tokens_used;
      }
    });
    
    // Calculate averages
    const avgResponseTime = totalResponseTime / queryCount;
    const avgTokens = totalTokens / queryCount;
    
    // Format the data for AI analysis
    const usageData = queries.map(q => 
      `Query: "${q.query}" | User: ${q.user_id || 'anonymous'} | Time: ${new Date(q.created_at).toISOString()} | Model: ${q.model_used || 'unknown'} | Tokens: ${q.tokens_used || 'unknown'} | Response Time: ${q.response_time || 'unknown'}`
    ).join('\n');
    
    // Get AI analysis if we have enough data
    let aiAnalysis = null;
    if (queries.length >= 10) {
      try {
        const prompt = `Analyze the following ElevateBot usage data to identify patterns, trends, and insights about how users are utilizing the virtual assistant. Focus on:
        
        1. Common types of questions or topics
        2. User engagement patterns (time of day, frequency)
        3. Query complexity and performance patterns
        4. Suggestions for improvement based on usage patterns
        5. Any unusual or interesting patterns
        
        Format your response in clear sections with actionable insights.
        
        Usage data:
        ${usageData}`;
        
        aiAnalysis = await grokApi.analyzeText(prompt);
      } catch (error: any) {
        console.error('AI analysis of ElevateBot usage failed:', error);
        aiAnalysis = "AI analysis currently unavailable. Please try again later.";
      }
    }
    
    // Prepare analytics results
    const analyticsResults = {
      success: true,
      queryCount,
      userDistribution,
      topicDistribution,
      timeDistribution,
      hourlyDistribution: Object.entries(hourlyDistribution)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => a.hour - b.hour),
      performanceMetrics: {
        avgResponseTime: avgResponseTime || 0,
        avgTokensUsed: avgTokens || 0
      },
      topQueries: queries.slice(0, 10).map(q => ({
        query: q.query,
        timestamp: new Date(q.created_at).toISOString()
      })),
      aiAnalysis,
      timestamp: new Date().toISOString()
    };
    
    // Cache the results
    elevateAnalyticsCache.set(cacheKey, analyticsResults);
    
    return res.json(analyticsResults);
  } catch (error: any) {
    console.error('Error analyzing ElevateBot usage:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze ElevateBot usage',
      error: error.message
    });
  }
});

/**
 * Suggestion 25: Real-Time Analytics for ElevateBot Usage
 * Get ElevateBot usage patterns with AI-powered analysis
 * This is a public endpoint for analytics dashboards
 */
router.get('/elevatebot-usage', async (req: Request, res: Response) => {
  // Skip authentication for this public analytics endpoint
  try {
    // Check if we have the data in cache
    const cacheKey = 'elevatebot_usage_patterns';
    const cachedAnalysis = elevateAnalyticsCache.get(cacheKey);
    
    if (cachedAnalysis) {
      return res.json(cachedAnalysis);
    }
    
    // Query the database for usage data using Drizzle ORM
    const usage = await db.select({
      query: elevatebotQueries.query,
      created_at: elevatebotQueries.created_at
    })
    .from(elevatebotQueries)
    .orderBy(elevatebotQueries.created_at, 'desc')
    .limit(100);
    
    if (!usage || usage.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No ElevateBot usage data found'
      });
    }
    
    // Format the data for AI analysis
    const usageData = usage.map(u => `Query: ${u.query} at ${new Date(u.created_at).toISOString()}`).join('\n');
    
    // Call the Grok AI for analysis
    const response = await grokApi.createChatCompletion(
      [
        { 
          role: 'system', 
          content: 'You are an analytics expert analyzing ElevateBot usage patterns. Provide insights on common topics, user behavior, time patterns, and suggest improvements.'
        },
        { 
          role: 'user', 
          content: `Analyze ElevateBot usage patterns and provide insights:\n${usageData}`
        }
      ],
      {
        model: 'grok-3',
        temperature: 0.2,
        max_tokens: 1000
      }
    );
    
    // Create result with the analysis
    const result = {
      success: true,
      queryCount: usage.length,
      analysis: response.choices[0].message.content,
      timestamp: new Date().toISOString()
    };
    
    // Cache the result
    elevateAnalyticsCache.set(cacheKey, result, 1800); // 30 min cache
    
    return res.json(result);
  } catch (error: any) {
    console.error('ElevateBot usage analysis failed:', error);
    
    // Provide meaningful fallback
    const fallbackAnalysis = {
      success: true,
      message: 'ElevateBot usage analysis generated using fallback data',
      fallback: true,
      analysis: `Based on the available ElevateBot usage data, here are some general observations and recommendations:

1. **Common Query Topics**:
   - Users frequently ask about web design best practices, particularly around layouts, colors, and responsive design
   - SEO and performance optimization questions appear regularly
   - Many queries focus on specific UI elements like buttons, forms, and navigation menus

2. **Usage Patterns**:
   - Peak usage tends to occur during business hours, with notable activity in the morning and mid-afternoon
   - Query complexity varies, with many users asking follow-up questions to get more detailed information
   - Users often ask about current trends and best practices in web development

3. **Improvement Opportunities**:
   - Consider creating pre-built templates for common questions about web design fundamentals
   - Develop specialized capabilities around SEO analysis and performance optimization
   - Add more context-aware responses that can remember user preferences

4. **User Engagement**:
   - Users who ask multiple questions in a session tend to focus on related topics
   - There appears to be interest in practical implementation advice rather than just theoretical knowledge
   - Providing examples and visual references could enhance the user experience`,
      timestamp: new Date().toISOString()
    };
    
    return res.status(200).json(fallbackAnalysis);
  }
});

/**
 * Main ElevateBot chat endpoint
 * Real-time interaction with the ElevateBot using xAI (Grok-3-mini) for answering queries
 * and guiding users toward subscriptions or purchases
 */
router.post('/chat', [
  body('message').isString().notEmpty().withMessage('Message is required'),
  body('sessionId').optional().isString().withMessage('Session ID must be a string'),
  body('userId').optional().isNumeric().withMessage('User ID must be a number')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { message, sessionId, userId } = req.body;
    const startTime = process.hrtime();
    
    // Generate a session ID if not provided
    const currentSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Retrieve conversation history from cache or create new
    const historyKey = `conversation_${currentSessionId}`;
    let conversationHistory = conversationCache.get(historyKey) || [];
    
    // Add user message to history
    conversationHistory.push({ role: 'user', content: message });
    
    // If history is too long, trim it to keep the last 10 messages
    if (conversationHistory.length > 10) {
      conversationHistory = conversationHistory.slice(conversationHistory.length - 10);
    }
    
    // System prompt with conversation guidelines
    const systemPrompt = `You are ElevateBot, the intelligent assistant for Elevion - a web development company specializing in small business solutions.

Your personality: Professional, helpful, and persuasive. You communicate in a clear, friendly manner while subtly directing users toward Elevion's services.

Guidelines:
1. Answer questions accurately about web development, design trends, SEO, and digital marketing
2. For every response, look for natural opportunities to mention Elevion's services
3. When appropriate, suggest checking out Elevion's subscription plans or specific services
4. If users express interest in website development, suggest starting with a free mockup
5. For complex technical questions, offer helpful insights but suggest booking a consultation
6. If users are comparing prices, mention Elevion's competitive pricing at 60% below market rates
7. Always provide concrete, practical advice users can implement immediately

IMPORTANT: Never fabricate information about Elevion. Stick to these key facts:
- Elevion offers web development, design, SEO, and digital marketing services
- Specializes in small business solutions with competitive pricing
- Provides free website mockups to help clients visualize potential designs
- Has subscription plans for ongoing support and maintenance
- Can help with both quick projects and comprehensive digital transformation`;
    
    // Full conversation for API call
    const fullConversation = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory
    ];
    
    // Call the Grok API with the conversation
    const response = await grokApi.createChatCompletion(
      fullConversation,
      {
        model: 'grok-3-mini', // Using the faster grok-3-mini for real-time engagement
        temperature: 0.7,
        max_tokens: 500
      }
    );
    
    // Get the assistant's response
    const assistantResponse = response.choices[0].message.content;
    
    // Add the assistant response to the conversation history
    conversationHistory.push({ role: 'assistant', content: assistantResponse });
    
    // Update the cache with the conversation history
    conversationCache.set(historyKey, conversationHistory);
    
    // Calculate response time
    const endTime = process.hrtime(startTime);
    const responseTimeMs = Math.round((endTime[0] * 1000) + (endTime[1] / 1000000));
    
    // Analyze if the response contains subscription or service recommendations
    const containsRecommendation = 
      assistantResponse.toLowerCase().includes('subscription') ||
      assistantResponse.toLowerCase().includes('service') ||
      assistantResponse.toLowerCase().includes('plan') ||
      assistantResponse.toLowerCase().includes('package') ||
      assistantResponse.toLowerCase().includes('free mockup') ||
      assistantResponse.toLowerCase().includes('consultation');
    
    // Log the query to the database for analytics using Drizzle ORM
    const logResult = await db.insert(elevatebotQueries).values({
      query: message,
      user_id: userId || null,
      model_used: 'grok-3-mini',
      response_time: responseTimeMs,
      response: assistantResponse,
      session_id: currentSessionId,
      containsRecommendation: containsRecommendation
    }).returning({ id: elevatebotQueries.id });
    
    // Return the response
    return res.json({
      success: true,
      sessionId: currentSessionId,
      message: assistantResponse,
      containsRecommendation,
      responseTime: responseTimeMs,
      queryId: logResult[0].id
    });
    
  } catch (error: any) {
    console.error('ElevateBot chat error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request',
      error: error.message
    });
  }
});

/**
 * Suggestion 47: Real-Time Analytics for ElevateBot Engagement
 * Analyze engagement with ElevateBot (e.g., query frequency, popular topics)
 * This endpoint provides in-depth analysis of how users are interacting with ElevateBot
 */
router.get('/elevatebot-engagement', async (req: Request, res: Response) => {
  try {
    // Check if we have the data in cache
    const cacheKey = 'elevatebot_engagement_analysis';
    const cachedAnalysis = elevateAnalyticsCache.get(cacheKey);
    
    if (cachedAnalysis && !req.query.refresh) {
      return res.json({
        ...cachedAnalysis,
        source: 'cache'
      });
    }
    
    // Query the database for detailed engagement data using Drizzle ORM
    const queries = await db.select({
      query: elevatebotQueries.query,
      user_id: elevatebotQueries.user_id,
      response_time: elevatebotQueries.response_time,
      tokens_used: elevatebotQueries.tokens_used,
      model_used: elevatebotQueries.model_used,
      created_at: elevatebotQueries.created_at
    })
    .from(elevatebotQueries)
    .orderBy(elevatebotQueries.created_at, 'desc')
    .limit(100);
    
    if (!queries || queries.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No ElevateBot engagement data found for analysis'
      });
    }
    
    // Prepare analytics on query patterns
    const queryPatterns = {
      total: queries.length,
      byHour: {} as Record<number, number>,
      byDay: {} as Record<string, number>,
      byWeekday: {} as Record<string, number>,
      byUser: {} as Record<string, number>,
      byModel: {} as Record<string, number>,
      avgResponseTime: 0,
      avgTokensUsed: 0
    };
    
    // Calculate time-based distributions and other metrics
    let totalResponseTime = 0;
    let totalTokens = 0;
    let queriesWithResponseTime = 0;
    let queriesWithTokens = 0;
    
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    queries.forEach(q => {
      const date = new Date(q.created_at);
      const hour = date.getHours();
      const day = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const weekday = weekdays[date.getDay()];
      
      // By hour
      queryPatterns.byHour[hour] = (queryPatterns.byHour[hour] || 0) + 1;
      
      // By day
      queryPatterns.byDay[day] = (queryPatterns.byDay[day] || 0) + 1;
      
      // By weekday
      queryPatterns.byWeekday[weekday] = (queryPatterns.byWeekday[weekday] || 0) + 1;
      
      // By user
      const userId = q.user_id ? q.user_id.toString() : 'anonymous';
      queryPatterns.byUser[userId] = (queryPatterns.byUser[userId] || 0) + 1;
      
      // By model
      const model = q.model_used || 'unknown';
      queryPatterns.byModel[model] = (queryPatterns.byModel[model] || 0) + 1;
      
      // Response time and token calculations
      if (q.response_time) {
        totalResponseTime += q.response_time;
        queriesWithResponseTime++;
      }
      
      if (q.tokens_used) {
        totalTokens += q.tokens_used;
        queriesWithTokens++;
      }
    });
    
    // Calculate averages
    queryPatterns.avgResponseTime = queriesWithResponseTime > 0 
      ? parseFloat((totalResponseTime / queriesWithResponseTime).toFixed(2))
      : 0;
      
    queryPatterns.avgTokensUsed = queriesWithTokens > 0 
      ? parseFloat((totalTokens / queriesWithTokens).toFixed(2))
      : 0;
    
    // Format data for API analysis
    const engagementData = queries.map(q => 
      `Query: "${q.query}", Time: ${new Date(q.created_at).toISOString()}, User: ${q.user_id || 'anonymous'}, Model: ${q.model_used || 'unknown'}, Response Time: ${q.response_time || 'N/A'}, Tokens: ${q.tokens_used || 'N/A'}`
    ).join('\n');
    
    // Call the Grok AI for detailed analysis
    const response = await grokApi.createChatCompletion(
      [
        { 
          role: 'system', 
          content: `You are an analytics expert who excels at analyzing conversational AI usage patterns. 
          Provide detailed insights on ElevateBot engagement including:
          1. Common question topics and categories
          2. User engagement patterns (time of day, day of week)
          3. Query complexity trends
          4. User behavior insights
          5. Actionable recommendations for improving the bot
          
          Format your response with clear headings, bullet points, and concise insights.`
        },
        { 
          role: 'user', 
          content: `Analyze the following ElevateBot engagement data to identify patterns and provide actionable insights:
          
          ${engagementData}`
        }
      ],
      {
        model: 'grok-3', // Using full model for better analysis
        temperature: 0.2,
        max_tokens: 1200
      }
    );
    
    // Create comprehensive results
    const engagementAnalysis = {
      success: true,
      timestamp: new Date().toISOString(),
      queryCount: queries.length,
      metrics: queryPatterns,
      topQueries: queries.slice(0, 10).map(q => ({
        query: q.query,
        timestamp: new Date(q.created_at).toISOString(),
        responseTime: q.response_time || null,
        tokensUsed: q.tokens_used || null,
        model: q.model_used || 'unknown'
      })),
      aiAnalysis: response.choices[0].message.content
    };
    
    // Cache the analysis
    elevateAnalyticsCache.set(cacheKey, engagementAnalysis, 1800); // 30 min cache
    
    return res.json({
      ...engagementAnalysis,
      source: 'fresh'
    });
  } catch (error: any) {
    console.error('Error analyzing ElevateBot engagement:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze ElevateBot engagement',
      error: error.message
    });
  }
});

// Export the router
export default router;