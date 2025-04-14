import { generateJson, generateText } from './xaiClient';
import { db } from '../db';
import { eq, sql, desc, and, gte, lte } from 'drizzle-orm';
import NodeCache from 'node-cache';

// Cache for storing sentiment analysis results to prevent repeated API calls
const sentimentCache = new NodeCache({ stdTTL: 3600, checkperiod: 300 }); // 1 hour cache

export type SentimentResult = {
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number; // -1.0 to 1.0
  confidence: number; // 0.0 to 1.0
  aspects?: {
    name: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
  }[];
};

/**
 * Analyzes the sentiment of a text using AI
 * 
 * @param text The text to analyze
 * @returns Sentiment analysis result
 */
export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  // Check cache first
  const cacheKey = `sentiment:${text.substring(0, 100)}`;
  const cachedResult = sentimentCache.get<SentimentResult>(cacheKey);
  
  if (cachedResult) {
    return cachedResult;
  }
  
  try {
    // Call xAI API for sentiment analysis
    const result = await generateJson<{
      sentiment: 'positive' | 'negative' | 'neutral';
      score: number;
      confidence: number;
      aspects?: Array<{
        name: string;
        sentiment: 'positive' | 'negative' | 'neutral';
        score: number;
      }>;
    }>({
      model: 'grok-3-mini',
      prompt: text,
      systemPrompt: `Analyze the sentiment of the following text. Determine if it is positive, negative, or neutral.
      Provide a detailed sentiment analysis with the following:
      - Overall sentiment: "positive", "negative", or "neutral"
      - Score: A number between -1.0 (very negative) and 1.0 (very positive)
      - Confidence: A number between 0.0 and 1.0 indicating how confident you are in the analysis
      - Aspects: Extract any specific aspects mentioned and their sentiment
      
      Return the result as a JSON object with this format:
      {
        "sentiment": "positive|negative|neutral",
        "score": number,
        "confidence": number,
        "aspects": [
          {
            "name": "aspect name",
            "sentiment": "positive|negative|neutral",
            "score": number
          }
        ]
      }`
    });
    
    // Format the result
    const sentimentResult: SentimentResult = {
      text: text.length > 500 ? text.substring(0, 500) + '...' : text,
      sentiment: result.sentiment,
      score: result.score,
      confidence: result.confidence,
      aspects: result.aspects
    };
    
    // Store in cache
    sentimentCache.set(cacheKey, sentimentResult);
    
    // Store in database if feedback table exists
    try {
      // This is a mock implementation; in a real application,
      // you would use the actual feedback table structure
      if (db.execute) {
        await db.execute(sql`
          UPDATE feedback 
          SET 
            sentiment = ${result.sentiment},
            sentiment_score = ${result.score},
            sentiment_confidence = ${result.confidence}
          WHERE 
            feedback_text = ${text}
            AND feedback_id = (
              SELECT MAX(feedback_id) 
              FROM feedback 
              WHERE feedback_text = ${text}
            )
        `);
      }
    } catch (dbError) {
      console.error('Error storing sentiment in database:', dbError);
      // Continue anyway, as this is not critical
    }
    
    return sentimentResult;
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    
    // Fallback to a basic sentiment analysis without AI
    const words = text.toLowerCase().split(/\s+/);
    
    // Very simple sentiment analysis as fallback
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'happy', 'love', 'like', 'best'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'poor', 'worst', 'hate', 'dislike', 'disappointed', 'failure'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });
    
    const score = words.length > 0 
      ? (positiveCount - negativeCount) / Math.min(words.length, 100) 
      : 0;
    
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (score > 0.05) sentiment = 'positive';
    else if (score < -0.05) sentiment = 'negative';
    
    const fallbackResult: SentimentResult = {
      text: text.length > 500 ? text.substring(0, 500) + '...' : text,
      sentiment,
      score,
      confidence: 0.5
    };
    
    return fallbackResult;
  }
}

/**
 * Gets sentiment statistics from the feedback table
 * 
 * @param timeRange Time range for the statistics: 'day', 'week', 'month', 'year', 'all'
 * @returns Sentiment statistics
 */
