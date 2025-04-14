import { db } from '../db';
import { performance_logs, performance_metrics, performance_recommendations } from '@shared/schema';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import NodeCache from 'node-cache';
import { callXAI, generateJson } from './xaiClient';

// Cache for performance data (5 minute TTL, check period 1 minute)
const performanceCache = new NodeCache({
  stdTTL: 300,
  checkperiod: 60,
  useClones: false
});

/**
 * Interface for performance data used in analysis
 */
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

/**
 * Interface for optimization recommendations
 */
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
  // Try to get from cache first
  const cacheKey = `performance_data_${startDate.toISOString()}_${endDate.toISOString()}`;
  const cachedData = performanceCache.get<PerformanceData>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // Query database for performance logs in the given date range
  const logs = await db.select()
    .from(performance_logs)
    .where(
      and(
        gte(performance_logs.timestamp, startDate),
        lte(performance_logs.timestamp, endDate)
      )
    )
    .orderBy(desc(performance_logs.timestamp));

  // Process logs to extract performance metrics
  const pageLoadTimes: Record<string, number[]> = {};
  const apiResponseTimes: Record<string, number[]> = {};
  const memory: number[] = [];
  const cpu: number[] = [];
  const timestamps: string[] = [];
  const errorTypes: Record<string, number> = {};
  let errorCount = 0;

  // Process each log
  logs.forEach(log => {
    // Track page load times
    if (log.metricType === 'page_load' && log.pageUrl && typeof log.loadTime === 'number') {
      if (!pageLoadTimes[log.pageUrl]) {
        pageLoadTimes[log.pageUrl] = [];
      }
      pageLoadTimes[log.pageUrl].push(log.loadTime);
    }

    // Track API response times
    if (log.metricType === 'api_response' && log.apiEndpoint && typeof log.responseTime === 'number') {
      if (!apiResponseTimes[log.apiEndpoint]) {
        apiResponseTimes[log.apiEndpoint] = [];
      }
      apiResponseTimes[log.apiEndpoint].push(log.responseTime);
    }

    // Track resource usage
    if (log.metricType === 'resource_usage') {
      if (typeof log.memoryUsage === 'number') {
        memory.push(log.memoryUsage);
      }
      if (typeof log.cpuUsage === 'number') {
        cpu.push(log.cpuUsage);
      }
      timestamps.push(log.timestamp.toISOString());
    }

    // Track errors
    if (log.metricType === 'error' && log.errorType) {
      errorCount++;
      if (errorTypes[log.errorType]) {
        errorTypes[log.errorType]++;
      } else {
        errorTypes[log.errorType] = 1;
      }
    }
  });

  // Calculate slowest endpoints and pages
  const slowestEndpoints = calculateSlowestItems(apiResponseTimes);
  const slowestPages = calculateSlowestItems(pageLoadTimes);

  // Assemble performance data
  const performanceData: PerformanceData = {
    pageLoadTimes,
    apiResponseTimes,
    resourceUsage: {
      memory,
      cpu,
      timestamps
    },
    errors: {
      count: errorCount,
      types: errorTypes
    },
    slowestEndpoints,
    slowestPages
  };

  // Cache the result
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
    // Use XAI's powerful analysis capabilities
    const aiResponse = await generateJson({
      model: 'grok-3-latest',
      systemPrompt: `
        You are a performance optimization expert for web applications.
        Analyze the provided performance data and generate specific, actionable recommendations
        to improve application performance. Each recommendation should include:
        1. The type (frontend, backend, or general)
        2. Priority level (high, medium, low) based on potential impact
        3. The specific issue identified
        4. A clear recommendation to fix the issue
        5. Expected impact of the fix
        6. Implementation complexity (easy, medium, complex)
        7. Sample code when applicable (optional)
      `,
      prompt: `
        Please analyze this performance data and generate optimization recommendations:
        
        Page Load Times:
        ${JSON.stringify(performanceData.pageLoadTimes)}
        
        API Response Times:
        ${JSON.stringify(performanceData.apiResponseTimes)}
        
        Resource Usage:
        ${JSON.stringify(performanceData.resourceUsage)}
        
        Errors:
        ${JSON.stringify(performanceData.errors)}
        
        Slowest Endpoints:
        ${JSON.stringify(performanceData.slowestEndpoints)}
        
        Slowest Pages:
        ${JSON.stringify(performanceData.slowestPages)}
        
        Return an array of recommendations in the following format:
        [
          {
            "type": "frontend"|"backend"|"general",
            "priority": "high"|"medium"|"low",
            "issue": "Description of the issue",
            "recommendation": "Specific recommendation to fix the issue",
            "expectedImpact": "Expected impact of the fix",
            "implementationComplexity": "easy"|"medium"|"complex",
            "code": "Sample code if applicable (optional)"
          }
        ]
      `
    });

    // Parse AI response
    try {
      // Ensure the response is an array of recommendations
      const recommendations = ensureRecommendationsFormat(aiResponse);
      return recommendations;
    } catch (error) {
      console.error('Error parsing AI recommendations:', error);
      return generateFallbackRecommendations(performanceData);
    }
  } catch (error) {
    console.error('Error generating optimization recommendations:', error);
    return generateFallbackRecommendations(performanceData);
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
): Promise<any> {
  try {
    // Define aspect-specific analysis prompts
    const aspectPrompts: Record<string, string> = {
      caching: `Analyze potential caching improvements for this application. Focus on:
        - Browser caching strategies
        - API response caching opportunities
        - Static asset optimization
        - Service worker implementation considerations`,
        
      memory: `Analyze memory usage patterns and provide recommendations. Consider:
        - Memory leak identification
        - Large component optimization
        - Garbage collection patterns
        - Resource disposal strategies`,
        
      rendering: `Analyze rendering performance and provide recommendations. Focus on:
        - Component rendering optimization
        - Virtual DOM diffing improvements
        - Layout thrashing prevention
        - Expensive CSS reduction strategies`,
        
      api: `Analyze API performance and provide recommendations. Consider:
        - Request batching opportunities
        - Response size optimization
        - Endpoint consolidation
        - GraphQL vs REST considerations
        - Network payload optimization`,
        
      general: `Provide general performance recommendations considering all aspects of the application.`
    };

    const prompt = aspectPrompts[aspect] || aspectPrompts.general;

    // Use XAI for intelligent analysis
    const analysis = await generateJson({
      model: 'grok-3-latest',
      systemPrompt: `
        You are a performance optimization expert specializing in ${aspect} optimization for web applications.
        Analyze the provided performance data and generate detailed insights and recommendations
        specifically for ${aspect} optimization.
      `,
      prompt: `
        ${prompt}
        
        Here is the performance data:
        
        Page Load Times:
        ${JSON.stringify(data.pageLoadTimes)}
        
        API Response Times:
        ${JSON.stringify(data.apiResponseTimes)}
        
        Resource Usage:
        ${JSON.stringify(data.resourceUsage)}
        
        Errors:
        ${JSON.stringify(data.errors)}
        
        Slowest Endpoints:
        ${JSON.stringify(data.slowestEndpoints)}
        
        Slowest Pages:
        ${JSON.stringify(data.slowestPages)}
        
        Return your analysis as a JSON object with the following structure:
        {
          "findings": [
            {
              "issue": "Description of the issue",
              "impact": "Impact level and description",
              "recommendation": "Specific recommendation",
              "implementationSteps": ["Step 1", "Step 2", ...]
            }
          ],
          "summary": "Overall summary of findings",
          "prioritizedActions": ["Action 1", "Action 2", ...]
        }
      `
    });

    return analysis;
  } catch (error) {
    console.error(`Error analyzing ${aspect} performance:`, error);
    return {
      findings: [
        {
          issue: `Could not complete ${aspect} analysis`,
          impact: "Unknown",
          recommendation: "Try again later or contact system administrator",
          implementationSteps: []
        }
      ],
      summary: "Analysis failed due to technical error",
      prioritizedActions: ["Check system logs for more information"]
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
  // Calculate average page load time across all pages
  const avgPageLoadTime = calculateAverageOfAllArrays(performanceData.pageLoadTimes);
  
  // Calculate average API response time across all endpoints
  const avgApiResponseTime = calculateAverageOfAllArrays(performanceData.apiResponseTimes);
  
  // Calculate average memory and CPU usage
  const avgMemoryUsage = performanceData.resourceUsage.memory.length > 0
    ? performanceData.resourceUsage.memory.reduce((sum, val) => sum + val, 0) / performanceData.resourceUsage.memory.length
    : 0;
    
  const avgCpuUsage = performanceData.resourceUsage.cpu.length > 0
    ? performanceData.resourceUsage.cpu.reduce((sum, val) => sum + val, 0) / performanceData.resourceUsage.cpu.length
    : 0;
  
  // Calculate memory and CPU trends
  const memoryTrend = calculateTrend(performanceData.resourceUsage.memory);
  const cpuTrend = calculateTrend(performanceData.resourceUsage.cpu);
  
  // Get common error types
  const commonErrors = Object.entries(performanceData.errors.types)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type, count]) => ({ type, count }));
  
  return {
    avgPageLoadTime,
    avgApiResponseTime,
    totalErrorCount: performanceData.errors.count,
    avgMemoryUsage,
    avgCpuUsage,
    memoryTrend,
    cpuTrend,
    slowestEndpoints: performanceData.slowestEndpoints.slice(0, 5),
    slowestPages: performanceData.slowestPages.slice(0, 5),
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
  
  // Take the first 25% and last 25% of values to compare trends
  const quarter = Math.max(1, Math.floor(values.length / 4));
  const firstQuarter = values.slice(0, quarter);
  const lastQuarter = values.slice(-quarter);
  
  const firstAvg = firstQuarter.reduce((sum, val) => sum + val, 0) / firstQuarter.length;
  const lastAvg = lastQuarter.reduce((sum, val) => sum + val, 0) / lastQuarter.length;
  
  const difference = lastAvg - firstAvg;
  const percentChange = firstAvg !== 0 ? (difference / firstAvg) * 100 : 0;
  
  let direction: 'up' | 'down' | 'stable';
  if (Math.abs(percentChange) < 5) {
    direction = 'stable';
  } else if (percentChange > 0) {
    direction = 'up';
  } else {
    direction = 'down';
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
    // Calculate metrics
    const metrics = calculatePerformanceMetrics(performanceData);
    
    // Get stored recommendations for this period
    const storedRecommendations = await db.select()
      .from(performance_recommendations)
      .where(
        and(
          gte(performance_recommendations.createdAt, startDate),
          lte(performance_recommendations.createdAt, endDate)
        )
      )
      .orderBy(desc(performance_recommendations.priority));
    
    // Use XAI to generate an executive summary
    const executiveSummary = await callXAI('/chat/completions', {
      model: 'grok-3-latest',
      messages: [
        {
          role: 'system',
          content: `You are a performance analytics expert creating executive summaries of web application performance.
          Your summaries should be concise, highlight key findings, and provide strategic recommendations.`
        },
        {
          role: 'user',
          content: `
            Generate an executive summary of this performance report for the period from 
            ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}.
            
            Performance Metrics:
            - Average Page Load Time: ${metrics.avgPageLoadTime.toFixed(2)}ms
            - Average API Response Time: ${metrics.avgApiResponseTime.toFixed(2)}ms
            - Total Error Count: ${metrics.totalErrorCount}
            - Average Memory Usage: ${metrics.avgMemoryUsage.toFixed(2)}MB
            - Average CPU Usage: ${metrics.avgCpuUsage.toFixed(2)}%
            - Memory Trend: ${metrics.memoryTrend.direction} by ${metrics.memoryTrend.percentChange.toFixed(2)}%
            - CPU Trend: ${metrics.cpuTrend.direction} by ${metrics.cpuTrend.percentChange.toFixed(2)}%
            
            Slowest Endpoints:
            ${metrics.slowestEndpoints.map(e => `- ${e.path}: ${e.avgTime.toFixed(2)}ms`).join('\n')}
            
            Slowest Pages:
            ${metrics.slowestPages.map(p => `- ${p.path}: ${p.avgTime.toFixed(2)}ms`).join('\n')}
            
            Common Errors:
            ${metrics.commonErrors.map(e => `- ${e.type}: ${e.count} occurrences`).join('\n')}
            
            Key Recommendations:
            ${storedRecommendations.slice(0, 3).map(r => `- [${r.priority}] ${r.issue}: ${r.recommendation}`).join('\n')}
            
            Keep the summary concise, professional, and focused on actionable insights.
          `
        }
      ]
    });
    
    const summary = executiveSummary.choices[0].message.content;
    
    // Assemble the full report
    return {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      executiveSummary: summary,
      metrics,
      recommendations: storedRecommendations,
      rawData: {
        pageLoadSampleCount: Object.values(performanceData.pageLoadTimes)
          .reduce((total, times) => total + times.length, 0),
        apiResponseSampleCount: Object.values(performanceData.apiResponseTimes)
          .reduce((total, times) => total + times.length, 0),
        resourceUsageSampleCount: performanceData.resourceUsage.memory.length
      }
    };
  } catch (error) {
    console.error('Error generating performance report:', error);
    // Return a basic report without AI-generated content
    const metrics = calculatePerformanceMetrics(performanceData);
    
    return {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      executiveSummary: "Unable to generate executive summary. Please review metrics directly.",
      metrics,
      recommendations: [],
      rawData: {
        pageLoadSampleCount: Object.values(performanceData.pageLoadTimes)
          .reduce((total, times) => total + times.length, 0),
        apiResponseSampleCount: Object.values(performanceData.apiResponseTimes)
          .reduce((total, times) => total + times.length, 0),
        resourceUsageSampleCount: performanceData.resourceUsage.memory.length
      },
      error: "Failed to generate complete report"
    };
  }
}

