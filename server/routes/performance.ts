import { Router, Request, Response } from 'express';
import { NextFunction } from 'express';
import { db } from '../db';
import { performance_metrics, performance_logs } from '@shared/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { grokApi } from '../utils/grok';
import { addDays, subDays, format } from 'date-fns';
import { 
  generateOptimizationRecommendations, 
  analyzePerformanceAspect,
  generatePerformanceReport,
  clearPerformanceCache
} from '../utils/performanceAnalytics';

const router = Router();

// Middleware to check if user is authenticated and has admin access
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const user = req.user;
  if (!user || !user.roles || !user.roles.includes('admin')) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  
  next();
};

// Log performance metrics
router.post('/log', async (req: Request, res: Response) => {
  try {
    const { 
      pageUrl, 
      loadTime, 
      apiEndpoint,
      responseTime, 
      resourceUsage,
      errorType,
      userId,
      userAgent,
      metricType
    } = req.body;
    
    const sessionId = req.sessionID || 'anonymous';
    
    await db.insert(performance_logs).values({
      timestamp: new Date(),
      pageUrl: pageUrl || null,
      loadTime: loadTime || null,
      apiEndpoint: apiEndpoint || null,
      responseTime: responseTime || null,
      memoryUsage: resourceUsage?.memory || null,
      cpuUsage: resourceUsage?.cpu || null,
      errorType: errorType || null,
      userId: userId || null,
      sessionId,
      userAgent: userAgent || req.headers['user-agent'] || null,
      metricType: metricType || 'general'
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error logging performance metrics:', error);
    res.status(500).json({ error: 'Failed to log performance metrics' });
  }
});

// Get performance recommendations
router.get('/recommendations', isAdmin, async (req: Request, res: Response) => {
  try {
    // Get the date range (default to last 7 days)
    const endDate = new Date();
    const startDate = subDays(endDate, 7);
    
    // Fetch performance data
    const performanceData = await getPerformanceData(startDate, endDate);
    
    // Generate recommendations
    const recommendations = await generateOptimizationRecommendations(performanceData);
    
    res.status(200).json({
      recommendations,
      performanceMetrics: {
        pageLoadTimes: calculateAverages(performanceData.pageLoadTimes),
        apiResponseTimes: calculateAverages(performanceData.apiResponseTimes),
        resourceUsage: {
          average: {
            memory: calculateAverage(performanceData.resourceUsage.memory),
            cpu: calculateAverage(performanceData.resourceUsage.cpu)
          }
        },
        errors: performanceData.errors,
        slowestEndpoints: performanceData.slowestEndpoints.slice(0, 5),
        slowestPages: performanceData.slowestPages.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Error generating performance recommendations:', error);
    res.status(500).json({ error: 'Failed to generate performance recommendations' });
  }
});

// Get detailed analysis for a specific performance aspect
router.get('/analyze/:aspect', isAdmin, async (req: Request, res: Response) => {
  try {
    const { aspect } = req.params;
    const endDate = new Date();
    const startDate = subDays(endDate, parseInt(req.query.days as string) || 7);
    
    const performanceData = await getPerformanceData(startDate, endDate);
    let aspectData: any;
    
    switch (aspect) {
      case 'caching':
        aspectData = {
          apiResponseTimes: performanceData.apiResponseTimes,
          endpoints: performanceData.slowestEndpoints
        };
        break;
      case 'rendering':
        aspectData = {
          pageLoadTimes: performanceData.pageLoadTimes,
          slowestPages: performanceData.slowestPages
        };
        break;
      case 'memory':
        aspectData = {
          memoryUsage: performanceData.resourceUsage.memory,
          timestamps: performanceData.resourceUsage.timestamps
        };
        break;
      case 'api':
        aspectData = {
          responseTimeByEndpoint: performanceData.apiResponseTimes,
          slowestEndpoints: performanceData.slowestEndpoints
        };
        break;
      default:
        aspectData = { message: 'Invalid aspect specified' };
    }
    
    const analysis = await analyzePerformanceAspect(aspect, aspectData);
    
    res.status(200).json({
      aspect,
      analysis,
      data: aspectData
    });
  } catch (error) {
    console.error(`Error analyzing ${req.params.aspect} performance:`, error);
    res.status(500).json({ error: `Failed to analyze ${req.params.aspect} performance` });
  }
});

// Generate a performance report
router.get('/report', isAdmin, async (req: Request, res: Response) => {
  try {
    const endDate = new Date();
    const startDate = subDays(endDate, parseInt(req.query.days as string) || 30);
    
    const performanceData = await getPerformanceData(startDate, endDate);
    const report = await generatePerformanceReport(startDate, endDate, performanceData);
    
    res.status(200).json({
      report,
      period: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(endDate, 'yyyy-MM-dd')
      }
    });
  } catch (error) {
    console.error('Error generating performance report:', error);
    res.status(500).json({ error: 'Failed to generate performance report' });
  }
});

// Clear performance analytics cache
router.post('/clear-cache', isAdmin, (req: Request, res: Response) => {
  try {
    clearPerformanceCache();
    res.status(200).json({ success: true, message: 'Performance analytics cache cleared' });
  } catch (error) {
    console.error('Error clearing performance cache:', error);
    res.status(500).json({ error: 'Failed to clear performance cache' });
  }
});

// Get real-time performance metrics
router.get('/metrics', isAdmin, async (req: Request, res: Response) => {
  try {
    const metrics = await db.select().from(performance_metrics).orderBy(desc(performance_metrics.timestamp)).limit(1);
    
    if (metrics.length === 0) {
      return res.status(404).json({ error: 'No performance metrics found' });
    }
    
    res.status(200).json(metrics[0]);
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
});

// Helper function to get performance data
async function getPerformanceData(startDate: Date, endDate: Date) {
  // Fetch page load times
  const pageLoadLogs = await db.select()
    .from(performance_logs)
    .where(
      and(
        eq(performance_logs.metricType, 'page_load'),
        gte(performance_logs.timestamp, startDate),
        lte(performance_logs.timestamp, endDate)
      )
    );
  
  // Fetch API response times
  const apiResponseLogs = await db.select()
    .from(performance_logs)
    .where(
      and(
        eq(performance_logs.metricType, 'api_response'),
        gte(performance_logs.timestamp, startDate),
        lte(performance_logs.timestamp, endDate)
      )
    );
  
  // Fetch resource usage
  const resourceLogs = await db.select()
    .from(performance_logs)
    .where(
      and(
        eq(performance_logs.metricType, 'resource'),
        gte(performance_logs.timestamp, startDate),
        lte(performance_logs.timestamp, endDate)
      )
    )
    .orderBy(performance_logs.timestamp);
  
  // Fetch error logs
  const errorLogs = await db.select()
    .from(performance_logs)
    .where(
      and(
        eq(performance_logs.metricType, 'error'),
        gte(performance_logs.timestamp, startDate),
        lte(performance_logs.timestamp, endDate)
      )
    );
  
  // Process page load times
  const pageLoadTimes: Record<string, number[]> = {};
  pageLoadLogs.forEach(log => {
    if (log.pageUrl && log.loadTime) {
      if (!pageLoadTimes[log.pageUrl]) {
        pageLoadTimes[log.pageUrl] = [];
      }
      pageLoadTimes[log.pageUrl].push(log.loadTime);
    }
  });
  
  // Process API response times
  const apiResponseTimes: Record<string, number[]> = {};
  apiResponseLogs.forEach(log => {
    if (log.apiEndpoint && log.responseTime) {
      if (!apiResponseTimes[log.apiEndpoint]) {
        apiResponseTimes[log.apiEndpoint] = [];
      }
      apiResponseTimes[log.apiEndpoint].push(log.responseTime);
    }
  });
  
  // Process resource usage
  const memoryUsage: number[] = [];
  const cpuUsage: number[] = [];
  const timestamps: string[] = [];
  
  resourceLogs.forEach(log => {
    if (log.memoryUsage) memoryUsage.push(log.memoryUsage);
    if (log.cpuUsage) cpuUsage.push(log.cpuUsage);
    if (log.timestamp) timestamps.push(format(log.timestamp, 'yyyy-MM-dd HH:mm:ss'));
  });
  
  // Process errors
  const errorTypes: Record<string, number> = {};
  errorLogs.forEach(log => {
    if (log.errorType) {
      errorTypes[log.errorType] = (errorTypes[log.errorType] || 0) + 1;
    }
  });
  
  // Calculate slowest endpoints
  const slowestEndpoints = Object.entries(apiResponseTimes)
    .map(([path, times]) => ({
      path,
      avgTime: times.reduce((sum, time) => sum + time, 0) / times.length
    }))
    .sort((a, b) => b.avgTime - a.avgTime);
  
  // Calculate slowest pages
  const slowestPages = Object.entries(pageLoadTimes)
    .map(([path, times]) => ({
      path,
      avgTime: times.reduce((sum, time) => sum + time, 0) / times.length
    }))
    .sort((a, b) => b.avgTime - a.avgTime);
  
  return {
    pageLoadTimes,
    apiResponseTimes,
    resourceUsage: {
      memory: memoryUsage,
      cpu: cpuUsage,
      timestamps
    },
    errors: {
      count: errorLogs.length,
      types: errorTypes
    },
    slowestEndpoints,
    slowestPages
  };
}

// Helper function to calculate averages from object of arrays
function calculateAverages(data: Record<string, number[]>): Record<string, number> {
  const result: Record<string, number> = {};
  
  Object.entries(data).forEach(([key, values]) => {
    result[key] = calculateAverage(values);
  });
  
  return result;
}

// Helper function to calculate average
function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export default router;