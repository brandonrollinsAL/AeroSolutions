import { callXAI, generateJson } from './xaiClient';
import { db } from '../db';
import { logs, feedback } from '@shared/schema';
import { eq, and, desc, gt } from 'drizzle-orm';
import NodeCache from 'node-cache';

// Cache sentiment analysis results for 24 hours
const sentimentCache = new NodeCache({ stdTTL: 86400, checkperiod: 120 });

// Sentiment score types
export type SentimentScore = {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number; // 0-1 for confidence
  topics: string[];
  urgency: 'low' | 'medium' | 'high';
  recommendedAction?: string;
}

/**
 * Analyzes the sentiment of text using XAI API
 * @param text The text to analyze
 * @returns Sentiment analysis result
 */
export async function analyzeSentiment(text: string): Promise<SentimentScore> {
  // Check if we have a cached result
  const cacheKey = `sentiment_${Buffer.from(text.substring(0, 100)).toString('base64')}`;
  const cachedResult = sentimentCache.get<SentimentScore>(cacheKey);
  
  if (cachedResult) {
    console.log('Using cached sentiment analysis');
    return cachedResult;
  }
  
  try {
    const sentiment = await generateJson<SentimentScore>({
      model: 'grok-3-mini',
      prompt: `
        Please analyze the following text for sentiment and return a JSON object with the following fields:
        - sentiment: (positive, negative, or neutral)
        - score: (a number from 0 to 1 indicating confidence)
        - topics: (an array of topics mentioned in the text)
        - urgency: (low, medium, or high, based on whether this requires immediate attention)
        - recommendedAction: (optional suggestion for how to respond)
        
        Text to analyze: "${text}"
      `,
      systemPrompt: `You are an expert sentiment analysis system. Analyze the provided text objectively and return a structured JSON result.
      Pay special attention to customer frustration indicators, urgency, and actionable feedback.
      For urgency: 
      - high: serious issues affecting user experience or security
      - medium: functional issues that should be addressed soon
      - low: minor suggestions or neutral/positive feedback
      Format topics as specific, concise phrases identifying what the feedback is about (e.g., "website speed", "checkout process", "customer support").`
    });
    
    // Cache the result
    sentimentCache.set(cacheKey, sentiment);
    
    return sentiment;
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    
    // Return a default neutral sentiment if analysis fails
    return {
      sentiment: 'neutral',
      score: 0.5,
      topics: ['unable to determine'],
      urgency: 'low'
    };
  }
}

/**
 * Analyzes feedback sentiment in batches
 * @param limit The maximum number of unanalyzed feedback items to process
 * @returns The number of processed items
 */
export async function processPendingFeedbackSentiment(limit: number = 50): Promise<number> {
  try {
    // Get feedback items without sentiment analysis
    const pendingFeedback = await db.select()
      .from(feedback)
      .where(eq(feedback.sentimentProcessed, false))
      .limit(limit);
    
    if (pendingFeedback.length === 0) {
      return 0;
    }
    
    console.log(`Processing sentiment for ${pendingFeedback.length} feedback items`);
    
    let processedCount = 0;
    
    for (const item of pendingFeedback) {
      try {
        // Combine feedback content for analysis
        const textToAnalyze = `${item.title || ''} ${item.content}`;
        
        // Analyze sentiment
        const sentiment = await analyzeSentiment(textToAnalyze);
        
        // Update the feedback item with sentiment data
        await db.update(feedback)
          .set({
            sentimentProcessed: true,
            sentimentScore: sentiment.score,
            sentimentLabel: sentiment.sentiment,
            sentimentTopics: sentiment.topics,
            sentimentUrgency: sentiment.urgency,
            sentimentRecommendedAction: sentiment.recommendedAction,
            updatedAt: new Date()
          })
          .where(eq(feedback.id, item.id));
        
        // Log high urgency feedback for admin review
        if (sentiment.urgency === 'high') {
          await db.insert(logs).values({
            message: `High urgency feedback detected: ${item.title}`,
            level: 'alert',
            source: 'sentiment-analysis',
            context: {
              feedbackId: item.id,
              sentiment: sentiment,
              feedbackContent: item.content.substring(0, 100) + (item.content.length > 100 ? '...' : '')
            },
            timestamp: new Date()
          });
        }
        
        processedCount++;
      } catch (error) {
        console.error(`Error processing sentiment for feedback ID ${item.id}:`, error);
        
        // Mark as processed to avoid repeated failures
        await db.update(feedback)
          .set({
            sentimentProcessed: true,
            updatedAt: new Date()
          })
          .where(eq(feedback.id, item.id));
      }
    }
    
    return processedCount;
  } catch (error) {
    console.error('Error processing feedback sentiment:', error);
    return 0;
  }
}