/**
 * Clear the performance analytics cache
 */
export function clearPerformanceCache(): void {
  performanceCache.flushAll();
}

// Helper functions

/**
 * Helper function to calculate average of all values across all keys in a Record of arrays
 */
function calculateAverageOfAllArrays(data: Record<string, number[]>): number {
  let totalSum = 0;
  let totalCount = 0;
  
  Object.values(data).forEach(values => {
    values.forEach(value => {
      totalSum += value;
      totalCount++;
    });
  });
  
  return totalCount > 0 ? totalSum / totalCount : 0;
}

/**
 * Helper function to calculate average of values in an array
 */
function calculateAverage(values: number[]): number {
  return values.length > 0
    ? values.reduce((sum, val) => sum + val, 0) / values.length
    : 0;
}

/**
 * Helper function to calculate slowest items from a record of timing arrays
 */
function calculateSlowestItems(data: Record<string, number[]>): { path: string; avgTime: number }[] {
  return Object.entries(data)
    .map(([path, times]) => ({
      path,
      avgTime: calculateAverage(times)
    }))
    .sort((a, b) => b.avgTime - a.avgTime);
}

/**
 * Helper function to ensure AI recommendations are in the correct format
 */
function ensureRecommendationsFormat(response: any): OptimizationRecommendation[] {
  // Check if response is already an array
  if (Array.isArray(response)) {
    return response;
  }
  
  // Check if response has a recommendations property that's an array
  if (response && Array.isArray(response.recommendations)) {
    return response.recommendations;
  }
  
  // Check if we need to parse the response
  if (typeof response === 'string') {
    try {
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      if (parsed && Array.isArray(parsed.recommendations)) {
        return parsed.recommendations;
      }
    } catch (e) {
      throw new Error('Could not parse AI response as JSON');
    }
  }
  
  throw new Error('AI response is not in the expected format');
}

