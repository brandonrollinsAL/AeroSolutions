import express, { Response, Request as ExpressRequest } from "express";
import { db } from "../db";
import { callXAI } from "../utils/xaiClient";
import { posts, users, contentViewMetrics, articleEngagement } from "@shared/schema";
import { eq, desc, sql, and, asc } from "drizzle-orm";
import NodeCache from "node-cache";

// Extended request interface with authentication
interface Request extends ExpressRequest {
  isAuthenticated(): boolean;
  user?: any;
}

// Cache for feed results to improve performance
const feedCache = new NodeCache({
  stdTTL: 600, // 10 minutes
  checkperiod: 120, // Check for expired keys every 2 minutes
  maxKeys: 100
});

/**
 * Helper function to update feed cache
 */
function updateFeedCache(key: string, data: any, ttl: number = 600) {
  feedCache.set(key, data, ttl);
}

/**
 * Feed route handlers for optimized content delivery
 */
export const registerFeedRoutes = (app: express.Express) => {
  // Rank posts for a specific user based on their preferences
  app.get("/api/feed/rank-posts/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      // Get latest posts from the database
      const recentPosts = await db.select()
        .from(posts)
        .orderBy(posts.createdAt)
        .limit(50);
        
      if (recentPosts.length === 0) {
        return res.json({ 
          rankedPosts: [],
          message: "No posts available to rank" 
        });
      }
      
      // Get user preferences
      const [userPrefs] = await db.select()
        .from(users)
        .where(eq(users.id, parseInt(userId)))
        .limit(1);
      
      const preferences = userPrefs?.preferences || "business growth, web development, small business";
      
      // Format post data for xAI
      const postData = recentPosts.map(p => `Post ${p.id}: ${p.content}`).join('\n');
      
      // Call xAI to rank posts
      try {
        const response = await callXAI('/chat/completions', {
          model: 'grok-3-mini',
          messages: [{ 
            role: 'user', 
            content: `You are a content recommendation system for Elevion web development company. 
            Rank these posts for a user with preferences: "${preferences}".
            Focus on relevance to small business owners and web development needs.
            Return a JSON array with post IDs in ranked order, with the most relevant first.
            Example format: [23, 15, 7, 42] where numbers are post IDs.
            
            Posts to rank:
            ${postData}`
          }],
          response_format: { type: "json_object" }
        });
        
        let rankedPosts = [];
        try {
          // Parse the ranked post IDs
          const content = JSON.parse(response.choices[0].message.content);
          rankedPosts = content.rankedPosts || content.ranked_posts || content;
          
          // If we got back just an array, ensure it's valid
          if (Array.isArray(rankedPosts)) {
            // Filter to ensure all IDs exist in our original posts
            rankedPosts = rankedPosts.filter(id => 
              recentPosts.some(post => post.id === id)
            );
          } else {
            // Default to original order if response format is unexpected
            rankedPosts = recentPosts.map(p => p.id);
          }
        } catch (parseError) {
          console.error("Error parsing xAI response:", parseError);
          // Fall back to original order
          rankedPosts = recentPosts.map(p => p.id);
        }
        
        // Return ranked posts with full content
        const rankedPostsWithContent = rankedPosts.map(postId => {
          const post = recentPosts.find(p => p.id === postId);
          return post || null;
        }).filter(Boolean);
        
        res.json({
          success: true,
          rankedPosts: rankedPostsWithContent,
          userPreferences: preferences
        });
      } catch (xaiError) {
        console.error("xAI ranking error:", xaiError);
        // Fall back to chronological order if xAI fails
        res.json({
          success: true,
          rankedPosts: recentPosts,
          fallback: true,
          message: "Using chronological order due to ranking service unavailability"
        });
      }
    } catch (error) {
      console.error("Error ranking posts:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to rank posts",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Get personalized feed for the current authenticated user
  app.get("/api/feed/personalized", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const userId = req.user.id;
      
      // Get user preferences
      const [userPrefs] = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      const preferences = userPrefs?.preferences || "business growth, web development, small business";
      
      // Get latest posts
      const recentPosts = await db.select()
        .from(posts)
        .orderBy(posts.createdAt)
        .limit(20);
        
      if (recentPosts.length === 0) {
        return res.json({ 
          feed: [],
          message: "No posts available in your feed" 
        });
      }
      
      // Format post data for xAI
      const postData = recentPosts.map(p => `Post ${p.id}: ${p.content}`).join('\n');
      
      try {
        // Call xAI to rank and personalize feed
        const response = await callXAI('/chat/completions', {
          model: 'grok-3-mini',
          messages: [{ 
            role: 'user', 
            content: `As Elevion's content recommendation system, personalize this feed for a user with these interests: "${preferences}".
            Consider relevance to small business owners and web development needs.
            Return a JSON object with:
            1. "rankedPostIds": Array of post IDs in order of relevance (most relevant first)
            2. "reasoning": Brief explanation of your ranking logic
            
            Posts to personalize:
            ${postData}`
          }],
          response_format: { type: "json_object" }
        });
        
        let rankedPostIds = [];
        let reasoning = "";
        
        try {
          const parsed = JSON.parse(response.choices[0].message.content);
          rankedPostIds = parsed.rankedPostIds || parsed.ranked_post_ids || [];
          reasoning = parsed.reasoning || "Posts ranked based on your interests";
          
          // Fall back to array if needed
          if (!Array.isArray(rankedPostIds) && Array.isArray(parsed)) {
            rankedPostIds = parsed;
          }
          
          // Validate post IDs
          rankedPostIds = rankedPostIds.filter(id => 
            recentPosts.some(post => post.id === id)
          );
        } catch (parseError) {
          console.error("Error parsing xAI personalization response:", parseError);
          rankedPostIds = recentPosts.map(p => p.id);
          reasoning = "Chronological feed (personalization unavailable)";
        }
        
        // Return personalized feed
        const personalizedFeed = rankedPostIds.map(postId => {
          const post = recentPosts.find(p => p.id === postId);
          return post || null;
        }).filter(Boolean);
        
        res.json({
          success: true,
          feed: personalizedFeed,
          reasoning,
          preferences
        });
      } catch (xaiError) {
        console.error("xAI personalization error:", xaiError);
        // Fall back to chronological order
        res.json({
          success: true,
          feed: recentPosts,
          fallback: true,
          message: "Using standard feed due to personalization service unavailability"
        });
      }
    } catch (error) {
      console.error("Error generating personalized feed:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to generate personalized feed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Record post view and engagement to improve future recommendations
  app.post("/api/feed/record-engagement", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const userId = req.user.id;
      const { postId, engagementType, duration } = req.body;
      
      if (!postId || !engagementType) {
        return res.status(400).json({ 
          success: false,
          error: "Post ID and engagement type are required" 
        });
      }
      
      // Valid engagement types
      const validEngagementTypes = ['view', 'like', 'share', 'comment', 'save', 'read_full'];
      if (!validEngagementTypes.includes(engagementType)) {
        return res.status(400).json({ 
          success: false,
          error: "Invalid engagement type"
        });
      }
      
      // Record the engagement - using correct fields
      await db.insert(contentViewMetrics).values({
        contentId: postId,
        contentType: 'post',
        viewDuration: duration || 0,
        metadata: JSON.stringify({
          timestamp: new Date().toISOString(),
          userAgent: req.headers['user-agent'] || 'unknown',
          type: engagementType
        })
      });
      
      res.status(200).json({
        success: true,
        message: "Engagement recorded successfully"
      });
    } catch (error) {
      console.error("Error recording engagement:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to record engagement",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Get trending content based on engagement analytics
  app.get("/api/feed/trending", async (req: Request, res: Response) => {
    try {
      // Check if we have a cached version of trending posts
      const cachedTrending = feedCache.get("trending_posts");
      if (cachedTrending) {
        return res.json({
          success: true,
          trending: cachedTrending,
          cached: true
        });
      }
      
      // Get posts with the most engagement in the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Get engagement metrics for posts
      const postEngagementMetrics = await db.select({
        postId: contentViewMetrics.contentId,
        totalEngagements: sql`count(*)`,
        weightedScore: sql`
          sum(CASE 
            WHEN ${contentViewMetrics.viewDuration} > 0 THEN 1
            ELSE 0
          END)
        `
      })
      .from(contentViewMetrics)
      .where(
        and(
          eq(contentViewMetrics.contentType, 'post'),
          sql`${contentViewMetrics.createdAt} > ${sevenDaysAgo}`
        )
      )
      .groupBy(contentViewMetrics.contentId)
      .orderBy(desc(sql`weightedScore`))
      .limit(20);
      
      if (postEngagementMetrics.length === 0) {
        // If no engagement data, return the most recent posts
        const recentPosts = await db.select()
          .from(posts)
          .orderBy(desc(posts.createdAt))
          .limit(10);
          
        return res.json({
          success: true,
          trending: recentPosts,
          message: "No trending data available, showing latest posts"
        });
      }
      
      // Get the actual post content for the trending posts
      const postIds = postEngagementMetrics.map(metric => metric.postId);
      
      // Fetch the posts
      const trendingPosts = await db.select()
        .from(posts)
        .where(sql`${posts.id} IN (${postIds.join(',')})`);
      
      // Sort the posts by their engagement score
      const sortedTrendingPosts = trendingPosts.sort((a, b) => {
        const aMetric = postEngagementMetrics.find(m => m.postId === a.id);
        const bMetric = postEngagementMetrics.find(m => m.postId === b.id);
        
        const aScore = aMetric ? aMetric.weightedScore : 0;
        const bScore = bMetric ? bMetric.weightedScore : 0;
        
        return (bScore as number) - (aScore as number);
      });
      
      // Cache the result for 30 minutes
      feedCache.set("trending_posts", sortedTrendingPosts, 1800);
      
      res.json({
        success: true,
        trending: sortedTrendingPosts,
        engagementMetrics: postEngagementMetrics
      });
    } catch (error) {
      console.error("Error getting trending content:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to get trending content",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Suggest post content based on user activity for small business owners
  app.get("/api/feed/suggest-post/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ 
          success: false,
          error: "User ID is required" 
        });
      }
      
      // Get the user's information
      const [userInfo] = await db.select()
        .from(users)
        .where(eq(users.id, parseInt(userId)))
        .limit(1);
      
      if (!userInfo) {
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }
      
      const preferences = userInfo?.preferences ? JSON.parse(userInfo.preferences) : {};
      const businessType = preferences.businessType || 'small business';
      const interests = preferences.interests || 'web development, small business';
      
      try {
        // Call xAI to generate a post suggestion
        const response = await callXAI('/chat/completions', {
          model: 'grok-3-mini',
          messages: [{ 
            role: 'user', 
            content: `Generate a short, engaging social media post (under 250 characters) that a ${businessType} business owner might share on their Elevion platform profile. Focus on topics like ${interests}.`
          }],
        });
        
        return res.json({
          success: true,
          suggestion: response.choices[0].message.content,
          businessType,
          interests
        });
      } catch (xaiError) {
        console.error("xAI suggestion error:", xaiError);
        return res.json({
          success: true,
          suggestion: "Share your latest business milestone! What recent achievement are you proud of?",
          source: 'fallback'
        });
      }
    } catch (error) {
      console.error("Error generating post suggestion:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to generate post suggestion",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Feed engagement analysis endpoint
  app.get('/api/feed/feed-engagement', async (req: Request, res: Response) => {
    try {  
      // Check if we have a cached version of the analysis
      const cacheKey = "feed_engagement_analysis";
      const cachedAnalysis = feedCache.get(cacheKey);
      if (cachedAnalysis) {
        return res.json({
          success: true,
          analysis: cachedAnalysis,
          cached: true
        });
      }

      // Get engagement data from the article_engagement table
      const engagement = await db.select()
        .from(articleEngagement)
        .limit(100);
      
      if (engagement.length === 0) {
        return res.json({
          success: true,
          analysis: "No engagement data available for analysis.",
          engagementData: []
        });
      }
      
      // Format engagement data for xAI
      const engagementData = engagement.map(e => 
        `Post ${e.article_id}: ${e.likes} likes, ${e.comments} comments, ${e.views} views, ${e.shares} shares`
      ).join('\n');
      
      // Call xAI to analyze the engagement metrics
      try {
        const response = await callXAI('/chat/completions', {  
          model: 'grok-3',  
          messages: [{ 
            role: 'user', 
            content: `As Elevion's AI analyst, analyze these feed engagement metrics for our web development platform:
            
            ${engagementData}
            
            Provide insights including:
            1. Most engaging posts by likes and comments
            2. Overall engagement trends
            3. Recommendations to improve user engagement
            4. Any significant patterns in user behavior
            
            Format your analysis in a clear, structured way suitable for our analytics dashboard.`
          }],  
        });
        
        // Cache the analysis for 60 minutes (3600 seconds)
        const analysisResult = response.choices[0].message.content;
        updateFeedCache(cacheKey, analysisResult, 3600);
        
        res.json({ 
          success: true,
          analysis: analysisResult,
          dataPoints: engagement.length
        });
      } catch (xaiError) {
        console.error("xAI analysis error:", xaiError);
        
        // Fallback to a basic statistical analysis
        const totalLikes = engagement.reduce((sum, e) => sum + e.likes, 0);
        const totalComments = engagement.reduce((sum, e) => sum + e.comments, 0);
        const totalViews = engagement.reduce((sum, e) => sum + e.views, 0);
        const totalShares = engagement.reduce((sum, e) => sum + e.shares, 0);
        
        const avgLikes = totalLikes / engagement.length;
        const avgComments = totalComments / engagement.length;
        const avgViews = totalViews / engagement.length;
        const avgShares = totalShares / engagement.length;
        
        // Find most engaging posts
        const sortedByLikes = [...engagement].sort((a, b) => b.likes - a.likes);
        const sortedByComments = [...engagement].sort((a, b) => b.comments - a.comments);
        
        const topPostsByLikes = sortedByLikes.slice(0, 5).map(e => `Post ${e.article_id}: ${e.likes} likes`);
        const topPostsByComments = sortedByComments.slice(0, 5).map(e => `Post ${e.article_id}: ${e.comments} comments`);
        
        const fallbackAnalysis = `
        Feed Engagement Analysis:
        
        Overall Statistics:
        - Total posts analyzed: ${engagement.length}
        - Average likes per post: ${avgLikes.toFixed(2)}
        - Average comments per post: ${avgComments.toFixed(2)}
        - Average views per post: ${avgViews.toFixed(2)}
        - Average shares per post: ${avgShares.toFixed(2)}
        
        Top Posts by Likes:
        ${topPostsByLikes.join('\n')}
        
        Top Posts by Comments:
        ${topPostsByComments.join('\n')}
        
        Recommendations:
        - Focus on creating content similar to your top performing posts
        - Encourage user interaction through calls-to-action
        - Consider promoting posts with high view counts but low engagement
        `;
        
        updateFeedCache(cacheKey, fallbackAnalysis, 3600);
        
        res.json({ 
          success: true,
          analysis: fallbackAnalysis,
          dataPoints: engagement.length,
          fallback: true
        });
      }
    } catch (error) {  
      console.error("Feed engagement analysis error:", error);
      res.status(500).json({ 
        success: false,
        message: 'Feed engagement analysis failed', 
        error: error instanceof Error ? error.message : 'Unknown error'
      });  
    }  
  });
};