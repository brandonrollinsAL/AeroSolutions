import express, { Response, Request as ExpressRequest } from "express";
import { db } from "../db";
import { callXAI } from "../utils/xaiClient";
import { posts, users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Extended request interface with authentication
interface Request extends ExpressRequest {
  isAuthenticated(): boolean;
  user?: any;
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
};