/**
 * Helper function to generate fallback recommendations when AI fails
 */
function generateFallbackRecommendations(data: PerformanceData): OptimizationRecommendation[] {
  const recommendations: OptimizationRecommendation[] = [];
  
  // Add recommendations based on slow pages
  if (data.slowestPages.length > 0) {
    recommendations.push({
      type: 'frontend',
      priority: 'high',
      issue: `Slow page load time for ${data.slowestPages[0].path}`,
      recommendation: 'Implement code splitting, lazy loading for non-critical components, and optimize asset loading',
      expectedImpact: 'Improved user experience with faster initial page load',
      implementationComplexity: 'medium'
    });
  }
  
  // Add recommendations based on slow API endpoints
  if (data.slowestEndpoints.length > 0) {
    recommendations.push({
      type: 'backend',
      priority: 'high',
      issue: `Slow API response for ${data.slowestEndpoints[0].path}`,
      recommendation: 'Add caching for response data, optimize database queries, and add indexes if needed',
      expectedImpact: 'Reduced API response times and improved application responsiveness',
      implementationComplexity: 'medium'
    });
  }
  
  // Add recommendations based on memory usage
  if (data.resourceUsage.memory.length > 0) {
    const memoryTrend = calculateTrend(data.resourceUsage.memory);
    if (memoryTrend.direction === 'up' && memoryTrend.percentChange > 10) {
      recommendations.push({
        type: 'general',
        priority: 'medium',
        issue: `Increasing memory usage (${memoryTrend.percentChange.toFixed(2)}% trend up)`,
        recommendation: 'Check for memory leaks in components and implement proper cleanup in useEffect hooks',
        expectedImpact: 'Stabilized memory usage and improved long-term performance',
        implementationComplexity: 'complex'
      });
    }
  }
  
  // Add recommendation for error handling
  if (data.errors.count > 0) {
    recommendations.push({
      type: 'general',
      priority: 'medium',
      issue: `${data.errors.count} errors detected`,
      recommendation: 'Implement centralized error tracking and monitoring, fix most common errors',
      expectedImpact: 'Reduced error rate and improved application stability',
      implementationComplexity: 'medium'
    });
  }
  
  // Add a general performance recommendation
  recommendations.push({
    type: 'frontend',
    priority: 'low',
    issue: 'General performance optimization',
    recommendation: 'Implement React.memo for expensive components, use virtualization for long lists, and optimize renders',
    expectedImpact: 'Overall performance improvement across the application',
    implementationComplexity: 'medium'
  });
  
  return recommendations;
}