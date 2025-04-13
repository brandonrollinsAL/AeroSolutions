/**
 * Analytics route handlers for tracking and analyzing user engagement
 */
import express from 'express';
import { db } from '../db';
import { callXAI } from '../utils/xaiClient';
import { users, userSessions } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

/**
 * Get user engagement metrics with AI analysis
 */
router.get('/user-engagement', async (req, res) => {
  try {
    // Fetch session data from database
    const metrics = await db
      .select({
        userId: userSessions.userId,
        sessionDuration: userSessions.sessionDuration,
        startTime: userSessions.startTime,
        endTime: userSessions.endTime
      })
      .from(userSessions)
      .orderBy(userSessions.startTime);
    
    // If no data, return empty analysis
    if (!metrics || metrics.length === 0) {
      return res.json({ 
        analysis: "No user engagement data available for analysis.",
        metrics: []
      });
    }
    
    // Format metric data for AI analysis
    const metricData = metrics.map(m => 
      `User ${m.userId}: ${m.sessionDuration} minutes (${new Date(m.startTime).toLocaleString()} - ${m.endTime ? new Date(m.endTime).toLocaleString() : 'active'})`
    ).join('\n');
    
    // Create a promise that rejects after the timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API request timed out')), 15000);
    });
    
    // Use grok-3-mini for faster response
    const aiResponse = await Promise.race([
      callXAI('/chat/completions', {
        model: 'grok-3-mini',
        messages: [{ 
          role: 'user', 
          content: `Analyze the following user engagement metrics and provide insights:\n${metricData}\n\nProvide concise insights about:
          1. Overall engagement patterns
          2. Time of day patterns (if visible)
          3. Average session duration
          4. Actionable recommendations for improving engagement`
        }],
      }),
      timeoutPromise
    ]);
    
    res.json({ 
      analysis: aiResponse.choices[0].message.content,
      metrics: metrics
    });
  } catch (error: any) {
    console.error('User engagement analysis failed:', error);
    res.status(500).json({ 
      message: 'User engagement analysis failed', 
      error: error.message 
    });
  }
});

/**
 * Predict user churn risk based on user activity data
 */
router.get('/predict-churn', async (req, res) => {
  try {
    // Fetch user data from database with session counts
    const userData = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        lastLogin: users.lastLoginAt,
        createdAt: users.createdAt
      })
      .from(users)
      .orderBy(users.createdAt);
    
    // Get session counts for each user
    const sessionCounts = await db
      .select({
        userId: userSessions.userId,
        count: db.sql`count(${userSessions.id})`
      })
      .from(userSessions)
      .groupBy(userSessions.userId);
    
    // Combine user data with session counts
    const enrichedUserData = userData.map(user => {
      const sessionData = sessionCounts.find(s => s.userId === user.id);
      return {
        ...user,
        sessionCount: sessionData ? Number(sessionData.count) : 0
      };
    });
    
    // If no data, return empty prediction
    if (!enrichedUserData || enrichedUserData.length === 0) {
      return res.json({ 
        predictions: "No user data available for churn prediction.",
        users: []
      });
    }
    
    // Format user data for AI analysis
    const dataString = enrichedUserData.map(u => 
      `User ${u.id} (${u.username}): Last login ${u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'never'}, Account age ${Math.floor((Date.now() - new Date(u.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days, Session count ${u.sessionCount}`
    ).join('\n');
    
    // Create a promise that rejects after the timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API request timed out')), 15000);
    });
    
    // Use grok-3-mini for faster response
    const aiResponse = await Promise.race([
      callXAI('/chat/completions', {
        model: 'grok-3-mini',
        messages: [{ 
          role: 'user', 
          content: `Predict user churn risk based on this data:\n${dataString}\n\nProvide:
          1. Churn risk assessment for each user (high/medium/low)
          2. Overall retention insights
          3. Actionable recommendations to improve retention` 
        }],
      }),
      timeoutPromise
    ]);
    
    res.json({ 
      predictions: aiResponse.choices[0].message.content,
      users: enrichedUserData
    });
  } catch (error: any) {
    console.error('Churn prediction failed:', error);
    res.status(500).json({ 
      message: 'Churn prediction failed', 
      error: error.message 
    });
  }
});

/**
 * Get content effectiveness analytics
 */
router.get('/content-effectiveness', async (req, res) => {
  try {
    // This would typically fetch content view/engagement metrics from database
    // Since we don't have that table yet, we'll use sample data
    const contentMetrics = [
      { contentId: 1, title: 'Web Development Trends', views: 245, avgTimeOnPage: 3.2, conversionRate: 2.1 },
      { contentId: 2, title: 'Small Business Website Guide', views: 187, avgTimeOnPage: 4.7, conversionRate: 3.8 },
      { contentId: 3, title: 'SEO Best Practices', views: 321, avgTimeOnPage: 2.9, conversionRate: 1.5 },
      { contentId: 4, title: 'E-commerce Solutions', views: 196, avgTimeOnPage: 3.6, conversionRate: 4.2 }
    ];
    
    // Format content data for AI analysis
    const contentData = contentMetrics.map(c => 
      `Content: "${c.title}" - Views: ${c.views}, Avg Time on Page: ${c.avgTimeOnPage} minutes, Conversion Rate: ${c.conversionRate}%`
    ).join('\n');
    
    // Create a promise that rejects after the timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API request timed out')), 15000);
    });
    
    // Use grok-3-mini for faster response
    const aiResponse = await Promise.race([
      callXAI('/chat/completions', {
        model: 'grok-3-mini',
        messages: [{ 
          role: 'user', 
          content: `Analyze the following content effectiveness metrics and provide insights:\n${contentData}\n\nProvide concise insights about:
          1. Which content is performing best and why
          2. Content improvement recommendations 
          3. Topic suggestions based on current performance` 
        }],
      }),
      timeoutPromise
    ]);
    
    res.json({ 
      analysis: aiResponse.choices[0].message.content,
      metrics: contentMetrics
    });
  } catch (error: any) {
    console.error('Content effectiveness analysis failed:', error);
    res.status(500).json({ 
      message: 'Content effectiveness analysis failed', 
      error: error.message,
      metrics: []
    });
  }
});

export default router;