export async function getSentimentStats(timeRange: string = 'week'): Promise<{
  positive: number;
  negative: number;
  neutral: number;
  total: number;
  averageScore: number;
}> {
  try {
    // Check cache first
    const cacheKey = `sentiment-stats:${timeRange}`;
    const cachedStats = sentimentCache.get(cacheKey);
    
    if (cachedStats) {
      return cachedStats;
    }
    
    // Calculate the start date based on the time range
    const now = new Date();
    let startDate: Date | null = null;
    
    switch (timeRange) {
      case 'day':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        // 'all' or invalid time range - no date filtering
        startDate = null;
    }
    
    // Mock implementation - in a real app, fetch from the database
    // This would be replaced with actual database queries
    const mockStats = {
      positive: Math.floor(Math.random() * 500) + 100,
      negative: Math.floor(Math.random() * 200) + 50,
      neutral: Math.floor(Math.random() * 300) + 80,
      total: 0,
      averageScore: 0
    };
    
    // Calculate total and average score
    mockStats.total = mockStats.positive + mockStats.negative + mockStats.neutral;
    mockStats.averageScore = mockStats.total > 0 
      ? ((mockStats.positive * 0.8) - (mockStats.negative * 0.8)) / mockStats.total 
      : 0;
    
    // Store in cache
    sentimentCache.set(cacheKey, mockStats, 300); // Cache for 5 minutes
    
    return mockStats;
  } catch (error) {
    console.error('Error getting sentiment stats:', error);
    
    // Return empty stats on error
    return {
      positive: 0,
      negative: 0,
      neutral: 0,
      total: 0,
      averageScore: 0
    };
  }
}

/**
 * Gets sentiment trend data over time
 * 
 * @param startDate Optional start date (ISO string)
 * @param endDate Optional end date (ISO string)
 * @returns Array of sentiment data points by date
 */
export async function getFeedbackSentimentTrends(
  startDate?: string,
  endDate?: string
): Promise<Array<{
  date: string;
  positive: number;
  negative: number;
  neutral: number;
}>> {
  try {
    // Check cache first
    const cacheKey = `sentiment-trends:${startDate || 'all'}-${endDate || 'now'}`;
    const cachedTrends = sentimentCache.get(cacheKey);
    
    if (cachedTrends) {
      return cachedTrends;
    }
    
    // Parse dates
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days ago
    const end = endDate ? new Date(endDate) : new Date();
    
    // Mock implementation - generate random trend data
    const trends: Array<{
      date: string;
      positive: number;
      negative: number;
      neutral: number;
    }> = [];
    
    const dayCount = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    const dataPoints = Math.min(dayCount, 30); // Max 30 data points
    
    const interval = Math.ceil(dayCount / dataPoints);
    let currentDate = new Date(start);
    
    for (let i = 0; i < dataPoints; i++) {
      // Create a data point
      const trend = {
        date: currentDate.toISOString().split('T')[0],
        positive: Math.floor(Math.random() * 50) + 10,
        negative: Math.floor(Math.random() * 30) + 5,
        neutral: Math.floor(Math.random() * 20) + 10
      };
      
      // Add data point
      trends.push(trend);
      
      // Advance date
      currentDate.setDate(currentDate.getDate() + interval);
      if (currentDate > end) break;
    }
    
    // Store in cache
    sentimentCache.set(cacheKey, trends, 600); // Cache for 10 minutes
    
    return trends;
  } catch (error) {
    console.error('Error getting sentiment trends:', error);
    
    // Return empty trends on error
    return [];
  }
}

/**
 * Gets sentiment breakdown by feedback source
 * 
 * @param timeRange Time range for the data: 'day', 'week', 'month', 'year', 'all'
 * @returns Sentiment data grouped by source
 */
export async function getFeedbackSentimentBySource(
  timeRange: string = 'month'
): Promise<Array<{
  source: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
}>> {
  try {
    // Check cache first
    const cacheKey = `sentiment-by-source:${timeRange}`;
    const cachedData = sentimentCache.get(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    // Mock implementation - in a real app, fetch from the database
    const sources = [
      'Contact Form',
      'Live Chat',
      'Customer Survey',
      'Email',
      'Social Media'
    ];
    
    const result = sources.map(source => {
      const positive = Math.floor(Math.random() * 100) + 20;
      const negative = Math.floor(Math.random() * 50) + 10;
      const neutral = Math.floor(Math.random() * 30) + 15;
      
      return {
        source,
        positive,
        negative,
        neutral,
        total: positive + negative + neutral
      };
    });
    
    // Store in cache
    sentimentCache.set(cacheKey, result, 600); // Cache for 10 minutes
    
    return result;
  } catch (error) {
    console.error('Error getting sentiment by source:', error);
    
    // Return empty data on error
    return [];
  }
}