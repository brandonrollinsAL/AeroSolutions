import { Router, Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { db } from '../db';
import { 
  websiteEngagement, 
  uiElementInteractions, 
  contents, 
  websiteMetrics, 
  websiteConversions,
  userSessions
} from '@shared/schema';
import { eq, desc, and, gt, lt, like, sql } from 'drizzle-orm';
import { callXAI, generateJson, generateText } from '../utils/xaiClient';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../utils/auth';

const router = Router();

/**
 * Get landing page optimization recommendations based on user engagement data
 * Analyzes user behavior to recommend content, layout, and CTA improvements
 */
router.get('/optimize/:pagePath', [
  param('pagePath')
    .isString()
    .withMessage('Page path must be a string')
    .trim(),
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', 'all'])
    .withMessage('Period must be 7d, 30d, 90d, or all'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { pagePath } = req.params;
    const period = req.query.period as string || '30d';
    
    // Set date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        startDate = new Date(2000, 0, 1); // Far in the past
    }

    // Decode pagePath for query
    const decodedPath = decodeURIComponent(pagePath);
    
    // Get engagement metrics for the page
    const engagementData = await db.select()
      .from(websiteEngagement)
      .where(and(
        like(websiteEngagement.path, `%${decodedPath}%`),
        gt(websiteEngagement.dateCollected, startDate)
      ))
      .orderBy(desc(websiteEngagement.dateCollected));
      
    // Get UI interactions for the page
    const interactionData = await db.select()
      .from(uiElementInteractions)
      .where(and(
        like(uiElementInteractions.pagePath, `%${decodedPath}%`),
        gt(uiElementInteractions.timestamp, startDate)
      ))
      .orderBy(desc(uiElementInteractions.timestamp));
      
    // Get conversion data if available
    const conversionData = await db.select()
      .from(websiteConversions)
      .where(and(
        like(websiteConversions.sourcePath, `%${decodedPath}%`),
        gt(websiteConversions.timestamp, startDate)
      ))
      .orderBy(desc(websiteConversions.timestamp));
    
    // Get session data for this page
    const sessionData = await db.select()
      .from(userSessions)
      .where(and(
        sql`${userSessions.pagesVisited}::text LIKE ${`%${decodedPath}%`}`,
        gt(userSessions.startTime, startDate)
      ))
      .orderBy(desc(userSessions.startTime));
    
    // Analyze engagement data
    const totalVisits = engagementData.length;
    
    if (totalVisits === 0) {
      return res.status(404).json({
        success: false,
        message: "No engagement data found for this page"
      });
    }
    
    // Calculate engagement metrics
    const avgTimeOnPage = engagementData.reduce((sum, item) => 
      sum + parseFloat(item.timeOnPage.toString()), 0) / totalVisits;
      
    const avgScrollDepth = engagementData.reduce((sum, item) => 
      sum + parseFloat(item.scrollDepth.toString()), 0) / totalVisits;
      
    const totalClicks = engagementData.reduce((sum, item) => 
      sum + item.clicks, 0);
      
    const totalInteractions = engagementData.reduce((sum, item) => 
      sum + item.interactionCount, 0);
    
    // Device breakdown
    const deviceBreakdown = engagementData.reduce((devices: Record<string, number>, record) => {
      const device = record.deviceType || 'unknown';
      devices[device] = (devices[device] || 0) + 1;
      return devices;
    }, {});
    
    // Browser breakdown
    const browserBreakdown = engagementData.reduce((browsers: Record<string, number>, record) => {
      const browser = record.browser || 'unknown';
      browsers[browser] = (browsers[browser] || 0) + 1;
      return browsers;
    }, {});
    
    // Analyze interaction data by element
    const elementInteractions = interactionData.reduce((elements: Record<string, any>, record) => {
      const elementId = record.elementId || 'unknown';
      
      if (!elements[elementId]) {
        elements[elementId] = {
          elementId,
          elementType: record.elementType,
          interactionType: [],
          interactionCount: 0,
          interactionDuration: 0,
          count: 0
        };
      }
      
      elements[elementId].interactionCount += record.interactionCount;
      elements[elementId].interactionDuration += parseFloat(record.interactionDuration.toString());
      elements[elementId].count++;
      
      if (!elements[elementId].interactionType.includes(record.interactionType)) {
        elements[elementId].interactionType.push(record.interactionType);
      }
      
      return elements;
    }, {});
    
    // Calculate average interaction duration for each element
    Object.keys(elementInteractions).forEach(elementId => {
      const element = elementInteractions[elementId];
      element.avgInteractionDuration = element.interactionDuration / element.count;
    });
    
    // Conversion metrics
    const conversions = conversionData.length;
    const conversionRate = totalVisits > 0 ? (conversions / totalVisits) * 100 : 0;
    
    // Session metrics
    const averageSessionDuration = sessionData.reduce((sum, session) => {
      const duration = (new Date(session.endTime || new Date()).getTime() - 
        new Date(session.startTime).getTime()) / 1000; // duration in seconds
      return sum + duration;
    }, 0) / (sessionData.length || 1);
    
    // Prepare data for AI analysis
    const pageAnalysisData = {
      pagePath: decodedPath,
      period,
      engagement: {
        totalVisits,
        avgTimeOnPage,
        avgScrollDepth: `${avgScrollDepth.toFixed(2)}%`,
        totalClicks,
        totalInteractions,
        deviceBreakdown,
        browserBreakdown
      },
      interactions: {
        totalElements: Object.keys(elementInteractions).length,
        elements: Object.values(elementInteractions)
      },
      conversions: {
        totalConversions: conversions,
        conversionRate: `${conversionRate.toFixed(2)}%`
      },
      sessions: {
        totalSessions: sessionData.length,
        averageSessionDuration: `${averageSessionDuration.toFixed(2)} seconds`
      }
    };
    
    // Get optimization recommendations from XAI
    const systemPrompt = `You are Elevion's AI landing page optimizer, specializing in analyzing user engagement data to provide actionable recommendations for improving landing page performance.
    Your analysis should be data-driven and focused on practical improvements that could be implemented within a React application using wouter for routing.`;
    
    const userPrompt = `Analyze the following landing page user engagement data and provide optimization recommendations:
    
    ${JSON.stringify(pageAnalysisData, null, 2)}
    
    Based on this data, provide the following in your response:
    
    1. A concise summary of current page performance
    2. Content recommendations (what content should be added, removed, or modified)
    3. Layout recommendations (how the page structure could be improved)
    4. Call-to-action (CTA) recommendations
    5. Device-specific optimizations
    6. A/B testing suggestions
    7. Prioritized action items (from highest to lowest impact)
    
    Your recommendations should be specific and actionable, focused on improving user engagement and conversion rates.`;
    
    const optimizationRecommendations = await generateJson<{
      summary: string;
      contentRecommendations: {
        recommendation: string;
        impact: string;
        complexity: string;
      }[];
      layoutRecommendations: {
        recommendation: string;
        impact: string;
        complexity: string;
      }[];
      ctaRecommendations: {
        recommendation: string;
        impact: string;
        complexity: string;
      }[];
      deviceOptimizations: {
        deviceType: string;
        recommendations: string[];
      }[];
      abTestingSuggestions: {
        testName: string;
        variantA: string;
        variantB: string;
        hypothesis: string;
        metrics: string[];
      }[];
      prioritizedActions: {
        action: string;
        expectedImpact: string;
        timeframe: string;
      }[];
    }>(userPrompt, {
      model: 'grok-3',
      systemPrompt,
      temperature: 0.2,
      maxTokens: 2000
    });
    
    // Return the optimization recommendations
    res.json({
      success: true,
      pagePath: decodedPath,
      period,
      metrics: {
        visits: totalVisits,
        avgTimeOnPage: `${avgTimeOnPage.toFixed(2)} seconds`,
        avgScrollDepth: `${avgScrollDepth.toFixed(2)}%`,
        conversionRate: `${conversionRate.toFixed(2)}%`,
        deviceBreakdown,
        browserBreakdown
      },
      recommendations: optimizationRecommendations
    });
  } catch (error) {
    console.error('Error getting landing page optimization recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get landing page optimization recommendations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Record landing page A/B test results
 * Stores performance data for different page variants
 */
router.post('/ab-test/results', [
  body('pagePath')
    .isString()
    .withMessage('Page path must be a string')
    .trim(),
  body('variantId')
    .isString()
    .withMessage('Variant ID must be a string')
    .trim(),
  body('metrics')
    .isObject()
    .withMessage('Metrics must be an object')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { pagePath, variantId, metrics } = req.body;
    
    // Store A/B test results in website metrics table
    const newMetrics = {
      id: uuidv4(),
      pagePath,
      metricType: 'ab_test_result',
      metricName: `variant_${variantId}`,
      metricValue: JSON.stringify(metrics),
      timestamp: new Date()
    };
    
    await db.insert(websiteMetrics).values(newMetrics);
    
    res.json({
      success: true,
      message: 'A/B test results recorded successfully',
      id: newMetrics.id
    });
  } catch (error) {
    console.error('Error recording A/B test results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record A/B test results',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get A/B test results for a specific page
 * Returns performance metrics for different page variants
 */
router.get('/ab-test/results/:pagePath', [
  param('pagePath')
    .isString()
    .withMessage('Page path must be a string')
    .trim(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { pagePath } = req.params;
    const decodedPath = decodeURIComponent(pagePath);
    
    // Get A/B test results from website metrics table
    const abTestResults = await db.select()
      .from(websiteMetrics)
      .where(and(
        eq(websiteMetrics.pagePath, decodedPath),
        eq(websiteMetrics.metricType, 'ab_test_result')
      ))
      .orderBy(desc(websiteMetrics.timestamp));
    
    if (abTestResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No A/B test results found for this page'
      });
    }
    
    // Group results by variant
    const variants: Record<string, any[]> = {};
    
    abTestResults.forEach(result => {
      const variantId = result.metricName;
      
      if (!variants[variantId]) {
        variants[variantId] = [];
      }
      
      variants[variantId].push({
        id: result.id,
        metrics: JSON.parse(result.metricValue),
        timestamp: result.timestamp
      });
    });
    
    // Compare variants if there are multiple
    let comparison = null;
    
    if (Object.keys(variants).length > 1) {
      try {
        // Format data for AI analysis
        const variantData = Object.entries(variants).map(([variantId, results]) => {
          // Calculate average metrics across all results for this variant
          const avgMetrics = results.reduce((avg: Record<string, number>, result) => {
            const metrics = result.metrics;
            
            Object.keys(metrics).forEach(key => {
              if (typeof metrics[key] === 'number') {
                avg[key] = (avg[key] || 0) + metrics[key];
              }
            });
            
            return avg;
          }, {});
          
          // Calculate averages
          Object.keys(avgMetrics).forEach(key => {
            avgMetrics[key] /= results.length;
          });
          
          return {
            variantId,
            sampleSize: results.length,
            avgMetrics
          };
        });
        
        // Get AI comparison
        const systemPrompt = `You are an expert in A/B test analysis. Provide statistically sound comparisons between different page variants, focusing on key conversion metrics.`;
        
        const userPrompt = `Compare the following A/B test variants for the page ${decodedPath}:
        
        ${JSON.stringify(variantData, null, 2)}
        
        For each metric, determine which variant performs better and by what percentage. Calculate statistical significance where possible. 
        Provide a recommendation on which variant to choose and why.`;
        
        const abComparisonResult = await generateJson<{
          winner: string;
          winningMargin: Record<string, string>;
          statisticalSignificance: boolean;
          confidenceLevel: string;
          recommendation: string;
          additionalInsights: string[];
        }>(userPrompt, {
          model: 'grok-3-mini',
          systemPrompt,
          temperature: 0.2,
          maxTokens: 1000
        });
        
        comparison = abComparisonResult;
      } catch (error) {
        console.error('Error comparing A/B test variants:', error);
        comparison = { error: 'Failed to compare variants' };
      }
    }
    
    res.json({
      success: true,
      pagePath: decodedPath,
      variants,
      comparison,
      totalResults: abTestResults.length
    });
  } catch (error) {
    console.error('Error getting A/B test results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get A/B test results',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get recommended content for a landing page based on engagement data
 * Uses XAI to suggest optimal content based on user behavior
 */
router.get('/content-recommendations/:pagePath', [
  param('pagePath')
    .isString()
    .withMessage('Page path must be a string')
    .trim(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { pagePath } = req.params;
    const decodedPath = decodeURIComponent(pagePath);
    
    // Get engagement data for the page
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const engagementData = await db.select()
      .from(websiteEngagement)
      .where(and(
        like(websiteEngagement.path, `%${decodedPath}%`),
        gt(websiteEngagement.dateCollected, thirtyDaysAgo)
      ))
      .orderBy(desc(websiteEngagement.dateCollected));
    
    // Get conversion data
    const conversionData = await db.select()
      .from(websiteConversions)
      .where(and(
        like(websiteConversions.sourcePath, `%${decodedPath}%`),
        gt(websiteConversions.timestamp, thirtyDaysAgo)
      ))
      .orderBy(desc(websiteConversions.timestamp));
    
    // Get existing content
    const existingContent = await db.select()
      .from(contents)
      .where(eq(contents.status, 'published'))
      .orderBy(desc(contents.publishedAt as any));
    
    // Calculate engagement metrics
    const totalVisits = engagementData.length;
    const avgTimeOnPage = totalVisits > 0 
      ? engagementData.reduce((sum, item) => sum + parseFloat(item.timeOnPage.toString()), 0) / totalVisits 
      : 0;
    
    const conversions = conversionData.length;
    const conversionRate = totalVisits > 0 ? (conversions / totalVisits) * 100 : 0;
    
    // Get content recommendations from XAI
    const systemPrompt = `You are Elevion's AI content optimization expert, specializing in analyzing user engagement data to recommend optimal content for landing pages. Your task is to recommend specific content pieces, headlines, messages, and calls-to-action that would improve engagement and conversion rates based on the data provided.`;
    
    const userPrompt = `Generate content recommendations for the landing page at path "${decodedPath}" based on the following data:
    
    Page performance:
    - Total visits in last 30 days: ${totalVisits}
    - Average time on page: ${avgTimeOnPage.toFixed(2)} seconds
    - Conversion rate: ${conversionRate.toFixed(2)}%
    
    Existing content in the system:
    ${JSON.stringify(existingContent.map(c => ({ 
      id: c.id, 
      title: c.title, 
      type: c.type, 
      wordCount: c.wordCount,
      status: c.status
    })), null, 2)}
    
    Based on this data, provide the following content recommendations:
    
    1. Headline suggestions (3-5 options with reasoning)
    2. Value proposition statements (2-3 options)
    3. Key messages to emphasize
    4. Call-to-action suggestions
    5. Content blocks that should be included
    6. Visual elements to incorporate
    7. Existing content from our library that would be relevant
    
    For each recommendation, include a brief explanation of why it would improve engagement or conversions.`;
    
    const contentRecommendations = await generateJson<{
      headlines: { text: string; reasoning: string }[];
      valuePropositions: { text: string; reasoning: string }[];
      keyMessages: { message: string; rationale: string }[];
      ctaSuggestions: { text: string; placement: string; style: string; rationale: string }[];
      contentBlocks: { type: string; content: string; purpose: string }[];
      visualElements: { type: string; description: string; purpose: string }[];
      recommendedContent: { id: string; title: string; reason: string }[];
    }>(userPrompt, {
      model: 'grok-3',
      systemPrompt,
      temperature: 0.4,
      maxTokens: 2000
    });
    
    res.json({
      success: true,
      pagePath: decodedPath,
      metrics: {
        visits: totalVisits,
        avgTimeOnPage: `${avgTimeOnPage.toFixed(2)} seconds`,
        conversionRate: `${conversionRate.toFixed(2)}%`
      },
      recommendations: contentRecommendations
    });
  } catch (error) {
    console.error('Error getting content recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get content recommendations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Apply optimizations to a landing page
 * Updates a specific landing page variant with optimized content
 */
router.post('/apply-optimization/:pagePath', [
  authMiddleware,
  param('pagePath')
    .isString()
    .withMessage('Page path must be a string')
    .trim(),
  body('optimizations')
    .isObject()
    .withMessage('Optimizations must be an object')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { pagePath } = req.params;
    const { optimizations, variantId = 'default' } = req.body;
    const decodedPath = decodeURIComponent(pagePath);
    
    // Store optimization configuration in website metrics
    const newOptimization = {
      id: uuidv4(),
      pagePath: decodedPath,
      metricType: 'page_optimization',
      metricName: `variant_${variantId}`,
      metricValue: JSON.stringify(optimizations),
      timestamp: new Date()
    };
    
    await db.insert(websiteMetrics).values(newOptimization);
    
    res.json({
      success: true,
      message: 'Optimizations applied successfully',
      id: newOptimization.id,
      pagePath: decodedPath,
      variantId
    });
  } catch (error) {
    console.error('Error applying page optimizations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply page optimizations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get active optimizations for a landing page
 * Returns the current active optimizations for a page
 */
router.get('/active-optimizations/:pagePath', [
  param('pagePath')
    .isString()
    .withMessage('Page path must be a string')
    .trim(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { pagePath } = req.params;
    const { variantId = 'default' } = req.query;
    const decodedPath = decodeURIComponent(pagePath);
    
    // Get the most recent optimization for this page and variant
    const [optimization] = await db.select()
      .from(websiteMetrics)
      .where(and(
        eq(websiteMetrics.pagePath, decodedPath),
        eq(websiteMetrics.metricType, 'page_optimization'),
        eq(websiteMetrics.metricName, `variant_${variantId}`)
      ))
      .orderBy(desc(websiteMetrics.timestamp))
      .limit(1);
    
    if (!optimization) {
      return res.status(404).json({
        success: false,
        message: 'No active optimizations found for this page variant'
      });
    }
    
    res.json({
      success: true,
      pagePath: decodedPath,
      variantId,
      optimizations: JSON.parse(optimization.metricValue),
      appliedAt: optimization.timestamp
    });
  } catch (error) {
    console.error('Error getting active optimizations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active optimizations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;