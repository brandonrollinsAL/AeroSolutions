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
      
      // Record the engagement
      await db.insert(contentViewMetrics).values({
        userId,
        contentId: postId,
        contentType: 'post',
        interactionType: engagementType,
        duration: duration || 0,
        metadata: JSON.stringify({
          timestamp: new Date().toISOString(),
          userAgent: req.headers['user-agent'] || 'unknown'
        })
      });
      
      // If this is a significant engagement (like, comment, share, save),
      // update user preferences to include keywords from this post
      if (['like', 'share', 'comment', 'save'].includes(engagementType)) {
        await updateUserPreferencesBasedOnEngagement(userId, postId);
      }
      
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
            WHEN ${contentViewMetrics.interactionType} = 'view' THEN 1
            WHEN ${contentViewMetrics.interactionType} = 'like' THEN 5 
            WHEN ${contentViewMetrics.interactionType} = 'comment' THEN 10
            WHEN ${contentViewMetrics.interactionType} = 'share' THEN 15
            WHEN ${contentViewMetrics.interactionType} = 'save' THEN 8
            ELSE 1
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
      
      // Create a SQL condition for an "IN" query
      const postIdConditions = postIds.map(id => eq(posts.id, id));
      
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
      
      // Get the user's recent posts to analyze their activity
      const userPosts = await db.select()
        .from(posts)
        .where(eq(posts.userId, parseInt(userId)))
        .orderBy(desc(posts.createdAt))
        .limit(10);
      
      if (userPosts.length === 0) {
        // If user has no posts, suggest generic content
        try {
          const response = await callXAI('/chat/completions', {
            model: 'grok-3-mini',
            messages: [{ 
              role: 'user', 
              content: `Suggest a short business-related post (under 250 characters) for a new small business owner on Elevion platform. Focus on web presence best practices.`
            }],
          });
          
          return res.json({
            success: true,
            suggestion: response.choices[0].message.content,
            source: 'generic'
          });
        } catch (xaiError) {
          console.error("xAI suggestion error for new user:", xaiError);
          return res.json({
            success: true,
            suggestion: "Share your latest business milestone! What recent achievement are you proud of?",
            source: 'fallback'
          });
        }
      }
      
      // Gather activity data from user's posts
      const activityData = userPosts.map(p => p.content).join('\n');
      
      // Get user information for better context
      const [userInfo] = await db.select()
        .from(users)
        .where(eq(users.id, parseInt(userId)))
        .limit(1);
      
      const businessType = userInfo?.businessType || 'small business';
      const interests = userInfo?.preferences || 'web development, small business';
      
      try {
        // Call xAI to generate a post suggestion based on activity
        const response = await callXAI('/chat/completions', {
          model: 'grok-3-mini',
          messages: [{ 
            role: 'user', 
            content: `You are a social media content strategist for Elevion web development company.
            
            Suggest a short, engaging post (under 250 characters) for a ${businessType} owner with interests in: ${interests}
            
            Based on their previous activity:
            ${activityData}
            
            The suggestion should be business-related, professional in tone, and encourage engagement.`
          }],
        });
        
        res.json({
          success: true,
          suggestion: response.choices[0].message.content,
          source: 'activity-based'
        });
      } catch (xaiError) {
        console.error("xAI post suggestion error:", xaiError);
        
        // Fallback to standard suggestions if xAI fails
        const fallbackSuggestions = [
          "Share your latest product update and ask for feedback!",
          "What's one business challenge you overcame this week?",
          "Looking for website feedback! What features would you like to see on our site?",
          "Just launched a new service! Ask me about our special introductory pricing.",
          "Business tip: Share something you've learned about digital marketing recently."
        ];
        
        const randomSuggestion = fallbackSuggestions[Math.floor(Math.random() * fallbackSuggestions.length)];
        
        res.json({
          success: true,
          suggestion: randomSuggestion,
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
  
  app.get("/api/feed/similar/:postId", async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;
      
      if (!postId) {
        return res.status(400).json({ error: "Post ID is required" });
      }
      
      // Check cache first
      const cacheKey = `similar_posts_${postId}`;
      const cachedSimilar = feedCache.get(cacheKey);
      if (cachedSimilar) {
        return res.json({
          success: true,
          similarPosts: cachedSimilar,
          cached: true
        });
      }
      
      // Get the source post
      const [sourcePost] = await db.select()
        .from(posts)
        .where(eq(posts.id, parseInt(postId)))
        .limit(1);
        
      if (!sourcePost) {
        return res.status(404).json({ 
          success: false,
          error: "Post not found" 
        });
      }
      
      // Get other posts to compare with
      const otherPosts = await db.select()
        .from(posts)
        .where(sql`${posts.id} != ${parseInt(postId)}`)
        .limit(50);
        
      if (otherPosts.length === 0) {
        return res.json({ 
          success: true,
          similarPosts: [],
          message: "No other posts available for comparison" 
        });
      }
      
      try {
        // Call xAI to find similar content
        const prompt = `
          Find the most similar posts to this source post:
          
          SOURCE POST: ${sourcePost.title || 'Untitled'} - ${sourcePost.content}
          
          Compare with these posts:
          ${otherPosts.map((p, i) => `POST ${p.id}: ${p.title || 'Untitled'} - ${p.content}`).join('\n')}
          
          Return a JSON object with:
          1. "similarPostIds": Array of post IDs in order of similarity (most similar first), limit to 5 posts
          2. "reasoning": Brief explanation of your similarity criteria
        `;
        
        const response = await callXAI('/chat/completions', {
          model: 'grok-3-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: "json_object" }
        });
        
        let similarPostIds = [];
        let reasoning = "";
        
        try {
          const parsed = JSON.parse(response.choices[0].message.content);
          similarPostIds = parsed.similarPostIds || [];
          reasoning = parsed.reasoning || "Posts ranked by content similarity";
          
          // Validate post IDs
          similarPostIds = similarPostIds.filter(id => 
            otherPosts.some(post => post.id === id)
          );
        } catch (parseError) {
          console.error("Error parsing xAI similarity response:", parseError);
          // Fallback to simple keyword matching
          similarPostIds = findSimilarPostsByKeywords(sourcePost, otherPosts);
          reasoning = "Posts ranked by keyword similarity (AI recommendation unavailable)";
        }
        
        // Get the posts with full content
        const similarPosts = similarPostIds.map(id => {
          return otherPosts.find(p => p.id === id) || null;
        }).filter(Boolean);
        
        // Cache the result for 1 hour
        feedCache.set(cacheKey, similarPosts, 3600);
        
        res.json({
          success: true,
          similarPosts,
          reasoning
        });
      } catch (xaiError) {
        console.error("xAI similarity error:", xaiError);
        // Fallback to keyword matching
        const similarPosts = findSimilarPostsByKeywords(sourcePost, otherPosts);
        
        res.json({
          success: true,
          similarPosts: similarPosts.slice(0, 5), // Limit to 5
          fallback: true,
          message: "Using keyword similarity due to AI service unavailability"
        });
      }
    } catch (error) {
      console.error("Error finding similar content:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to find similar content",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
};

/**
 * Helper function to update user preferences based on post engagement
 */
async function updateUserPreferencesBasedOnEngagement(userId: number, postId: number): Promise<void> {
  try {
    // Get the post content
    const [post] = await db.select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);
      
    if (!post) return;
    
    // Get user's current preferences
    const [userPrefs] = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
      
    if (!userPrefs) return;
    
    // Extract keywords from post content using xAI
    try {
      const response = await callXAI('/chat/completions', {
        model: 'grok-3-mini',
        messages: [{ 
          role: 'user', 
          content: `Extract 3-5 key topics or keywords from this post that would be relevant for user preferences:
          
          "${post.content}"
          
          Return a simple JSON array of keywords, nothing else.
          Example: ["web development", "small business", "marketing strategy"]`
        }],
        response_format: { type: "json_object" }
      });
      
      // Parse keywords from xAI response
      let extractedKeywords: string[] = [];
      try {
        const parsed = JSON.parse(response.choices[0].message.content);
        extractedKeywords = Array.isArray(parsed) ? parsed : parsed.keywords || [];
      } catch (parseError) {
        console.error("Error parsing xAI keywords:", parseError);
        // Fallback to simple word extraction
        extractedKeywords = extractKeywordsFromText(post.content);
      }
      
      if (extractedKeywords.length === 0) return;
      
      // Combine with existing preferences
      const currentPreferences = userPrefs.preferences || "";
      const prefArray = currentPreferences.split(',').map(p => p.trim());
      
      // Add new keywords without duplicates
      const updatedPreferences = Array.from(new Set([
        ...prefArray, 
        ...extractedKeywords
      ])).filter(Boolean).join(', ');
      
      // Update user preferences
      await db.update(users)
        .set({ preferences: updatedPreferences })
        .where(eq(users.id, userId));
        
      console.log(`Updated preferences for user ${userId} based on post ${postId}`);
    } catch (xaiError) {
      console.error("xAI keyword extraction error:", xaiError);
      // If xAI fails, use simple keyword extraction
      const extractedKeywords = extractKeywordsFromText(post.content);
      
      // Update user preferences with simple keywords
      if (extractedKeywords.length > 0) {
        const currentPreferences = userPrefs.preferences || "";
        const prefArray = currentPreferences.split(',').map(p => p.trim());
        
        const updatedPreferences = Array.from(new Set([
          ...prefArray, 
          ...extractedKeywords
        ])).filter(Boolean).join(', ');
        
        await db.update(users)
          .set({ preferences: updatedPreferences })
          .where(eq(users.id, userId));
      }
    }
  } catch (error) {
    console.error("Error updating user preferences:", error);
  }
}

/**
 * Simple utility to extract keywords from text
 */
function extractKeywordsFromText(text: string): string[] {
  // Common stop words to filter out
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with',
    'by', 'about', 'as', 'into', 'like', 'through', 'after', 'over', 'between',
    'out', 'of', 'from', 'up', 'is', 'am', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall',
    'should', 'can', 'could', 'may', 'might', 'must', 'that', 'which', 'who',
    'whom', 'this', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'their', 'his', 'her', 'its', 'our', 'your', 'my', 'mine', 'yours', 'me', 'him'
  ]);
  
  // Split text, remove punctuation, convert to lowercase
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));
  
  // Count word frequencies
  const wordCounts = new Map<string, number>();
  for (const word of words) {
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
  }
  
  // Convert to array of [word, count] pairs and sort by count
  const sorted = [...wordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
  
  return sorted;
}

/**
 * Find similar posts using simple keyword matching when AI is unavailable
 */
function findSimilarPostsByKeywords(sourcePost: any, otherPosts: any[]): any[] {
  const sourceKeywords = extractKeywordsFromText(sourcePost.content);
  
  // Calculate similarity scores
  const postsWithScores = otherPosts.map(post => {
    const postKeywords = extractKeywordsFromText(post.content);
    
    // Count matching keywords
    let matchCount = 0;
    for (const keyword of sourceKeywords) {
      if (postKeywords.includes(keyword)) {
        matchCount++;
      }
    }
    
    // Also check if the post content contains source keywords
    for (const keyword of sourceKeywords) {
      if (post.content.toLowerCase().includes(keyword.toLowerCase())) {
        matchCount += 0.5; // Partial match
      }
    }
    
    return {
      post,
      score: matchCount
    };
  });
  
  // Sort by score and return posts
  return postsWithScores
    .sort((a, b) => b.score - a.score)
    .map(item => item.post);
}

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

/**
 * Helper function to update feed cache
 */
function updateFeedCache(key: string, data: any, ttl: number = 600) {
  feedCache.set(key, data, ttl);
}