import express, { Response, Request as ExpressRequest } from "express";
import { db } from "../db";
import { userSessions, contentViewMetrics } from "@shared/schema";
import { eq, and, or, sql, desc, gt, lt, between } from "drizzle-orm";
import { storage } from "../storage";

// Extended request interface with authentication
interface Request extends ExpressRequest {
  isAuthenticated(): boolean;
  user?: any;
}

/**
 * Analytics route handlers for tracking and analyzing user engagement
 */
export const registerAnalyticsRoutes = (app: express.Express) => {
  // Track a new user session
  app.post("/api/analytics/track-session", async (req: Request, res: Response) => {
    try {
      const { userId, startTime, endTime, device, browser, referrer } = req.body;
      
      if (!startTime || !endTime) {
        return res.status(400).json({ error: "Missing required session data" });
      }
      
      // Calculate session duration in seconds
      const start = new Date(startTime);
      const end = new Date(endTime);
      const durationSeconds = ((end.getTime() - start.getTime()) / 1000).toFixed(2);
      
      const session = {
        userId: userId || null,
        startTime: start,
        endTime: end,
        sessionDuration: durationSeconds,
        device,
        browser,
        referrer,
        ipAddress: req.ip || null
      };
      
      const [result] = await db.insert(userSessions).values(session).returning();
      
      res.status(200).json({ success: true, sessionId: result.id });
    } catch (error) {
      console.error("Error tracking user session:", error);
      res.status(500).json({ error: "Failed to track user session" });
    }
  });
  
  // Track content view metrics
  app.post("/api/analytics/track-content-view", async (req: Request, res: Response) => {
    try {
      const { contentId, contentType, contentTitle, timeSpent, userId } = req.body;
      
      if (!contentId || !contentType || !contentTitle) {
        return res.status(400).json({ error: "Missing required content data" });
      }
      
      // Check if content metrics already exist
      const [existingMetrics] = await db.select()
        .from(contentViewMetrics)
        .where(
          and(
            eq(contentViewMetrics.contentId, contentId),
            eq(contentViewMetrics.contentType, contentType)
          )
        );
      
      if (existingMetrics) {
        // Update existing metrics
        const uniqueViews = userId ? existingMetrics.uniqueViews + 1 : existingMetrics.uniqueViews;
        
        // Calculate new average time on page
        const totalTimeBeforeInSeconds = existingMetrics.views * parseFloat(existingMetrics.avgTimeOnPage.toString());
        const newTotalTimeInSeconds = totalTimeBeforeInSeconds + (timeSpent || 0);
        const newAvgTime = (newTotalTimeInSeconds / (existingMetrics.views + 1)).toFixed(2);
        
        await db.update(contentViewMetrics)
          .set({ 
            views: existingMetrics.views + 1,
            uniqueViews: uniqueViews,
            avgTimeOnPage: newAvgTime,
            updatedAt: new Date()
          })
          .where(eq(contentViewMetrics.id, existingMetrics.id));
          
        res.status(200).json({ success: true, updated: true });
      } else {
        // Create new metrics record
        const newMetrics = {
          contentId,
          contentType,
          contentTitle,
          views: 1,
          uniqueViews: userId ? 1 : 0,
          avgTimeOnPage: timeSpent ? timeSpent.toString() : "0",
          bounceRate: "0",
          conversionRate: "0"
        };
        
        const [result] = await db.insert(contentViewMetrics).values(newMetrics).returning();
        
        res.status(200).json({ success: true, created: true, id: result.id });
      }
    } catch (error) {
      console.error("Error tracking content view:", error);
      res.status(500).json({ error: "Failed to track content view" });
    }
  });
  
  /**
   * Get user engagement metrics with AI analysis
   */
  app.get("/api/analytics/user-engagement", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get date range from query params, default to last 30 days
      const { startDate, endDate } = req.query;
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const start = startDate ? new Date(startDate as string) : thirtyDaysAgo;
      const end = endDate ? new Date(endDate as string) : now;
      
      // Get session data
      const sessions = await db.select()
        .from(userSessions)
        .where(
          and(
            gt(userSessions.startTime, start),
            lt(userSessions.startTime, end)
          )
        )
        .orderBy(desc(userSessions.startTime));
      
      // Calculate metrics
      const totalSessions = sessions.length;
      const authenticatedSessions = sessions.filter(s => s.userId !== null).length;
      const anonymousSessions = totalSessions - authenticatedSessions;
      
      // Calculate average session duration
      let totalDuration = 0;
      sessions.forEach(session => {
        totalDuration += parseFloat(session.sessionDuration.toString());
      });
      const avgSessionDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;
      
      // Get device breakdown
      const deviceCounts = {
        desktop: sessions.filter(s => s.device === 'desktop').length,
        mobile: sessions.filter(s => s.device === 'mobile').length,
        tablet: sessions.filter(s => s.device === 'tablet').length,
        other: sessions.filter(s => !['desktop', 'mobile', 'tablet'].includes(s.device || '')).length
      };
      
      // Get referrer breakdown
      const referrers = sessions
        .filter(s => s.referrer)
        .reduce((acc, session) => {
          const referrer = session.referrer as string;
          acc[referrer] = (acc[referrer] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      
      // Get content metrics
      const contentViews = await db.select().from(contentViewMetrics);
      const totalViews = contentViews.reduce((sum, content) => sum + content.views, 0);
      const totalUniqueViews = contentViews.reduce((sum, content) => sum + content.uniqueViews, 0);
      
      // Return metrics with AI analysis
      res.json({
        timeframe: {
          start: start.toISOString(),
          end: end.toISOString(),
          days: Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
        },
        sessions: {
          total: totalSessions,
          authenticated: authenticatedSessions,
          anonymous: anonymousSessions,
          avgDurationSeconds: avgSessionDuration.toFixed(2)
        },
        devices: deviceCounts,
        referrers: referrers,
        content: {
          totalViews,
          totalUniqueViews,
          topContent: contentViews
            .sort((a, b) => b.views - a.views)
            .slice(0, 5)
            .map(c => ({
              title: c.contentTitle,
              type: c.contentType,
              views: c.views,
              avgTimeOnPage: c.avgTimeOnPage
            }))
        }
      });
    } catch (error) {
      console.error("Error getting user engagement metrics:", error);
      res.status(500).json({ error: "Failed to retrieve user engagement metrics" });
    }
  });
  
  /**
   * Predict user churn risk based on user activity data
   */
  app.get("/api/analytics/churn-prediction", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get all users with their session data
      const users = await db.query.users.findMany({
        with: {
          sessions: true
        }
      });
      
      // Analyze user activity patterns to predict churn
      const now = new Date();
      const userChurnRisks = users.map(user => {
        // Simple churn prediction based on last login and session frequency
        if (!user.lastLoginAt) {
          return { userId: user.id, username: user.username, churnRisk: "high", reason: "No login activity" };
        }
        
        const daysSinceLastLogin = Math.floor((now.getTime() - user.lastLoginAt.getTime()) / (24 * 60 * 60 * 1000));
        const sessions = user.sessions as any[] || [];
        
        if (daysSinceLastLogin > 30) {
          return { userId: user.id, username: user.username, churnRisk: "high", reason: `${daysSinceLastLogin} days since last login` };
        } else if (daysSinceLastLogin > 14) {
          return { userId: user.id, username: user.username, churnRisk: "medium", reason: `${daysSinceLastLogin} days since last login` };
        } else if (sessions.length <= 1) {
          return { userId: user.id, username: user.username, churnRisk: "medium", reason: "Only 1 session recorded" };
        } else {
          return { userId: user.id, username: user.username, churnRisk: "low", reason: "Active user" };
        }
      });
      
      // Sort by churn risk (high to low)
      const sortedChurnRisks = userChurnRisks.sort((a, b) => {
        const riskOrder = { high: 3, medium: 2, low: 1 };
        return riskOrder[b.churnRisk as keyof typeof riskOrder] - riskOrder[a.churnRisk as keyof typeof riskOrder];
      });
      
      res.json({
        highRiskCount: sortedChurnRisks.filter(u => u.churnRisk === "high").length,
        mediumRiskCount: sortedChurnRisks.filter(u => u.churnRisk === "medium").length,
        lowRiskCount: sortedChurnRisks.filter(u => u.churnRisk === "low").length,
        users: sortedChurnRisks
      });
    } catch (error) {
      console.error("Error predicting user churn:", error);
      res.status(500).json({ error: "Failed to predict user churn" });
    }
  });
  
  /**
   * Get content effectiveness analytics
   */
  app.get("/api/analytics/content-effectiveness", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get content metrics with additional effectiveness score
      const contentMetrics = await db.select().from(contentViewMetrics);
      
      // Calculate effectiveness score (simplified version - weighted combination of views, engagement, and conversion)
      const contentEffectiveness = contentMetrics.map(content => {
        const viewsScore = Math.min(content.views / 100, 1) * 0.4; // 40% weight, max at 100 views
        const timeScore = Math.min(parseFloat(content.avgTimeOnPage.toString()) / 5, 1) * 0.35; // 35% weight, max at 5 minutes
        const conversionScore = parseFloat(content.conversionRate.toString()) / 100 * 0.25; // 25% weight
        
        const effectivenessScore = (viewsScore + timeScore + conversionScore) * 100; // Scale to 0-100
        
        return {
          id: content.id,
          contentType: content.contentType,
          title: content.contentTitle,
          views: content.views,
          uniqueViews: content.uniqueViews,
          avgTimeOnPage: parseFloat(content.avgTimeOnPage.toString()).toFixed(2),
          conversionRate: parseFloat(content.conversionRate.toString()).toFixed(2),
          bounceRate: parseFloat(content.bounceRate.toString()).toFixed(2),
          effectivenessScore: effectivenessScore.toFixed(1)
        };
      });
      
      // Sort by effectiveness score (high to low)
      const sortedByEffectiveness = contentEffectiveness.sort(
        (a, b) => parseFloat(b.effectivenessScore) - parseFloat(a.effectivenessScore)
      );
      
      // Get content type breakdown
      const contentTypeBreakdown = contentMetrics.reduce((acc, content) => {
        const type = content.contentType;
        if (!acc[type]) {
          acc[type] = { count: 0, views: 0, avgEffectiveness: 0 };
        }
        acc[type].count++;
        acc[type].views += content.views;
        return acc;
      }, {} as Record<string, { count: number, views: number, avgEffectiveness: number }>);
      
      // Calculate average effectiveness by type
      Object.keys(contentTypeBreakdown).forEach(type => {
        const typeItems = sortedByEffectiveness.filter(item => item.contentType === type);
        const avgScore = typeItems.reduce((sum, item) => sum + parseFloat(item.effectivenessScore), 0) / typeItems.length;
        contentTypeBreakdown[type].avgEffectiveness = parseFloat(avgScore.toFixed(1));
      });
      
      res.json({
        totalContent: contentMetrics.length,
        totalViews: contentMetrics.reduce((sum, content) => sum + content.views, 0),
        contentByType: contentTypeBreakdown,
        mostEffective: sortedByEffectiveness.slice(0, 5),
        leastEffective: sortedByEffectiveness.slice(-5).reverse(),
        allContent: sortedByEffectiveness
      });
    } catch (error) {
      console.error("Error getting content effectiveness:", error);
      res.status(500).json({ error: "Failed to retrieve content effectiveness" });
    }
  });
};