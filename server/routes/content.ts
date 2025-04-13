import express from 'express';
import { callXAI } from '../utils/xaiClient';

const router = express.Router();

// Fetch and filter business-related content
router.get('/fetch-business', async (req, res) => {
  try {
    // Simulated content feed (in production, replace with actual API integration)
    const contentFeed = [
      '5 Tips to Boost Your Small Business Online Presence in 2025',
      'New Web Development Trends for Small Businesses in Q2 2025',
      'Local Sports Team Wins Championship Against Rival',
      'How Small Business Owners Can Leverage AI for Growth',
      'Market Analysis: Small Business Sector Shows 15% Growth',
      'City Council Approves New Traffic System Downtown',
      'Web Design Best Practices for E-commerce Sites in 2025',
      'Small Business Tax Benefits You Might Be Missing',
      'Weather Forecast: Rain Expected This Weekend',
      'Digital Marketing Strategies for Local Businesses'
    ].join('\n');

    // Use xAI to filter and analyze business-related content
    const response = await callXAI('/chat/completions', {
      model: 'grok-3-mini',
      messages: [{ 
        role: 'user', 
        content: `Identify business-related content specifically relevant for small business owners. 
                Return only the filtered content items in a numbered list format, with brief analysis 
                of why each item is relevant to small business owners.\n\nContent to filter:\n${contentFeed}` 
      }],
    });

    res.json({ 
      success: true, 
      businessContent: response.choices[0].message.content,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Content fetching error:', error);
    
    // Fallback content if API fails
    const fallbackContent = `
      1. 5 Tips to Boost Your Small Business Online Presence in 2025
      2. How Small Business Owners Can Leverage AI for Growth
      3. Small Business Tax Benefits You Might Be Missing
      4. Digital Marketing Strategies for Local Businesses
    `;
    
    res.json({ 
      success: false, 
      businessContent: fallbackContent,
      error: error.message,
      fallback: true
    });
  }
});

// Fetch trending business topics based on provided keywords
router.post('/trending-topics', async (req, res) => {
  try {
    const { keywords = [], industry = 'general' } = req.body;
    
    if (!keywords.length) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide at least one keyword'
      });
    }

    // Use xAI to generate trending topics based on keywords and industry
    const prompt = `Generate 5 trending topics for ${industry} business owners based on these keywords: ${keywords.join(', ')}.
                    For each topic provide:
                    1. A compelling headline
                    2. Brief description (25 words max)
                    3. Why it's relevant now`;

    const response = await callXAI('/chat/completions', {
      model: 'grok-3-mini',
      messages: [{ role: 'user', content: prompt }],
    });

    res.json({ 
      success: true, 
      trendingTopics: response.choices[0].message.content,
      keywords,
      industry
    });
  } catch (error) {
    console.error('Trending topics error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate trending topics',
      error: error.message
    });
  }
});

// Get content recommendations based on user preferences
router.get('/recommendations/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // In production, fetch actual user preferences from database
    const mockUserPreferences = {
      interests: ['web development', 'digital marketing', 'small business financing'],
      industry: 'technology',
      businessSize: 'small',
      engagementHistory: ['viewed SEO articles', 'clicked on AI tools', 'bookmarked tax guides']
    };

    // Use xAI to personalize content recommendations
    const prompt = `Based on a user with these preferences:
                    Interests: ${mockUserPreferences.interests.join(', ')}
                    Industry: ${mockUserPreferences.industry}
                    Business Size: ${mockUserPreferences.businessSize}
                    Recent Engagement: ${mockUserPreferences.engagementHistory.join(', ')}
                    
                    Generate 5 personalized content recommendations formatted as JSON that would be valuable for this small business owner.
                    Each recommendation should include: title, description (25 words), contentType (article/guide/tool), and relevanceReason.`;

    // Generate recommendations
    const response = await callXAI('/chat/completions', {
      model: 'grok-3-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    // Parse JSON response
    const recommendations = JSON.parse(response.choices[0].message.content);

    res.json({ 
      success: true, 
      recommendations,
      userId,
      userPreferences: mockUserPreferences,
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate content recommendations',
      error: error.message
    });
  }
});

export default router;