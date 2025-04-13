import express from 'express';
import { db } from '../db';
import { callXAI } from '../utils/xaiClient';

const router = express.Router();

/**
 * User behavior analysis endpoint
 * Analyzes user behavior data to identify patterns and insights
 */
router.post('/user-behavior', async (req, res) => {
  try {
    // Get recent user activity logs
    const { rows } = await db.query(`
      SELECT user_id, action, path, timestamp, session_id, device_type, referrer
      FROM user_activity_logs 
      ORDER BY timestamp DESC 
      LIMIT 200
    `);
    
    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No user activity data found'
      });
    }
    
    // Format the data for analysis
    const activityData = JSON.stringify(rows, null, 2);
    
    const response = await callXAI('/chat/completions', {
      model: 'grok-3-latest',
      messages: [{ 
        role: 'user', 
        content: `Analyze this user behavior data and identify patterns, user flows, 
        and potential areas for UI/UX improvements. Consider drop-off points, popular 
        features, and user engagement metrics. Format your response with clear sections:
        
        ${activityData}` 
      }],
    });
    
    res.json({ 
      success: true, 
      insights: response.choices[0].message.content 
    });
  } catch (error: any) {
    console.error('User behavior analysis failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'User behavior analysis failed', 
      error: error.message,
      fallback: {
        insights: "I couldn't analyze the user behavior data at this time, but here are some general UX improvement tips:\n\n" +
          "1. Simplify navigation paths to reduce clicks to conversion\n" +
          "2. Optimize page load times across all device types\n" +
          "3. Identify and fix common drop-off points in your funnel\n" +
          "4. Add clear calls-to-action on key pages\n" +
          "5. Consider A/B testing for important UI elements\n\n" +
          "Please try again later or contact our support team for assistance."
      }
    });
  }
});

/**
 * Conversion optimization endpoint
 * Analyzes conversion funnel data to suggest improvements
 */
router.post('/conversion-optimization', async (req, res) => {
  const { funnelData } = req.body;
  
  if (!funnelData || typeof funnelData !== 'object') {
    return res.status(400).json({ 
      success: false, 
      message: 'Valid funnel data is required' 
    });
  }
  
  try {
    const response = await callXAI('/chat/completions', {
      model: 'grok-3-latest',
      messages: [{ 
        role: 'user', 
        content: `Analyze this conversion funnel data and suggest optimization strategies. 
        Focus on reducing drop-offs, improving conversion rates, and enhancing user experience.
        Provide actionable recommendations:
        
        ${JSON.stringify(funnelData, null, 2)}` 
      }],
    });
    
    res.json({ 
      success: true, 
      recommendations: response.choices[0].message.content 
    });
  } catch (error: any) {
    console.error('Conversion optimization analysis failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Conversion optimization analysis failed', 
      error: error.message,
      fallback: {
        recommendations: "I couldn't analyze the conversion funnel data at this time, but here are some general conversion optimization tips:\n\n" +
          "1. Simplify your checkout or signup process\n" +
          "2. Add trust signals and testimonials near conversion points\n" +
          "3. Implement exit-intent strategies to recover abandoning users\n" +
          "4. Optimize form fields to reduce friction\n" +
          "5. Test different CTAs, button colors, and page layouts\n\n" +
          "Please try again later or contact our support team for assistance."
      }
    });
  }
});

/**
 * Content effectiveness analysis endpoint
 * Evaluates content performance metrics to suggest improvements
 */
router.post('/content-effectiveness', async (req, res) => {
  const { contentData } = req.body;
  
  if (!contentData || typeof contentData !== 'object') {
    return res.status(400).json({ 
      success: false, 
      message: 'Valid content data is required' 
    });
  }
  
  try {
    const response = await callXAI('/chat/completions', {
      model: 'grok-3-latest',
      messages: [{ 
        role: 'user', 
        content: `Analyze this content performance data and suggest improvements.
        Consider engagement metrics, conversion rates, and user feedback.
        Provide specific recommendations for each content piece:
        
        ${JSON.stringify(contentData, null, 2)}` 
      }],
    });
    
    res.json({ 
      success: true, 
      analysis: response.choices[0].message.content 
    });
  } catch (error: any) {
    console.error('Content effectiveness analysis failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Content effectiveness analysis failed', 
      error: error.message,
      fallback: {
        analysis: "I couldn't analyze your content data at this time, but here are some general content optimization tips:\n\n" +
          "1. Focus on clear, benefit-driven headlines\n" +
          "2. Break up long blocks of text with subheadings and bullet points\n" +
          "3. Include relevant calls-to-action throughout your content\n" +
          "4. Incorporate visual elements to increase engagement\n" +
          "5. Ensure your content addresses your audience's key pain points\n\n" +
          "Please try again later or contact our support team for assistance."
      }
    });
  }
});

/**
 * Competitor analysis endpoint
 * Analyzes competitor websites and identifies opportunities
 */
router.post('/competitor-analysis', async (req, res) => {
  const { competitorUrls, competitorData } = req.body;
  
  if ((!competitorUrls || !Array.isArray(competitorUrls)) && 
      (!competitorData || typeof competitorData !== 'object')) {
    return res.status(400).json({ 
      success: false, 
      message: 'Valid competitor URLs or data is required' 
    });
  }
  
  try {
    let prompt = 'Analyze this competitor data and identify strengths, weaknesses, ';
    prompt += 'opportunities, and threats. Suggest strategies to differentiate and compete effectively: ';
    
    if (competitorUrls && Array.isArray(competitorUrls)) {
      prompt += `\n\nCompetitor URLs: ${competitorUrls.join(', ')}`;
    }
    
    if (competitorData && typeof competitorData === 'object') {
      prompt += `\n\nCompetitor Data: ${JSON.stringify(competitorData, null, 2)}`;
    }
    
    const response = await callXAI('/chat/completions', {
      model: 'grok-3-latest',
      messages: [{ role: 'user', content: prompt }],
    });
    
    res.json({ 
      success: true, 
      analysis: response.choices[0].message.content 
    });
  } catch (error: any) {
    console.error('Competitor analysis failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Competitor analysis failed', 
      error: error.message,
      fallback: {
        analysis: "I couldn't analyze the competitor data at this time, but here are some general competitive strategy tips:\n\n" +
          "1. Identify your unique value proposition compared to competitors\n" +
          "2. Look for gaps in competitor offerings that you can fill\n" +
          "3. Consider price positioning and value-based differentiation\n" +
          "4. Analyze competitor marketing messages and channels\n" +
          "5. Monitor customer reviews of competitors for pain points\n\n" +
          "Please try again later or contact our support team for assistance."
      }
    });
  }
});

export default router;