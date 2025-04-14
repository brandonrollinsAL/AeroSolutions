import { grokApi } from './grok';
import { db } from '../db';
import { performance_logs, performance_metrics } from '@shared/schema';
import { eq, gte, lte, and, desc } from 'drizzle-orm';
import NodeCache from 'node-cache';

// Cache for performance data and recommendations
const performanceCache = new NodeCache({
  stdTTL: 3600, // 1 hour TTL
  checkperiod: 600, // Check every 10 minutes
  maxKeys: 100
});

// Define performance data interface
export interface PerformanceData {
  pageLoadTimes: Record<string, number[]>;
  apiResponseTimes: Record<string, number[]>;
  resourceUsage: {
    memory: number[];
    cpu: number[];
    timestamps: string[];
  };
  errors: {
    count: number;
    types: Record<string, number>;
  };
  slowestEndpoints: { path: string; avgTime: number }[];
  slowestPages: { path: string; avgTime: number }[];
}

// Define optimization recommendation interface
export interface OptimizationRecommendation {
  type: 'frontend' | 'backend' | 'general';
  priority: 'high' | 'medium' | 'low';
  issue: string;
  recommendation: string;
  expectedImpact: string;
  implementationComplexity: 'easy' | 'medium' | 'complex';
  code?: string;
}

/**
 * Retrieve performance data for a specific date range
 * 
 * @param startDate Start date for the data
 * @param endDate End date for the data
 * @returns Performance data for the specified time period
 */