/**
 * Gets sentiment trend analysis for a specific timeframe
 * @param days Number of days to analyze
 * @returns Sentiment trend analysis
 */
export async function getSentimentTrends(days: number = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    // Get all sentiment-processed feedback from the period
    const feedbackItems = await db.select({
      id: feedback.id,
      createdAt: feedback.createdAt,
      sentimentLabel: feedback.sentimentLabel,
      sentimentScore: feedback.sentimentScore,
      sentimentTopics: feedback.sentimentTopics,
      sentimentUrgency: feedback.sentimentUrgency
    })
    .from(feedback)
    .where(
      and(
        eq(feedback.sentimentProcessed, true),
        gt(feedback.createdAt, cutoffDate)
      )
    )
    .orderBy(desc(feedback.createdAt));
    
    if (feedbackItems.length === 0) {
      return {
        total: 0,
        positivePercentage: 0,
        negativePercentage: 0,
        neutralPercentage: 0,
        topUrgentTopics: [],
        topPositiveTopics: [],
        trendByDay: []
      };
    }
    
    // Calculate overall statistics
    const sentimentCounts = {
      positive: 0,
      negative: 0,
      neutral: 0,
      total: feedbackItems.length
    };
    
    // Track topics by sentiment
    const topicsByUrgency: Record<string, { count: number, urgency: string }> = {};
    const topicsByPositive: Record<string, number> = {};
    
    // Group feedback by day for trend analysis
    const feedbackByDay: Record<string, { date: string, positive: number, negative: number, neutral: number }> = {};
    
    for (const item of feedbackItems) {
      // Count by sentiment
      if (item.sentimentLabel) {
        sentimentCounts[item.sentimentLabel]++;
      } else {
        sentimentCounts.neutral++;
      }
      
      // Track topics
      if (Array.isArray(item.sentimentTopics)) {
        for (const topic of item.sentimentTopics) {
          // Track urgent topics
          if (item.sentimentUrgency === 'high' || item.sentimentUrgency === 'medium') {
            if (!topicsByUrgency[topic]) {
              topicsByUrgency[topic] = { count: 0, urgency: item.sentimentUrgency };
            }
            topicsByUrgency[topic].count++;
          }
          
          // Track positive topics
          if (item.sentimentLabel === 'positive') {
            topicsByPositive[topic] = (topicsByPositive[topic] || 0) + 1;
          }
        }
      }
      
      // Group by day for trend analysis
      const dateStr = item.createdAt.toISOString().split('T')[0];
      if (!feedbackByDay[dateStr]) {
        feedbackByDay[dateStr] = { date: dateStr, positive: 0, negative: 0, neutral: 0 };
      }
      
      if (item.sentimentLabel) {
        feedbackByDay[dateStr][item.sentimentLabel]++;
      } else {
        feedbackByDay[dateStr].neutral++;
      }
    }
    
    // Sort topics by count and get top 5
    const topUrgentTopics = Object.entries(topicsByUrgency)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([topic, data]) => ({
        topic,
        count: data.count,
        urgency: data.urgency
      }));
    
    const topPositiveTopics = Object.entries(topicsByPositive)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count]) => ({
        topic,
        count
      }));
    
    // Convert daily trends to array and sort by date
    const trendByDay = Object.values(feedbackByDay).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return {
      total: sentimentCounts.total,
      positivePercentage: Math.round((sentimentCounts.positive / sentimentCounts.total) * 100),
      negativePercentage: Math.round((sentimentCounts.negative / sentimentCounts.total) * 100),
      neutralPercentage: Math.round((sentimentCounts.neutral / sentimentCounts.total) * 100),
      topUrgentTopics,
      topPositiveTopics,
      trendByDay
    };
  } catch (error) {
    console.error('Error getting sentiment trends:', error);
    throw error;
  }
}