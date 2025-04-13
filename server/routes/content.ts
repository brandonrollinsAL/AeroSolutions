import express from 'express';
import { callXAI } from '../utils/xaiClient';
import { db } from '../db';
import { posts } from '@shared/schema';
import { eq } from 'drizzle-orm';
import NodeCache from 'node-cache';

// Cache for sentiment analysis results (5 minutes TTL)
const sentimentCache = new NodeCache({ stdTTL: 300 });

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

// Auto-publish content articles
router.post('/publish-content', async (req, res) => {
  const { contentItem, title = '' } = req.body;
  
  if (!contentItem) {
    return res.status(400).json({
      success: false,
      message: 'Content item is required'
    });
  }
  
  try {
    // Generate a full blog article from the content item using xAI
    const prompt = `Rewrite this content as a professional Elevion blog article with the following:
                    1. An engaging headline (if not already provided)
                    2. 3-5 subheadings to organize the content
                    3. A brief introduction
                    4. Detailed actionable content under each subheading
                    5. A conclusion with call-to-action
                    6. Use a professional tone appropriate for small business owners
                    
                    Content to expand: ${contentItem}
                    ${title ? `Suggested title: ${title}` : ''}`;
    
    const response = await callXAI('/chat/completions', {
      model: 'grok-3-latest',
      messages: [{ role: 'user', content: prompt }],
    });

    const articleContent = response.choices[0].message.content;
    
    // Extract title from the article
    const titleMatch = articleContent.match(/^#\s+(.+?)(?:\n|$)/) || articleContent.match(/^(.+?)(?:\n|$)/);
    const extractedTitle = titleMatch ? titleMatch[1].trim() : 'Untitled Article';
    
    // Store in the database - this is a simplified version
    // In a real implementation, we would use a proper ORM and schema
    // For now, we'll just return the generated content
    
    // Timestamp for the article
    const now = new Date();
    
    // Sample response with the article data
    res.json({
      success: true,
      message: 'Article generated successfully',
      article: {
        id: `article-${Date.now()}`, // Placeholder ID
        title: extractedTitle,
        content: articleContent,
        author: 'Elevion Team',
        publishedAt: now.toISOString(),
        status: 'published'
      }
    });
  } catch (error: any) {
    console.error('Article publishing failed:', error);
    res.status(500).json({
      success: false,
      message: 'Article publishing failed',
      error: error.message
    });
  }
});

// Blog post sentiment analysis endpoint
router.get('/post-sentiment/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    
    if (!postId) {
      return res.status(400).json({
        success: false,
        message: 'Post ID is required'
      });
    }
    
    // Check cache first for faster response times
    const cacheKey = `post_sentiment_${postId}`;
    const cachedResult = sentimentCache.get(cacheKey);
    
    if (cachedResult) {
      console.log(`[Cache Hit] Returning cached sentiment analysis for post ${postId}`);
      return res.json(cachedResult);
    }
    
    // Fetch the post content from database
    const [post] = await db.select().from(posts).where(eq(posts.id, Number(postId)));
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Extract content for analysis
    const { title, content } = post;
    
    // Analyze sentiment using xAI Grok
    const prompt = `Please analyze the sentiment of this blog post content and title. 
                    Provide the following in JSON format:
                    1. overall_sentiment: A string value of "positive", "negative", or "neutral"
                    2. sentiment_score: A number between -1 (very negative) and 1 (very positive)
                    3. key_emotional_phrases: An array of up to 5 phrases from the content that strongly influenced this sentiment score
                    4. tone_analysis: A brief description of the tone (e.g., "professional", "excited", "concerned")
                    5. topic_sentiment: For each main topic in the content, provide its sentiment (positive/negative/neutral)
                    
                    Title: ${title}
                    
                    Content: ${content.substring(0, 1500)}...`;
    
    const response = await callXAI('/chat/completions', {
      model: 'grok-3-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });
    
    // Parse the sentiment analysis
    const sentimentAnalysis = JSON.parse(response.choices[0].message.content);
    
    // Create the result object
    const result = {
      success: true,
      postId,
      title: post.title,
      sentimentAnalysis,
      timestamp: new Date().toISOString()
    };
    
    // Cache the result
    sentimentCache.set(cacheKey, result);
    
    // Return the sentiment analysis
    res.json(result);
  } catch (error: any) {
    console.error('Post sentiment analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze post sentiment',
      error: error.message
    });
  }
});

export default router;