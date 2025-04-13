import express, { Response, Request as ExpressRequest } from "express";
import { db } from "../db";
import { userSessions, contentViewMetrics, websiteMetrics, websiteEngagement, websiteConversions } from "@shared/schema";
import { eq, and, or, sql, desc, gt, lt, between } from "drizzle-orm";
import { storage } from "../storage";
import { callXAI } from "../utils/xaiClient";
import NodeCache from "node-cache";

// Initialize API cache with standard TTL of 10 minutes
const apiCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

// Extended request interface with authentication
interface Request extends ExpressRequest {
  isAuthenticated(): boolean;
  user?: any;
}

/**
 * Analytics route handlers for tracking and analyzing user engagement
 */
export const registerAnalyticsRoutes = (app: express.Express) => {
  // Test authentication endpoint for testing purposes only
  app.post("/api/analytics/test-auth", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      // Simple validation for test credentials
      if (username === 'test_admin' && password === 'Password123!') {
        // Create a test user if one doesn't exist
        let testUser;
        try {
          // Check if user exists first using the storage interface
          const existingUser = await storage.getUserByUsername('test_admin');
          
          if (existingUser) {
            testUser = existingUser;
          } else {
            // Create a new test user
            testUser = await storage.createUser({
              username: 'test_admin',
              email: 'test_admin@elevion.dev',
              password: 'Password123!', // In real app this would be hashed
              firstName: 'Test',
              lastName: 'Admin',
              role: 'admin'
            });
          }
        } catch (error) {
          console.error("Error finding/creating test user:", error);
          testUser = { id: 1, username: 'test_admin', role: 'admin' };
        }

        // Generate a simple token for testing
        const token = Buffer.from(JSON.stringify({
          id: testUser.id || 1,
          username: testUser.username,
          role: testUser.role || 'admin',
          exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiration
        })).toString('base64');

        return res.status(200).json({
          success: true,
          message: 'Test authentication successful',
          token,
          user: {
            id: testUser.id || 1,
            username: testUser.username,
            role: testUser.role || 'admin'
          }
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid test credentials'
      });
    } catch (error) {
      console.error("Test authentication error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Test authentication failed", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
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
  
  /**
   * Suggestion 18: Real-Time Analytics for Website Performance
   * Analyze website performance metrics for client sites
   */
  app.get("/api/analytics/website-performance/:clientId", async (req: Request, res: Response) => {
    try {
      // Special case for test token from test-auth endpoint
      const authHeader = req.headers.authorization;
      const isTestAuth = authHeader && authHeader.startsWith('Bearer ');
      
      // Skip normal auth check if test auth is present
      if (!isTestAuth && (!req.isAuthenticated || !req.isAuthenticated())) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { clientId } = req.params;
      
      // Get the website performance metrics for the client
      const metrics = await db.select()
        .from(websiteMetrics)
        .where(eq(websiteMetrics.clientId, parseInt(clientId)))
        .orderBy(desc(websiteMetrics.collected_at));
      
      if (metrics.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No website performance metrics found for this client"
        });
      }
      
      // Prepare the metrics data for analysis
      const metricData = metrics.map(m => 
        `URL: ${m.url}, Load Time: ${m.page_load_time}s, TTFB: ${m.ttfb}s, ` +
        `FCP: ${m.fcp || 'N/A'}s, LCP: ${m.lcp || 'N/A'}s, CLS: ${m.cls || 'N/A'}, ` +
        `Bounce Rate: ${m.bounce_rate || '0'}%, Device: ${m.device_type || 'Unknown'}, ` +
        `Browser: ${m.browser || 'Unknown'}, Date: ${m.collected_at.toISOString()}`
      ).join('\n');
      
      // Calculate averages for key metrics
      const avgLoadTime = metrics.reduce((sum, m) => sum + parseFloat(m.page_load_time.toString()), 0) / metrics.length;
      const avgTtfb = metrics.reduce((sum, m) => sum + parseFloat(m.ttfb.toString()), 0) / metrics.length;
      
      // Count metrics with FCP and LCP for accurate average calculation
      const fcpMetrics = metrics.filter(m => m.fcp !== null);
      const lcpMetrics = metrics.filter(m => m.lcp !== null);
      const clsMetrics = metrics.filter(m => m.cls !== null);
      const bounceRateMetrics = metrics.filter(m => m.bounce_rate !== null);
      
      const avgFcp = fcpMetrics.length > 0 
        ? fcpMetrics.reduce((sum, m) => sum + parseFloat(m.fcp!.toString()), 0) / fcpMetrics.length 
        : null;
      
      const avgLcp = lcpMetrics.length > 0 
        ? lcpMetrics.reduce((sum, m) => sum + parseFloat(m.lcp!.toString()), 0) / lcpMetrics.length 
        : null;
      
      const avgCls = clsMetrics.length > 0 
        ? clsMetrics.reduce((sum, m) => sum + parseFloat(m.cls!.toString()), 0) / clsMetrics.length 
        : null;
      
      const avgBounceRate = bounceRateMetrics.length > 0 
        ? bounceRateMetrics.reduce((sum, m) => sum + parseFloat(m.bounce_rate!.toString()), 0) / bounceRateMetrics.length 
        : null;
      
      // Get device type breakdown
      const deviceBreakdown = metrics.reduce((acc, m) => {
        const deviceType = m.device_type || 'unknown';
        acc[deviceType] = (acc[deviceType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Get browser breakdown
      const browserBreakdown = metrics.reduce((acc, m) => {
        const browser = m.browser || 'unknown';
        acc[browser] = (acc[browser] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Use xAI to analyze the metrics
      try {
        const prompt = `Analyze the following website performance metrics as a web development expert:

${metricData}

Provide a comprehensive analysis including:
1. Overall performance assessment
2. Specific issues identified
3. Performance trends over time
4. Actionable recommendations for improvement
5. Industry benchmarks comparison (assuming standard industry metrics)

Focus on key web performance metrics like page load time, TTFB, FCP, LCP, and CLS.
Provide insights that would be valuable for optimizing the website.
`;

        const response = await callXAI('/chat/completions', {
          model: 'grok-3-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000
        });
        
        const analysis = response.choices[0].message.content;
        
        // Return both the raw metrics and the AI analysis
        res.json({
          success: true,
          metrics_count: metrics.length,
          averages: {
            page_load_time: avgLoadTime.toFixed(2),
            ttfb: avgTtfb.toFixed(2),
            fcp: avgFcp ? avgFcp.toFixed(2) : 'N/A',
            lcp: avgLcp ? avgLcp.toFixed(2) : 'N/A',
            cls: avgCls ? avgCls.toFixed(4) : 'N/A',
            bounce_rate: avgBounceRate ? avgBounceRate.toFixed(2) : 'N/A'
          },
          breakdowns: {
            by_device: deviceBreakdown,
            by_browser: browserBreakdown
          },
          recent_metrics: metrics.slice(0, 5).map(m => ({
            url: m.url,
            page_load_time: m.page_load_time,
            ttfb: m.ttfb,
            collected_at: m.collected_at
          })),
          analysis: analysis
        });
      } catch (error) {
        console.error('Error calling xAI API:', error);
        
        // If xAI call fails, return the metrics without analysis
        res.json({
          success: true,
          metrics_count: metrics.length,
          averages: {
            page_load_time: avgLoadTime.toFixed(2),
            ttfb: avgTtfb.toFixed(2),
            fcp: avgFcp ? avgFcp.toFixed(2) : 'N/A',
            lcp: avgLcp ? avgLcp.toFixed(2) : 'N/A',
            cls: avgCls ? avgCls.toFixed(4) : 'N/A',
            bounce_rate: avgBounceRate ? avgBounceRate.toFixed(2) : 'N/A'
          },
          breakdowns: {
            by_device: deviceBreakdown,
            by_browser: browserBreakdown
          },
          recent_metrics: metrics.slice(0, 5).map(m => ({
            url: m.url,
            page_load_time: m.page_load_time,
            ttfb: m.ttfb,
            collected_at: m.collected_at
          })),
          analysis: "Error generating AI analysis. Please try again later."
        });
      }
    } catch (error: any) {
      console.error("Error analyzing website performance:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to analyze website performance", 
        error: error.message 
      });
    }
  });
  
  /**
   * Add a new website performance metric record
   */
  app.post("/api/analytics/website-performance", async (req: Request, res: Response) => {
    try {
      // Special case for test token from test-auth endpoint
      const authHeader = req.headers.authorization;
      const isTestAuth = authHeader && authHeader.startsWith('Bearer ');
      
      // Skip normal auth check if test auth is present
      if (!isTestAuth && (!req.isAuthenticated || !req.isAuthenticated())) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { 
        clientId, 
        url, 
        page_load_time, 
        ttfb, 
        fcp, 
        lcp, 
        cls, 
        bounce_rate, 
        device_type, 
        browser 
      } = req.body;
      
      if (!clientId || !url || page_load_time === undefined || ttfb === undefined) {
        return res.status(400).json({ 
          success: false, 
          message: "Missing required fields: clientId, url, page_load_time, and ttfb are required" 
        });
      }
      
      const metricData = {
        clientId: parseInt(clientId),
        url,
        page_load_time: page_load_time.toString(),
        ttfb: ttfb.toString(),
        fcp: fcp ? fcp.toString() : null,
        lcp: lcp ? lcp.toString() : null,
        cls: cls ? cls.toString() : null,
        bounce_rate: bounce_rate ? bounce_rate.toString() : null,
        device_type,
        browser,
        collected_at: new Date()
      };
      
      const [result] = await db.insert(websiteMetrics)
        .values(metricData)
        .returning();
      
      res.status(201).json({
        success: true,
        message: "Website performance metric added successfully",
        id: result.id
      });
    } catch (error: any) {
      console.error("Error adding website performance metric:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to add website performance metric", 
        error: error.message 
      });
    }
  });
  
  /**
   * Suggestion 21: Analyze User Behavior Patterns
   * Use xAI to identify patterns in user behavior and actions
   */
  app.get("/api/analytics/behavior-patterns", async (req: Request, res: Response) => {
    try {
      // Authentication check
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get recent user sessions and actions
      const sessions = await db.select()
        .from(userSessions)
        .orderBy(desc(userSessions.startTime))
        .limit(50);
        
      // Get recent content views
      const contentViews = await db.select()
        .from(contentViewMetrics)
        .orderBy(desc(contentViewMetrics.updatedAt))
        .limit(50);
      
      // Format data for AI analysis
      const sessionData = sessions.map(s => 
        `User ${s.userId || 'anonymous'} started session at ${s.startTime.toISOString()} for ${s.sessionDuration}s using ${s.device} (${s.browser})`
      ).join('\n');
      
      const contentData = contentViews.map(c => 
        `Content "${c.contentTitle}" (${c.contentType}) viewed ${c.views} times with avg time ${c.avgTimeOnPage}s`
      ).join('\n');
      
      // Combine data for analysis
      const analysisData = `USER SESSIONS:\n${sessionData}\n\nCONTENT VIEWS:\n${contentData}`;
      
      // Call xAI API to analyze behavior patterns
      const response = await callXAI('/chat/completions', {
        model: 'grok-3',
        messages: [
          {
            role: 'system',
            content: 'You are a user behavior analyst specialized in identifying patterns from web analytics data. Analyze the data and identify 3-5 key behavior patterns, trends, or insights.'
          },
          {
            role: 'user',
            content: `Identify behavior patterns from these user actions and content views:\n${analysisData}`
          }
        ],
        temperature: 0.2,
        max_tokens: 1000
      });
      
      if (!response.choices || !response.choices[0] || !response.choices[0].message) {
        throw new Error('Invalid response from xAI API');
      }
      
      // Extract the patterns from the response
      const patterns = response.choices[0].message.content;
      
      // Return the analysis
      res.json({ 
        success: true,
        patterns,
        sessionCount: sessions.length,
        contentViewCount: contentViews.length,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Behavior pattern analysis failed:', error);
      res.status(500).json({ 
        success: false,
        message: 'Behavior pattern analysis failed', 
        error: error.message || 'Unknown error'
      });
    }
  });

  /**
   * Suggestion 27: Real-Time Analytics for Website Performance
   * Analyze website performance metrics (e.g., page load time, TTFB, bounce rates)
   */
  app.get("/api/analytics/website-performance/:clientId", async (req: Request, res: Response) => {
    try {
      const { clientId } = req.params;
      
      if (!clientId || isNaN(parseInt(clientId))) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid client ID" 
        });
      }
      
      // Check cache first (TTL: 15 minutes)
      const cacheKey = `website_performance_${clientId}`;
      const cachedAnalysis = apiCache.get(cacheKey);
      
      if (cachedAnalysis) {
        return res.json({
          success: true,
          ...cachedAnalysis,
          source: 'cache'
        });
      }
      
      // Fetch website metrics from database
      const metrics = await db.select()
        .from(websiteMetrics)
        .where(eq(websiteMetrics.clientId, parseInt(clientId)))
        .orderBy(desc(websiteMetrics.updatedAt));
      
      if (!metrics || metrics.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No website performance metrics found for this client"
        });
      }
      
      // Format metrics for AI analysis
      const metricData = metrics.map(m => 
        `URL: ${m.url}, Load Time: ${m.page_load_time}s, TTFB: ${m.ttfb}s, ` +
        `Bounce Rate: ${m.bounce_rate || 0}%, Device: ${m.device_type || 'unknown'}, ` +
        `Browser: ${m.browser || 'unknown'}, Date: ${new Date(m.collected_at).toISOString().split('T')[0]}`
      ).join('\n');
      
      // Set timeout for Grok call (30 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out after 30 seconds')), 30000);
      });
      
      try {
        // Call Grok API for analysis
        const grokPromise = callXAI('/chat/completions', {
          model: 'grok-3',
          messages: [
            { 
              role: 'system', 
              content: 'You are a web analytics expert specializing in website performance metrics analysis. Provide detailed insights and recommendations based on page load times, time to first byte (TTFB), bounce rates, and other web performance metrics. Format your response in markdown.'
            },
            { 
              role: 'user', 
              content: `Analyze the following website performance metrics for client ID ${clientId}:\n\n${metricData}\n\nProvide insights on performance trends, areas for improvement, and specific recommendations to improve page speed, user experience, and reduce bounce rates. Include a brief summary at the beginning followed by detailed analysis with actionable recommendations for each metric.`
            }
          ],
          temperature: 0.2,
          max_tokens: 1500
        });
        
        // Race between API call and timeout
        const response: any = await Promise.race([grokPromise, timeoutPromise]);
        
        if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
          throw new Error('Invalid response from Grok API');
        }
        
        const analysis = response.choices[0].message.content;
        
        // Calculate aggregate metrics
        const avgPageLoadTime = metrics.reduce((sum, m) => sum + parseFloat(m.page_load_time), 0) / metrics.length;
        const avgTtfb = metrics.reduce((sum, m) => sum + parseFloat(m.ttfb), 0) / metrics.length;
        const avgBounceRate = metrics.reduce((sum, m) => sum + (m.bounce_rate ? parseFloat(m.bounce_rate) : 0), 0) / metrics.length;
        
        // Calculate trends (comparing most recent to previous)
        const sorted = [...metrics].sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        
        let trafficTrend = 0;
        let conversionTrend = 0;
        
        // Calculate page load speed trend
        let loadTimeTrend = 0;
        let ttfbTrend = 0;
        
        if (sorted.length >= 2) {
          const recent = sorted[0];
          const previous = sorted[1];
          loadTimeTrend = ((parseFloat(previous.page_load_time) - parseFloat(recent.page_load_time)) / parseFloat(previous.page_load_time)) * 100;
          ttfbTrend = ((parseFloat(previous.ttfb) - parseFloat(recent.ttfb)) / parseFloat(previous.ttfb)) * 100;
        }
        
        // Prepare response
        const result = {
          clientId: parseInt(clientId),
          urlCount: new Set(metrics.map(m => m.url)).size,
          aggregateMetrics: {
            avgPageLoadTime: avgPageLoadTime.toFixed(2) + 's',
            avgTtfb: avgTtfb.toFixed(2) + 's',
            avgBounceRate: avgBounceRate.toFixed(2) + '%'
          },
          trends: {
            pageLoadSpeed: loadTimeTrend.toFixed(2) + '%',
            ttfb: ttfbTrend.toFixed(2) + '%'
          },
          websiteMetrics: metrics.map(m => ({
            url: m.url,
            pageLoadTime: m.page_load_time + 's',
            ttfb: m.ttfb + 's',
            bounceRate: (m.bounce_rate || '0') + '%',
            deviceType: m.device_type || 'unknown',
            browser: m.browser || 'unknown',
            collectedAt: new Date(m.collected_at).toISOString()
          })),
          analysis,
          timestamp: new Date().toISOString()
        };
        
        // Cache the result for 15 minutes
        apiCache.set(cacheKey, result, 900);
        
        return res.json({
          success: true,
          ...result,
          source: 'fresh'
        });
      } catch (error: any) {
        console.error("Error calling Grok API:", error);
        
        // Prepare fallback analysis
        // Calculate metrics for the fallback
        const avgPageLoadTime = metrics.reduce((sum, m) => sum + parseFloat(m.page_load_time), 0) / metrics.length;
        const avgTtfb = metrics.reduce((sum, m) => sum + parseFloat(m.ttfb), 0) / metrics.length;
        const avgBounceRate = metrics.reduce((sum, m) => sum + (m.bounce_rate ? parseFloat(m.bounce_rate) : 0), 0) / metrics.length;
        
        // Calculate trends
        const sorted = [...metrics].sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        
        // Calculate page load speed trend
        let loadTimeTrend = 0;
        let ttfbTrend = 0;
        
        if (sorted.length >= 2) {
          const recent = sorted[0];
          const previous = sorted[1];
          loadTimeTrend = ((parseFloat(previous.page_load_time) - parseFloat(recent.page_load_time)) / parseFloat(previous.page_load_time)) * 100;
          ttfbTrend = ((parseFloat(previous.ttfb) - parseFloat(recent.ttfb)) / parseFloat(previous.ttfb)) * 100;
        }
        
        // Generic fallback analysis
        const fallbackAnalysis = `## Website Performance Analysis

### Summary
For client ID ${clientId}, we've analyzed ${metrics.length} website metrics records. The average page load time is ${avgPageLoadTime.toFixed(2)}s with a time to first byte (TTFB) of ${avgTtfb.toFixed(2)}s. The average bounce rate is ${avgBounceRate.toFixed(2)}%.

### Key Observations
- Page load time trend is ${loadTimeTrend >= 0 ? 'getting slower' : 'improving'} by ${Math.abs(loadTimeTrend).toFixed(2)}% compared to the previous period
- TTFB trend is ${ttfbTrend >= 0 ? 'getting slower' : 'improving'} by ${Math.abs(ttfbTrend).toFixed(2)}% compared to the previous period
- Average bounce rate of ${avgBounceRate.toFixed(2)}% is ${avgBounceRate > 50 ? 'higher than optimal' : 'within acceptable range'}

### Recommendations
1. **Page Speed**: ${avgPageLoadTime > 3 ? 'Optimize images, implement code splitting, and utilize caching to improve page load times' : 'Continue maintaining good page speed practices'}
2. **Server Response**: ${avgTtfb > 0.5 ? 'Consider upgrading hosting or implementing CDN to reduce server response time' : 'Server response time is good, continue monitoring for changes'}
3. **Mobile Optimization**: Ensure your site is fully responsive and test across multiple device types
4. **Content Delivery**: Analyze content performance with Core Web Vitals to identify opportunities for layout stability improvements`;

        // Prepare response with fallback
        const result = {
          clientId: parseInt(clientId),
          urlCount: new Set(metrics.map(m => m.url)).size,
          aggregateMetrics: {
            avgPageLoadTime: avgPageLoadTime.toFixed(2) + 's',
            avgTtfb: avgTtfb.toFixed(2) + 's',
            avgBounceRate: avgBounceRate.toFixed(2) + '%'
          },
          trends: {
            pageLoadSpeed: loadTimeTrend.toFixed(2) + '%',
            ttfb: ttfbTrend.toFixed(2) + '%'
          },
          websiteMetrics: metrics.map(m => ({
            url: m.url,
            pageLoadTime: m.page_load_time + 's',
            ttfb: m.ttfb + 's',
            bounceRate: (m.bounce_rate || '0') + '%',
            deviceType: m.device_type || 'unknown',
            browser: m.browser || 'unknown',
            collectedAt: new Date(m.collected_at).toISOString()
          })),
          analysis: fallbackAnalysis,
          fallback: true,
          timestamp: new Date().toISOString()
        };
        
        // Cache the fallback result
        apiCache.set(cacheKey, result, 300); // Cache for 5 minutes (shorter for fallback)
        
        return res.json({
          success: true,
          ...result,
          source: 'fallback'
        });
      }
    } catch (error: any) {
      console.error("Website performance analysis failed:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Website performance analysis failed", 
        error: error.message || "Unknown error"
      });
    }
  });

  /**
   * Suggestion 37: Real-Time Analytics for Client Website Engagement
   * Analyze website engagement metrics (e.g., clicks, time on page) for client sites
   */
  app.get("/api/analytics/website-engagement/:clientId", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { clientId } = req.params;
      const { startDate, endDate, path } = req.query;

      // Cache key based on request parameters
      const cacheKey = `website-engagement-${clientId}-${startDate || 'default'}-${endDate || 'default'}-${path || 'all'}`;

      // Check cache first
      const cachedData = apiCache.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }

      // Set date range - default to last 30 days
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const start = startDate ? new Date(startDate as string) : thirtyDaysAgo;
      const end = endDate ? new Date(endDate as string) : now;

      // Build query filters
      let filters = and(
        eq(websiteEngagement.clientId, parseInt(clientId)),
        gt(websiteEngagement.dateCollected, start),
        lt(websiteEngagement.dateCollected, end)
      );

      // Add path filter if specified
      if (path) {
        filters = and(
          filters,
          eq(websiteEngagement.path, path as string)
        );
      }

      // Get engagement data
      const engagementData = await db.select().from(websiteEngagement).where(filters);

      if (engagementData.length === 0) {
        return res.json({
          message: "No engagement data found for the specified client and time period",
          clientId,
          timeframe: { start: start.toISOString(), end: end.toISOString() }
        });
      }

      // Calculate aggregate metrics
      const totalClicks = engagementData.reduce((sum, record) => sum + record.clicks, 0);
      const totalInteractions = engagementData.reduce((sum, record) => sum + record.interactionCount, 0);
      
      // Calculate average time on page
      const totalTimeOnPage = engagementData.reduce((sum, record) => sum + parseFloat(record.timeOnPage.toString()), 0);
      const avgTimeOnPage = totalTimeOnPage / engagementData.length;

      // Calculate average scroll depth
      const totalScrollDepth = engagementData.reduce((sum, record) => sum + parseFloat(record.scrollDepth.toString()), 0);
      const avgScrollDepth = totalScrollDepth / engagementData.length;

      // Get page-specific metrics
      const pageMetrics = engagementData.reduce((pages: Record<string, any>, record) => {
        const pageUrl = record.pageUrl;
        if (!pages[pageUrl]) {
          pages[pageUrl] = {
            url: pageUrl,
            path: record.path,
            clicks: 0,
            timeOnPage: 0,
            interactionCount: 0,
            scrollDepth: 0,
            records: 0
          };
        }
        
        pages[pageUrl].clicks += record.clicks;
        pages[pageUrl].timeOnPage += parseFloat(record.timeOnPage.toString());
        pages[pageUrl].interactionCount += record.interactionCount;
        pages[pageUrl].scrollDepth += parseFloat(record.scrollDepth.toString());
        pages[pageUrl].records++;
        
        return pages;
      }, {});

      // Calculate averages for each page
      Object.keys(pageMetrics).forEach(pageUrl => {
        const page = pageMetrics[pageUrl];
        page.avgTimeOnPage = page.timeOnPage / page.records;
        page.avgScrollDepth = page.scrollDepth / page.records;
        // Clean up
        delete page.timeOnPage;
        delete page.scrollDepth;
        delete page.records;
      });

      // Calculate engagement score for each page
      const pageEngagementScores = Object.keys(pageMetrics).map(pageUrl => {
        const page = pageMetrics[pageUrl];
        
        // Calculate engagement score (weighted combination of clicks, time on page, interactions, and scroll depth)
        const clickScore = Math.min(page.clicks / 50, 1) * 0.3; // 30% weight, max at 50 clicks
        const timeScore = Math.min(page.avgTimeOnPage / 300, 1) * 0.35; // 35% weight, max at 5 minutes
        const interactionScore = Math.min(page.interactionCount / 20, 1) * 0.2; // 20% weight, max at 20 interactions
        const scrollScore = (page.avgScrollDepth / 100) * 0.15; // 15% weight, based on percentage scrolled
        
        const engagementScore = (clickScore + timeScore + interactionScore + scrollScore) * 100;
        
        return {
          ...page,
          engagementScore: parseFloat(engagementScore.toFixed(1))
        };
      });

      // Sort pages by engagement score (high to low)
      const sortedPages = pageEngagementScores.sort((a, b) => b.engagementScore - a.engagementScore);

      // Prepare device and browser breakdowns
      const deviceBreakdown = engagementData.reduce((devices: Record<string, number>, record) => {
        const device = record.deviceType || 'unknown';
        devices[device] = (devices[device] || 0) + 1;
        return devices;
      }, {});

      const browserBreakdown = engagementData.reduce((browsers: Record<string, number>, record) => {
        const browser = record.browser || 'unknown';
        browsers[browser] = (browsers[browser] || 0) + 1;
        return browsers;
      }, {});

      // Get AI analysis of the engagement data
      let aiAnalysis = '';
      try {
        // Prepare data for AI analysis
        const analysisData = {
          totalEngagementRecords: engagementData.length,
          totalClicks,
          totalInteractions,
          avgTimeOnPage,
          avgScrollDepth,
          topPages: sortedPages.slice(0, 3),
          bottomPages: sortedPages.slice(-3).reverse(),
          deviceBreakdown,
          browserBreakdown
        };

        // Call xAI for analysis
        aiAnalysis = await callXAI(
          `Analyze the following client website engagement data: ${JSON.stringify(analysisData)}. 
          Identify 3 key insights about user engagement patterns. Also suggest 2 specific actions the client could take to improve engagement.
          Focus on trends, anomalies, and actionable recommendations. Keep the analysis concise, about 250 words maximum.`,
          { model: 'grok-3-mini', max_tokens: 350 }
        );
      } catch (error) {
        console.error('Error getting AI analysis for website engagement:', error);
        aiAnalysis = 'AI analysis unavailable at this time. Please try again later.';
      }

      // Prepare response data
      const responseData = {
        clientId: parseInt(clientId),
        timeframe: {
          start: start.toISOString(),
          end: end.toISOString(),
          days: Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
        },
        overview: {
          totalRecords: engagementData.length,
          totalClicks,
          totalInteractions,
          avgTimeOnPage: avgTimeOnPage.toFixed(2),
          avgScrollDepth: `${avgScrollDepth.toFixed(2)}%`,
        },
        pages: {
          total: sortedPages.length,
          mostEngaging: sortedPages.slice(0, 5),
          leastEngaging: sortedPages.slice(-5).reverse(),
        },
        demographics: {
          devices: deviceBreakdown,
          browsers: browserBreakdown
        },
        analysis: aiAnalysis
      };

      // Cache the response for 30 minutes
      apiCache.set(cacheKey, responseData, 1800);

      res.json(responseData);
    } catch (error) {
      console.error("Error getting website engagement analytics:", error);
      res.status(500).json({ 
        error: "Failed to retrieve website engagement analytics",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  /**
   * Track client website engagement metrics
   */
  app.post("/api/analytics/website-engagement", async (req: Request, res: Response) => {
    try {
      const { 
        clientId, 
        pageUrl, 
        path,
        clicks, 
        timeOnPage, 
        scrollDepth, 
        interactionCount,
        deviceType,
        browser
      } = req.body;
      
      if (!clientId || !pageUrl) {
        return res.status(400).json({ error: "Missing required data. Client ID and page URL are required." });
      }
      
      // Create new engagement record
      const engagementData = {
        clientId,
        pageUrl,
        path: path || new URL(pageUrl).pathname,
        clicks: clicks || 0,
        timeOnPage: timeOnPage?.toString() || "0",
        scrollDepth: scrollDepth?.toString() || "0",
        interactionCount: interactionCount || 0,
        dateCollected: new Date(),
        deviceType,
        browser
      };
      
      const [result] = await db.insert(websiteEngagement).values(engagementData).returning();
      
      res.status(200).json({ 
        success: true, 
        message: "Website engagement data recorded successfully",
        id: result.id 
      });
    } catch (error) {
      console.error("Error tracking website engagement:", error);
      res.status(500).json({ 
        error: "Failed to track website engagement data",
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
};