export async function getPerformanceData(startDate: Date, endDate: Date): Promise<PerformanceData> {
  const cacheKey = `performance_data_${startDate.toISOString()}_${endDate.toISOString()}`;
  
  // Check if data is already in cache
  const cachedData = performanceCache.get<PerformanceData>(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  // Get page load times
  const pageLogs = await db.select()
    .from(performance_logs)
    .where(
      and(
        gte(performance_logs.timestamp, startDate),
        lte(performance_logs.timestamp, endDate),
        eq(performance_logs.metricType, 'page_load')
      )
    );

  // Get API response times
  const apiLogs = await db.select()
    .from(performance_logs)
    .where(
      and(
        gte(performance_logs.timestamp, startDate),
        lte(performance_logs.timestamp, endDate),
        eq(performance_logs.metricType, 'api_response')
      )
    );

  // Get resource usage
  const resourceLogs = await db.select()
    .from(performance_logs)
    .where(
      and(
        gte(performance_logs.timestamp, startDate),
        lte(performance_logs.timestamp, endDate),
        eq(performance_logs.metricType, 'resource')
      )
    );

  // Get errors
  const errorLogs = await db.select()
    .from(performance_logs)
    .where(
      and(
        gte(performance_logs.timestamp, startDate),
        lte(performance_logs.timestamp, endDate),
        eq(performance_logs.metricType, 'error')
      )
    );

  // Organize data
  const pageLoadTimes: Record<string, number[]> = {};
  const apiResponseTimes: Record<string, number[]> = {};
  const memory: number[] = [];
  const cpu: number[] = [];
  const timestamps: string[] = [];
  const errorTypes: Record<string, number> = {};

  // Process page load times
  pageLogs.forEach(log => {
    if (log.pageUrl && log.loadTime) {
      if (!pageLoadTimes[log.pageUrl]) {
        pageLoadTimes[log.pageUrl] = [];
      }
      pageLoadTimes[log.pageUrl].push(log.loadTime);
    }
  });

  // Process API response times
  apiLogs.forEach(log => {
    if (log.apiEndpoint && log.responseTime) {
      if (!apiResponseTimes[log.apiEndpoint]) {
        apiResponseTimes[log.apiEndpoint] = [];
      }
      apiResponseTimes[log.apiEndpoint].push(log.responseTime);
    }
  });

  // Process resource usage
  resourceLogs.forEach(log => {
    if (log.memoryUsage !== null) memory.push(log.memoryUsage);
    if (log.cpuUsage !== null) cpu.push(log.cpuUsage);
    if (log.timestamp) timestamps.push(new Date(log.timestamp).toISOString());
  });

  // Process errors
  errorLogs.forEach(log => {
    if (log.errorType) {
      errorTypes[log.errorType] = (errorTypes[log.errorType] || 0) + 1;
    }
  });

  // Calculate slowest endpoints and pages
  const slowestEndpoints = Object.entries(apiResponseTimes)
    .map(([path, times]) => ({
      path,
      avgTime: calculateAverage(times)
    }))
    .sort((a, b) => b.avgTime - a.avgTime)
    .slice(0, 5);

  const slowestPages = Object.entries(pageLoadTimes)
    .map(([path, times]) => ({
      path,
      avgTime: calculateAverage(times)
    }))
    .sort((a, b) => b.avgTime - a.avgTime)
    .slice(0, 5);

  const performanceData: PerformanceData = {
    pageLoadTimes,
    apiResponseTimes,
    resourceUsage: {
      memory,
      cpu,
      timestamps
    },
    errors: {
      count: errorLogs.length,
      types: errorTypes
    },
    slowestEndpoints,
    slowestPages
  };
  
  // Cache the data
  performanceCache.set(cacheKey, performanceData);
  
  return performanceData;
}

/**
 * Generates optimization recommendations based on performance data
 * 
 * @param performanceData The collected performance data
 * @returns A list of optimization recommendations
 */
export async function generateOptimizationRecommendations(
  performanceData: PerformanceData
): Promise<OptimizationRecommendation[]> {
  try {
    const cacheKey = 'performance_recommendations_' + new Date().toISOString().split('T')[0];
    
    // Check if recommendations are already in cache
    const cachedRecommendations = performanceCache.get<OptimizationRecommendation[]>(cacheKey);
    if (cachedRecommendations) {
      return cachedRecommendations;
    }
    
    // Analyze slow pages
    const slowPagesText = performanceData.slowestPages.map(
      p => `${p.path}: ${p.avgTime.toFixed(2)}ms`
    ).join(', ');
    
    // Analyze slow endpoints
    const slowEndpointsText = performanceData.slowestEndpoints.map(
      e => `${e.path}: ${e.avgTime.toFixed(2)}ms`
    ).join(', ');
    
    // Analyze errors
    const errorTypesText = Object.entries(performanceData.errors.types)
      .map(([type, count]) => `${type}: ${count} occurrences`)
      .join(', ');
    
    // Calculate averages
    const avgPageLoadTime = calculateAverageOfAllArrays(performanceData.pageLoadTimes);
    const avgApiResponseTime = calculateAverageOfAllArrays(performanceData.apiResponseTimes);
    const avgMemoryUsage = performanceData.resourceUsage.memory.length > 0
      ? performanceData.resourceUsage.memory.reduce((a, b) => a + b, 0) / performanceData.resourceUsage.memory.length
      : 0;
    const avgCpuUsage = performanceData.resourceUsage.cpu.length > 0
      ? performanceData.resourceUsage.cpu.reduce((a, b) => a + b, 0) / performanceData.resourceUsage.cpu.length
      : 0;
    
    const prompt = `
      You are an expert web performance engineer. Analyze the following performance metrics and provide 3-5 prioritized, specific optimization recommendations.
      
      PERFORMANCE DATA:
      - Average page load time: ${avgPageLoadTime.toFixed(2)}ms
      - Average API response time: ${avgApiResponseTime.toFixed(2)}ms
      - Average memory usage: ${avgMemoryUsage.toFixed(2)}MB
      - Average CPU usage: ${avgCpuUsage.toFixed(2)}%
      - Total errors: ${performanceData.errors.count}
      - Error types: ${errorTypesText || 'None reported'}
      - Slowest pages: ${slowPagesText || 'No data'}
      - Slowest endpoints: ${slowEndpointsText || 'No data'}
      
      For each recommendation, provide the following:
      1. Type (frontend, backend, or general)
      2. Priority (high, medium, low)
      3. Issue description
      4. Specific, actionable recommendation with step-by-step guidance
      5. Expected performance impact
      6. Implementation complexity (easy, medium, complex)
      7. Code sample where appropriate
      
      Respond with JSON in the following format:
      { 
        "recommendations": [
          {
            "type": "frontend|backend|general",
            "priority": "high|medium|low",
            "issue": "Issue description",
            "recommendation": "Detailed recommendation",
            "expectedImpact": "Expected performance improvement",
            "implementationComplexity": "easy|medium|complex",
            "code": "Optional code sample"
          }
        ]
      }
    `;
    
    const result = await grokApi.generateJson<{ recommendations: OptimizationRecommendation[] }>({
      prompt,
      model: 'grok-2-mini',
      temperature: 0.2,
      systemPrompt: "You are an expert performance engineer who specializes in web application optimization. Provide detailed, actionable recommendations based on the performance data provided."
    });
    
    // If no recommendations were generated, return an empty array
    if (!result.recommendations) {
      console.error('No recommendations were generated from AI service');
      return [];
    }
    
    // Cache the recommendations
    performanceCache.set(cacheKey, result.recommendations);
    
    return result.recommendations;
  } catch (error) {
    console.error('Error generating optimization recommendations:', error);
    return [
      {
        type: 'general',
        priority: 'medium',
        issue: 'Error generating AI-powered recommendations',
        recommendation: 'Please try again later or check the system logs for more information.',
        expectedImpact: 'N/A',
        implementationComplexity: 'medium'
      }
    ];
  }
}

/**
 * Analyze specific performance aspects and provide targeted recommendations
 * 
 * @param aspect The performance aspect to analyze ('caching', 'memory', 'rendering', etc.)
 * @param data The relevant performance data for the aspect
 * @returns Targeted recommendations for the specific aspect
 */
export async function analyzePerformanceAspect(
  aspect: string,
  data: PerformanceData
): Promise<{ recommendations: string[], code?: string }> {
  try {
    const cacheKey = `performance_aspect_${aspect}_${new Date().toISOString().split('T')[0]}`;
    
    // Check if analysis is already in cache
    const cachedAnalysis = performanceCache.get<{ recommendations: string[], code?: string }>(cacheKey);
    if (cachedAnalysis) {
      return cachedAnalysis;
    }
    
    // Calculate averages
    const avgPageLoadTime = calculateAverageOfAllArrays(data.pageLoadTimes);
    const avgApiResponseTime = calculateAverageOfAllArrays(data.apiResponseTimes);
    
    let aspectSpecificData = '';
    let systemPrompt = '';
    
    switch (aspect) {
      case 'caching':
        aspectSpecificData = `
          Page load times: ${JSON.stringify(data.pageLoadTimes)}
          API response times: ${JSON.stringify(data.apiResponseTimes)}
        `;
        systemPrompt = "You are a caching and performance expert. Analyze the data and provide specific recommendations for implementing effective caching strategies.";
        break;
        
      case 'memory':
        aspectSpecificData = `
          Memory usage (in MB): ${data.resourceUsage.memory.join(', ')}
          CPU usage (in %): ${data.resourceUsage.cpu.join(', ')}
          Timestamps: ${data.resourceUsage.timestamps.join(', ')}
        `;
        systemPrompt = "You are a memory management expert. Analyze the memory usage data and provide recommendations for reducing memory consumption.";
        break;
        
      case 'rendering':
        aspectSpecificData = `
          Page load times: ${JSON.stringify(data.pageLoadTimes)}
          Slowest pages: ${JSON.stringify(data.slowestPages)}
        `;
        systemPrompt = "You are a frontend rendering optimization expert. Analyze the page load times and provide recommendations for improving rendering performance.";
        break;
        
      case 'api':
        aspectSpecificData = `
          API response times: ${JSON.stringify(data.apiResponseTimes)}
          Slowest endpoints: ${JSON.stringify(data.slowestEndpoints)}
        `;
        systemPrompt = "You are an API optimization expert. Analyze the API response times and provide recommendations for improving API performance.";
        break;
        
      default:
        aspectSpecificData = `
          Page load times: ${JSON.stringify(data.pageLoadTimes)}
          API response times: ${JSON.stringify(data.apiResponseTimes)}
          Memory usage: ${data.resourceUsage.memory.join(', ')}
          CPU usage: ${data.resourceUsage.cpu.join(', ')}
          Errors: ${JSON.stringify(data.errors)}
        `;
        systemPrompt = "You are a web performance expert. Analyze the performance data and provide recommendations for improving overall performance.";
    }
    
    const prompt = `
      Analyze the following performance data related to ${aspect} and provide 3-5 specific, actionable recommendations.
      
      PERFORMANCE DATA:
      - Average page load time: ${avgPageLoadTime.toFixed(2)}ms
      - Average API response time: ${avgApiResponseTime.toFixed(2)}ms
      ${aspectSpecificData}
      
      For each recommendation:
      1. Describe the specific issue based on the data
      2. Provide a detailed, step-by-step solution
      3. Include code examples where appropriate
      
      Format your response as JSON:
      {
        "recommendations": [
          "Detailed recommendation 1",
          "Detailed recommendation 2",
          ...
        ],
        "code": "Sample code that could help implement these recommendations (if applicable)"
      }
    `;
    
    const result = await grokApi.generateJson<{ recommendations: string[], code?: string }>({
      prompt,
      model: 'grok-2-mini',
      temperature: 0.2,
      systemPrompt
    });
    
    // Cache the analysis
    performanceCache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error(`Error analyzing performance aspect '${aspect}':`, error);
    return {
      recommendations: ['Error generating recommendations. Please try again later.']
    };
  }
}

/**
 * Calculate aggregate performance metrics
 * 
 * @param performanceData Raw performance data
 * @returns Calculated aggregate metrics
 */
export function calculatePerformanceMetrics(performanceData: PerformanceData) {
  // Calculate averages
  const avgPageLoadTime = calculateAverageOfAllArrays(performanceData.pageLoadTimes);
  const avgApiResponseTime = calculateAverageOfAllArrays(performanceData.apiResponseTimes);
  const avgMemoryUsage = performanceData.resourceUsage.memory.length > 0
    ? performanceData.resourceUsage.memory.reduce((a, b) => a + b, 0) / performanceData.resourceUsage.memory.length
    : 0;
  const avgCpuUsage = performanceData.resourceUsage.cpu.length > 0
    ? performanceData.resourceUsage.cpu.reduce((a, b) => a + b, 0) / performanceData.resourceUsage.cpu.length
    : 0;
  
  // Calculate trends (if we have enough data points)
  const memoryTrend = performanceData.resourceUsage.memory.length >= 3
    ? calculateTrend(performanceData.resourceUsage.memory)
    : { direction: 'stable', percentChange: 0 };
  
  const cpuTrend = performanceData.resourceUsage.cpu.length >= 3
    ? calculateTrend(performanceData.resourceUsage.cpu)
    : { direction: 'stable', percentChange: 0 };
  
  // Sort error types by occurrence count
  const commonErrors = Object.entries(performanceData.errors.types)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  return {
    avgPageLoadTime,
    avgApiResponseTime,
    totalErrorCount: performanceData.errors.count,
    avgMemoryUsage,
    avgCpuUsage,
    memoryTrend,
    cpuTrend,
    slowestEndpoints: performanceData.slowestEndpoints,
    slowestPages: performanceData.slowestPages,
    commonErrors
  };
}

/**
 * Calculate trend direction and percentage change
 * 
 * @param values Array of numeric values
 * @returns Trend information
 */
function calculateTrend(values: number[]): { direction: 'up' | 'down' | 'stable', percentChange: number } {
  if (values.length < 2) {
    return { direction: 'stable', percentChange: 0 };
  }
  
  // Calculate moving average over last half of values to smooth out noise
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, value) => sum + value, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, value) => sum + value, 0) / secondHalf.length;
  
  const change = secondAvg - firstAvg;
  const percentChange = firstAvg !== 0 ? (change / firstAvg) * 100 : 0;
  
  let direction: 'up' | 'down' | 'stable';
  
  // Only count as a trend if change is significant (>5%)
  if (percentChange > 5) {
    direction = 'up';
  } else if (percentChange < -5) {
    direction = 'down';
  } else {
    direction = 'stable';
  }
  
  return {
    direction,
    percentChange: Math.abs(percentChange)
  };
}

