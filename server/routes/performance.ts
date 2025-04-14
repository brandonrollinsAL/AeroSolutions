import express, { Request, Response, NextFunction, Router } from 'express';
import { storage } from '../storage';
import { 
  getPerformanceData, 
  generateOptimizationRecommendations, 
  analyzePerformanceAspect, 
  calculatePerformanceMetrics,
  generatePerformanceReport,
  clearPerformanceCache,
  type OptimizationRecommendation 
} from '../utils/performanceAnalytics';
import { body, query, param, validationResult } from 'express-validator';
import { db } from '../db';
import { performance_logs, performance_metrics, performance_recommendations } from '@shared/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';

const router = Router();

// Middleware to check if user is admin
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Log performance metrics (public endpoint)
router.post('/log', async (req: Request, res: Response) => {
  try {
    const {
      metricType,
      timestamp = new Date(),
      pageUrl,
      loadTime,
      apiEndpoint,
      responseTime,
      memoryUsage,
      cpuUsage,
      errorType,
      errorMessage,
      userAgent,
      deviceInfo
    } = req.body;

    // Validate required fields
    if (!metricType) {
      return res.status(400).json({
        success: false,
        message: 'Metric type is required'
      });
    }

    // Associate with user session if available
    const sessionId = req.sessionID;

    // Insert log
    await db.insert(performance_logs).values({
      userId: req.isAuthenticated() ? req.user.id : null,
      sessionId,
      metricType,
      timestamp: new Date(timestamp),
      pageUrl,
      loadTime,
      apiEndpoint,
      responseTime,
      memoryUsage,
      cpuUsage,
      errorType,
      errorMessage,
      userAgent,
      deviceInfo
    });

    res.status(201).json({
      success: true,
      message: 'Performance log recorded'
    });
  } catch (error) {
    console.error('Error logging performance data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record performance log',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get AI-powered optimization recommendations
router.get('/recommendations', isAdmin, async (req: Request, res: Response) => {
  try {
    // Parse date range (defaults to last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    if (req.query.startDate) {
      startDate.setTime(Date.parse(req.query.startDate as string));
    }
    
    if (req.query.endDate) {
      endDate.setTime(Date.parse(req.query.endDate as string));
    }

    // Get performance data
    const performanceData = await getPerformanceData(startDate, endDate);
    
    // Generate recommendations
    const recommendations = await generateOptimizationRecommendations(performanceData);
    
    // Store recommendations in database
    const storedRecommendations = [];
    for (const rec of recommendations) {
      const [inserted] = await db.insert(performance_recommendations).values({
        type: rec.type,
        priority: rec.priority,
        issue: rec.issue,
        recommendation: rec.recommendation,
        expectedImpact: rec.expectedImpact,
        implementationComplexity: rec.implementationComplexity,
        code: rec.code || null,
        implementedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      storedRecommendations.push(inserted);
    }
    
    res.status(200).json({
      success: true,
      recommendations: storedRecommendations,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating optimization recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate optimization recommendations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get AI analysis for a specific performance aspect
router.get('/analyze/:aspect', isAdmin, async (req: Request, res: Response) => {
  try {
    const { aspect } = req.params;
    
    // Validate aspect
    const validAspects = ['caching', 'memory', 'rendering', 'api', 'general'];
    if (!validAspects.includes(aspect)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid performance aspect',
        validAspects
      });
    }
    
    // Parse date range (defaults to last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    if (req.query.startDate) {
      startDate.setTime(Date.parse(req.query.startDate as string));
    }
    
    if (req.query.endDate) {
      endDate.setTime(Date.parse(req.query.endDate as string));
    }
    
    // Get performance data
    const performanceData = await getPerformanceData(startDate, endDate);
    
    // Analyze the specific aspect
    const analysis = await analyzePerformanceAspect(aspect, performanceData);
    
    res.status(200).json({
      success: true,
      aspect,
      analysis,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
  } catch (error) {
    console.error(`Error analyzing performance aspect:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze performance aspect',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get comprehensive performance report
router.get('/report', isAdmin, async (req: Request, res: Response) => {
  try {
    // Parse date range (defaults to last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    if (req.query.startDate) {
      startDate.setTime(Date.parse(req.query.startDate as string));
    }
    
    if (req.query.endDate) {
      endDate.setTime(Date.parse(req.query.endDate as string));
    }
    
    // Get performance data
    const performanceData = await getPerformanceData(startDate, endDate);
    
    // Generate report
    const report = await generatePerformanceReport(startDate, endDate, performanceData);
    
    res.status(200).json({
      success: true,
      report,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating performance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate performance report',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear cache (admin only)
router.post('/clear-cache', isAdmin, (req: Request, res: Response) => {
  try {
    clearPerformanceCache();
    
    res.status(200).json({
      success: true,
      message: 'Performance cache cleared'
    });
  } catch (error) {
    console.error('Error clearing performance cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear performance cache',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get aggregate performance metrics
router.get('/metrics', isAdmin, async (req: Request, res: Response) => {
  try {
    // Parse date range (defaults to last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    if (req.query.startDate) {
      startDate.setTime(Date.parse(req.query.startDate as string));
    }
    
    if (req.query.endDate) {
      endDate.setTime(Date.parse(req.query.endDate as string));
    }
    
    // Get performance data
    const performanceData = await getPerformanceData(startDate, endDate);
    
    // Calculate metrics
    const metrics = calculatePerformanceMetrics(performanceData);
    
    // Store the metrics in database for historical tracking
    await db.insert(performance_metrics).values({
      timestamp: new Date(),
      avgPageLoadTime: metrics.avgPageLoadTime,
      avgApiResponseTime: metrics.avgApiResponseTime,
      totalErrorCount: metrics.totalErrorCount,
      avgMemoryUsage: metrics.avgMemoryUsage,
      avgCpuUsage: metrics.avgCpuUsage,
      memoryTrend: JSON.stringify(metrics.memoryTrend),
      cpuTrend: JSON.stringify(metrics.cpuTrend),
      slowestEndpoints: JSON.stringify(metrics.slowestEndpoints),
      slowestPages: JSON.stringify(metrics.slowestPages),
      commonErrors: JSON.stringify(metrics.commonErrors)
    });
    
    res.status(200).json({
      success: true,
      metrics,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
  } catch (error) {
    console.error('Error retrieving performance metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve performance metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;