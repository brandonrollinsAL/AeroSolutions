import { grokApi } from './grok';
import { addDays, format } from 'date-fns';
import NodeCache from 'node-cache';

// Cache performance recommendations with a 1-hour TTL
const performanceCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

interface PerformanceData {
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

interface OptimizationRecommendation {
  type: 'frontend' | 'backend' | 'general';
  priority: 'high' | 'medium' | 'low';
  issue: string;
  recommendation: string;
  expectedImpact: string;
  implementationComplexity: 'easy' | 'medium' | 'complex';
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
  // Check if we have cached recommendations
  const cacheKey = 'optimization_recommendations';
  const cachedRecommendations = performanceCache.get<OptimizationRecommendation[]>(cacheKey);
  
  if (cachedRecommendations) {
    console.log('Using cached optimization recommendations');
    return cachedRecommendations;
  }
  
  try {
    // Generate analytics with Grok AI
    const analysisPrompt = `
      You are an expert web performance engineer specializing in optimizing React and Node.js applications.
      Analyze the following performance data and provide specific, actionable recommendations for improvement.
      
      For each recommendation, indicate:
      1. The type (frontend, backend, or general)
      2. Priority (high, medium, low)
      3. The specific issue
      4. A detailed technical recommendation
      5. Expected impact
      6. Implementation complexity
      
      Here's the performance data:
      Page Load Times (by page in ms): ${JSON.stringify(performanceData.pageLoadTimes)}
      API Response Times (by endpoint in ms): ${JSON.stringify(performanceData.apiResponseTimes)}
      Resource Usage: 
        - Memory (MB): ${JSON.stringify(performanceData.resourceUsage.memory)}
        - CPU (%): ${JSON.stringify(performanceData.resourceUsage.cpu)}
      Errors: ${JSON.stringify(performanceData.errors)}
      Slowest Endpoints: ${JSON.stringify(performanceData.slowestEndpoints)}
      Slowest Pages: ${JSON.stringify(performanceData.slowestPages)}
      
      Focus on providing 5-10 specific, actionable recommendations that would have the greatest performance impact.
      Format as JSON array with objects containing: type, priority, issue, recommendation, expectedImpact, implementationComplexity.
    `;
    
    const recommendations = await grokApi.generateJson<OptimizationRecommendation[]>({
      prompt: analysisPrompt,
      model: 'grok-3-mini',
      temperature: 0.2,
      maxTokens: 2000,
    });
    
    // Cache the recommendations
    performanceCache.set(cacheKey, recommendations);
    
    return recommendations;
  } catch (error) {
    console.error('Failed to generate optimization recommendations:', error);
    
    // Return default recommendations if AI generation fails
    return [
      {
        type: 'frontend',
        priority: 'high',
        issue: 'Long page load times',
        recommendation: 'Implement code splitting and lazy loading for components',
        expectedImpact: 'Reduced initial load time by 30-40%',
        implementationComplexity: 'medium'
      },
      {
        type: 'backend',
        priority: 'high',
        issue: 'Slow API response times',
        recommendation: 'Implement response caching with appropriate TTL values',
        expectedImpact: 'Up to 80% reduction in response time for cached routes',
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
  data: any
): Promise<{ recommendations: string[], code?: string }> {
  const cacheKey = `aspect_${aspect}_${JSON.stringify(data).slice(0, 100)}`;
  const cachedAnalysis = performanceCache.get(cacheKey);
  
  if (cachedAnalysis) {
    return cachedAnalysis;
  }
  
  try {
    const analysisPrompt = `
      As an expert in web application performance optimization, analyze the following ${aspect}-related 
      performance data and provide 3-5 specific recommendations to improve it.
      
      ${aspect} data: ${JSON.stringify(data)}
      
      If relevant, also provide a code snippet example implementing one of your key recommendations.
      Format your response as JSON with: { recommendations: string[], code?: string }
    `;
    
    const analysis = await grokApi.generateJson<{ recommendations: string[], code?: string }>({
      prompt: analysisPrompt,
      model: 'grok-3-mini',
      temperature: 0.3,
      maxTokens: 1500,
    });
    
    performanceCache.set(cacheKey, analysis);
    return analysis;
  } catch (error) {
    console.error(`Failed to analyze ${aspect} performance:`, error);
    return {
      recommendations: [
        `Consider implementing ${aspect}-specific optimizations based on your application structure.`,
        `Review current ${aspect} patterns and identify bottlenecks.`
      ]
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
  // Calculate average page load times
  const avgPageLoadTimes: Record<string, number> = {};
  Object.entries(performanceData.pageLoadTimes).forEach(([page, times]) => {
    avgPageLoadTimes[page] = times.reduce((sum, time) => sum + time, 0) / times.length;
  });

  // Calculate average API response times
  const avgApiResponseTimes: Record<string, number> = {};
  Object.entries(performanceData.apiResponseTimes).forEach(([endpoint, times]) => {
    avgApiResponseTimes[endpoint] = times.reduce((sum, time) => sum + time, 0) / times.length;
  });

  // Calculate resource usage trends
  const memoryUsageTrend = calculateTrend(performanceData.resourceUsage.memory);
  const cpuUsageTrend = calculateTrend(performanceData.resourceUsage.cpu);

  return {
    avgPageLoadTimes,
    avgApiResponseTimes,
    resourceUsageTrends: {
      memory: memoryUsageTrend,
      cpu: cpuUsageTrend
    },
    errorRate: performanceData.errors.count,
    mostCommonErrors: Object.entries(performanceData.errors.types)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type, count]) => ({ type, count }))
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

  // Calculate moving average for the first and second half
  const half = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, half);
  const secondHalf = values.slice(-half);
  
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
  
  const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;
  
  let direction: 'up' | 'down' | 'stable';
  if (percentChange > 5) {
    direction = 'up';
  } else if (percentChange < -5) {
    direction = 'down';
  } else {
    direction = 'stable';
  }
  
  return { direction, percentChange: Math.abs(percentChange) };
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
): Promise<string> {
  const cacheKey = `report_${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}`;
  const cachedReport = performanceCache.get<string>(cacheKey);
  
  if (cachedReport) {
    return cachedReport;
  }
  
  try {
    const metrics = calculatePerformanceMetrics(performanceData);
    
    const reportPrompt = `
      Generate a comprehensive performance report for a web application from ${format(startDate, 'MMM d, yyyy')} 
      to ${format(endDate, 'MMM d, yyyy')} based on the following metrics:
      
      Average Page Load Times: ${JSON.stringify(metrics.avgPageLoadTimes)}
      Average API Response Times: ${JSON.stringify(metrics.avgApiResponseTimes)}
      Resource Usage Trends:
        - Memory: ${metrics.resourceUsageTrends.memory.direction} by ${metrics.resourceUsageTrends.memory.percentChange.toFixed(2)}%
        - CPU: ${metrics.resourceUsageTrends.cpu.direction} by ${metrics.resourceUsageTrends.cpu.percentChange.toFixed(2)}%
      Error Rate: ${metrics.errorRate} errors
      Most Common Errors: ${JSON.stringify(metrics.mostCommonErrors)}
      Slowest Endpoints: ${JSON.stringify(performanceData.slowestEndpoints)}
      Slowest Pages: ${JSON.stringify(performanceData.slowestPages)}
      
      Format the report with these sections:
      1. Executive Summary
      2. Key Performance Metrics
      3. Areas of Concern
      4. Recommended Actions
      5. Expected Outcomes
      
      Be specific and technical, but also explain the business impact of these performance metrics. Format as markdown.
    `;
    
    const report = await grokApi.generateText({
      prompt: reportPrompt,
      model: 'grok-3',
      temperature: 0.4,
      maxTokens: 2500,
    });
    
    performanceCache.set(cacheKey, report, 86400); // Cache for 24 hours
    
    return report;
  } catch (error) {
    console.error('Failed to generate performance report:', error);
    return `
      # Performance Report (${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')})
      
      ## Executive Summary
      
      This report contains automatically calculated performance metrics for the specified period.
      
      ## Key Performance Metrics
      
      - Slowest Pages: ${performanceData.slowestPages.map(p => `${p.path}: ${p.avgTime}ms`).join(', ')}
      - Slowest Endpoints: ${performanceData.slowestEndpoints.map(e => `${e.path}: ${e.avgTime}ms`).join(', ')}
      - Error Count: ${performanceData.errors.count}
      
      ## Recommended Actions
      
      1. Implement caching for frequently accessed data
      2. Optimize database queries for slow endpoints
      3. Implement code splitting for frontend components
    `;
  }
}

/**
 * Clear the performance analytics cache
 */
export function clearPerformanceCache(): void {
  performanceCache.flushAll();
  console.log('Performance analytics cache cleared');
}