/**
 * Generate a performance report for a specific date range
 * 
 * @param startDate Start date for the report
 * @param endDate End date for the report
 * @param performanceData Performance data for the period
 * @returns Formatted performance report
 */
export async function generatePerformanceReport(
  startDate: Date,
  endDate: Date,
  performanceData: PerformanceData
): Promise<any> {
  try {
    const cacheKey = `performance_report_${startDate.toISOString()}_${endDate.toISOString()}`;
    
    // Check if report is already in cache
    const cachedReport = performanceCache.get(cacheKey);
    if (cachedReport) {
      return cachedReport;
    }
    
    // Calculate metrics
    const metrics = calculatePerformanceMetrics(performanceData);
    
    // Get historical data for comparison
    const historyStartDate = new Date(startDate);
    historyStartDate.setDate(historyStartDate.getDate() - (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Get historical metrics
    const historicalData = await db.select()
      .from(performance_metrics)
      .orderBy(desc(performance_metrics.timestamp))
      .limit(5);
    
    const avgHistoricalPageLoadTime = historicalData.length > 0
      ? historicalData.reduce((sum, m) => sum + Number(m.avgPageLoadTime), 0) / historicalData.length
      : 0;
    
    const pageLoadImprovement = avgHistoricalPageLoadTime > 0
      ? ((avgHistoricalPageLoadTime - metrics.avgPageLoadTime) / avgHistoricalPageLoadTime) * 100
      : 0;
    
    // Generate report with AI analysis
    const prompt = `
      Generate a comprehensive performance report summary based on the following metrics.
      
      CURRENT METRICS (${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}):
      - Average page load time: ${metrics.avgPageLoadTime.toFixed(2)}ms
      - Average API response time: ${metrics.avgApiResponseTime.toFixed(2)}ms
      - Memory usage (avg): ${metrics.avgMemoryUsage.toFixed(2)}MB (${metrics.memoryTrend.direction}, ${metrics.memoryTrend.percentChange.toFixed(1)}%)
      - CPU usage (avg): ${metrics.avgCpuUsage.toFixed(2)}% (${metrics.cpuTrend.direction}, ${metrics.cpuTrend.percentChange.toFixed(1)}%)
      - Total errors: ${metrics.totalErrorCount}
      - Slowest endpoints: ${JSON.stringify(metrics.slowestEndpoints)}
      - Slowest pages: ${JSON.stringify(metrics.slowestPages)}
      
      HISTORICAL COMPARISON:
      - Previous avg page load time: ${avgHistoricalPageLoadTime.toFixed(2)}ms
      - Improvement: ${pageLoadImprovement.toFixed(1)}%
      
      Generate a JSON report with these sections:
      1. Executive summary (brief overview of performance)
      2. Key findings (what stands out, both positive and negative)
      3. Detailed metrics analysis (technical details)
      4. Recommendations (prioritized list of actions)
      5. Conclusion (overall assessment)
      
      Format as JSON:
      {
        "executiveSummary": "Text here",
        "keyFindings": ["finding 1", "finding 2", ...],
        "metricsAnalysis": {
          "frontend": "Text analysis",
          "backend": "Text analysis",
          "resources": "Text analysis"
        },
        "recommendations": ["rec 1", "rec 2", ...],
        "conclusion": "Text here",
        "performanceScore": 85 // 0-100 score
      }
    `;
    
    const report = await grokApi.generateJson({
      prompt,
      model: 'grok-2-mini',
      temperature: 0.3,
      systemPrompt: "You are an expert performance analyst creating a performance report for technical stakeholders. Be data-driven, insightful, and provide actionable recommendations."
    });
    
    // Cache the report
    performanceCache.set(cacheKey, report);
    
    return report;
  } catch (error) {
    console.error('Error generating performance report:', error);
    return {
      executiveSummary: 'Error generating performance report',
      keyFindings: ['Unable to analyze performance data at this time.'],
      metricsAnalysis: {
        frontend: 'Data analysis unavailable',
        backend: 'Data analysis unavailable',
        resources: 'Data analysis unavailable'
      },
      recommendations: ['Please try again later or contact support.'],
      conclusion: 'Performance report generation failed.',
      performanceScore: null
    };
  }
}

/**
 * Clear the performance analytics cache
 */
export function clearPerformanceCache(): void {
  performanceCache.flushAll();
  console.log('Performance analytics cache cleared');
}

/**
 * Helper function to calculate average of all values across all keys in a Record of arrays
 */
function calculateAverageOfAllArrays(data: Record<string, number[]>): number {
  let totalSum = 0;
  let totalCount = 0;
  
  for (const values of Object.values(data)) {
    if (values.length > 0) {
      totalSum += values.reduce((sum, value) => sum + value, 0);
      totalCount += values.length;
    }
  }
  
  return totalCount > 0 ? totalSum / totalCount : 0;
}

/**
 * Helper function to calculate average of values in an array
 */
function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}