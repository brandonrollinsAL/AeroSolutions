import { db } from '../db';
import { 
  subscriptionPlans, 
  userSubscriptions, 
  priceRecommendations, 
  subscriptionPriceHistory,
  userSessions,
  contentViewMetrics,
  userDataChangeLogs,
  PriceRecommendation
} from '@shared/schema';
import { and, eq, gt, sql, desc, count } from 'drizzle-orm';
import { storage } from '../storage';
import { generateJson } from './xaiClient';

interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  averageSessionDuration: number;
  churnRate: number;
  conversionRate: number;
  planDistribution: Record<string, number>;
}

interface MarketData {
  factor: string;
  impact: number;
  description: string;
}

interface CompetitorData {
  competitor: string;
  price: number;
  features: string[];
  comparison: string;
}

export class PriceOptimizationService {
  /**
   * Analyze subscription plan data and user metrics to generate price recommendations
   * @param planId The ID of the subscription plan to analyze
   */
  async generatePriceRecommendation(planId: number): Promise<PriceRecommendation | null> {
    try {
      // Get the subscription plan
      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        throw new Error(`Subscription plan with ID ${planId} not found`);
      }

      // Get user metrics
      const userMetrics = await this.getUserMetrics(planId);

      // Get market trends data
      const marketTrends = await this.getMarketTrendsData();

      // Get competitive analysis data
      const competitiveAnalysis = await this.getCompetitiveAnalysis(plan.name, plan.features);

      // Prepare data for AI analysis
      const analysisData = {
        plan: {
          id: plan.id,
          name: plan.name,
          description: plan.description,
          currentPrice: plan.price,
          interval: plan.interval,
          features: plan.features,
          createdAt: plan.createdAt,
        },
        userMetrics,
        marketTrends,
        competitiveAnalysis
      };

      // Generate price recommendation using XAI
      const recommendationData = await this.analyzeDataForPriceRecommendation(analysisData);
      
      // Calculate percent change
      const percentChange = ((recommendationData.recommendedPrice - Number(plan.price)) / Number(plan.price)) * 100;
      
      // Create and save the recommendation
      const newRecommendation = await storage.createPriceRecommendation({
        planId: plan.id,
        currentPrice: plan.price.toString(),
        recommendedPrice: recommendationData.recommendedPrice.toString(),
        percentChange: percentChange.toString(),
        analysisData: recommendationData,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      });
      
      return newRecommendation;
    } catch (error) {
      console.error('Error generating price recommendation:', error);
      return null;
    }
  }

  /**
   * Apply a price recommendation to update subscription plan pricing
   * @param recommendationId The ID of the recommendation to apply
   * @param userId The ID of the user applying the recommendation
   */
  async applyPriceRecommendation(recommendationId: number, userId: number): Promise<boolean> {
    try {
      // Get the recommendation
      const recommendation = await storage.getPriceRecommendation(recommendationId);
      if (!recommendation || recommendation.status !== 'approved') {
        throw new Error(`Recommendation ${recommendationId} not found or not approved`);
      }
      
      // Get the subscription plan
      const plan = await storage.getSubscriptionPlan(recommendation.planId);
      if (!plan) {
        throw new Error(`Subscription plan with ID ${recommendation.planId} not found`);
      }
      
      // Create price history record
      await storage.createPriceHistory({
        planId: plan.id,
        previousPrice: plan.price.toString(),
        newPrice: recommendation.recommendedPrice,
        changeReason: `Applied recommendation ID ${recommendationId}`,
        aiAnalysis: {
          marketFactors: recommendation.analysisData.marketTrends.map(t => t.factor),
          competitiveAnalysis: JSON.stringify(recommendation.analysisData.competitiveAnalysis),
          userImpact: JSON.stringify(recommendation.analysisData.userMetrics),
          recommendedAdjustment: Number(recommendation.percentChange),
          confidence: recommendation.analysisData.confidenceScore,
        },
        changedByUserId: userId,
        isAutomatic: false,
        appliedAt: new Date(),
      });
      
      // Update the subscription plan price
      await storage.updateSubscriptionPlan(plan.id, {
        price: recommendation.recommendedPrice,
      });
      
      // Update the recommendation status
      await storage.updatePriceRecommendation(recommendationId, {
        status: 'applied',
      });
      
      return true;
    } catch (error) {
      console.error('Error applying price recommendation:', error);
      return false;
    }
  }
  
  /**
   * Schedule automatic analysis of all subscription plans to generate recommendations
   */
  async scheduleAutomaticPriceAnalysis(): Promise<void> {
    try {
      // Get all active subscription plans
      const plans = await storage.getActiveSubscriptionPlans();
      
      // Generate recommendations for each plan
      for (const plan of plans) {
        // Check if there's an existing recommendation in the last 7 days
        const existingRecommendations = await storage.getPriceRecommendations('pending');
        const recentRecommendation = existingRecommendations.find(
          rec => rec.planId === plan.id && 
          new Date(rec.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
        );
        
        // Skip if there's a recent recommendation
        if (recentRecommendation) {
          console.log(`Skipping analysis for plan ${plan.id}, recent recommendation exists`);
          continue;
        }
        
        // Generate new recommendation
        await this.generatePriceRecommendation(plan.id);
      }
    } catch (error) {
      console.error('Error scheduling automatic price analysis:', error);
    }
  }

  /**
   * Get user metrics for a specific subscription plan
   */
  private async getUserMetrics(planId: number): Promise<UserMetrics> {
    // Get total users
    const totalUsersResult = await db.select({ count: count() }).from(userSubscriptions);
    const totalUsers = totalUsersResult[0]?.count || 0;
    
    // Get active users (with active subscription)
    const activeUsersResult = await db.select({ count: count() }).from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.planId, planId),
          eq(userSubscriptions.status, 'active')
        )
      );
    const activeUsers = activeUsersResult[0]?.count || 0;
    
    // Get average session duration
    const sessionResult = await db.select({
      avgDuration: sql<number>`AVG(${userSessions.sessionDuration})`
    }).from(userSessions);
    const averageSessionDuration = sessionResult[0]?.avgDuration || 0;
    
    // Calculate approximate churn rate based on cancelled subscriptions
    const cancelledResult = await db.select({ count: count() }).from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.planId, planId),
          eq(userSubscriptions.status, 'cancelled'),
          gt(userSubscriptions.updatedAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
        )
      );
    const cancelledCount = cancelledResult[0]?.count || 0;
    const churnRate = activeUsers > 0 ? (cancelledCount / activeUsers) * 100 : 0;
    
    // Get conversion rate from content views
    const contentViews = await db.select({
      conversionRate: sql<number>`AVG(${contentViewMetrics.conversionRate})`
    }).from(contentViewMetrics);
    const conversionRate = contentViews[0]?.conversionRate || 0;
    
    // Get plan distribution
    const planDistribution: Record<string, number> = {};
    const allPlans = await storage.getActiveSubscriptionPlans();
    for (const plan of allPlans) {
      const planUsersResult = await db.select({ count: count() }).from(userSubscriptions)
        .where(
          and(
            eq(userSubscriptions.planId, plan.id),
            eq(userSubscriptions.status, 'active')
          )
        );
      planDistribution[plan.name] = planUsersResult[0]?.count || 0;
    }
    
    return {
      totalUsers,
      activeUsers,
      averageSessionDuration,
      churnRate,
      conversionRate,
      planDistribution
    };
  }

  /**
   * Get market trends data
   */
  private async getMarketTrendsData(): Promise<MarketData[]> {
    // In a real implementation, this would fetch external market data
    // For now, we'll return some static market factors
    return [
      {
        factor: "Inflation rate",
        impact: 0.75,
        description: "Current annual inflation rate is affecting purchasing power."
      },
      {
        factor: "Web development market growth",
        impact: 0.85,
        description: "The web development market is growing at 18% annually."
      },
      {
        factor: "Small business tech adoption",
        impact: 0.8,
        description: "Small businesses are increasing tech spending by 12%."
      },
      {
        factor: "Seasonal trends",
        impact: 0.65,
        description: "Q2 typically shows 7% higher conversion rates than Q1."
      },
      {
        factor: "AI service pricing",
        impact: 0.9,
        description: "AI-enhanced services command a 25-40% premium over basic services."
      }
    ];
  }

  /**
   * Get competitive analysis data
   */
  private async getCompetitiveAnalysis(planName: string, features: string[]): Promise<CompetitorData[]> {
    // In a real implementation, this would fetch competitor data from a database or API
    // For now, we'll return some static competitor data based on the plan name
    const competitors: CompetitorData[] = [
      {
        competitor: "WebGenius",
        price: planName.includes("Basic") ? 19.99 : planName.includes("Pro") ? 49.99 : 99.99,
        features: ["Responsive Design", "CMS Integration", "SEO Optimization"],
        comparison: planName.includes("Basic") ? "Similar features but higher price point" : "Fewer AI features but established brand"
      },
      {
        competitor: "SiteBuilder Pro",
        price: planName.includes("Basic") ? 14.99 : planName.includes("Pro") ? 39.99 : 79.99,
        features: ["Template Library", "Analytics Dashboard", "Email Marketing"],
        comparison: "Less comprehensive services but competitive pricing"
      },
      {
        competitor: "DigitalCraft",
        price: planName.includes("Basic") ? 24.99 : planName.includes("Pro") ? 59.99 : 119.99,
        features: ["Custom Code Access", "Advanced Security", "Premium Support"],
        comparison: "Higher price point but includes additional technical support"
      },
      {
        competitor: "AIWebSolutions",
        price: planName.includes("Basic") ? 29.99 : planName.includes("Pro") ? 69.99 : 149.99,
        features: ["AI Content Generation", "Smart Layout Suggestions", "Automated SEO"],
        comparison: "Similar AI offerings but at a significant premium"
      }
    ];
    
    return competitors;
  }

  /**
   * Analyze data using XAI to generate price recommendations
   */
  private async analyzeDataForPriceRecommendation(data: any): Promise<any> {
    const systemPrompt = `You are an AI pricing strategist specializing in SaaS and subscription business models. 
    Analyze the provided data about a subscription plan, user metrics, market trends, and competitive intelligence to generate
    an optimal price recommendation. Focus on maximizing revenue while maintaining competitiveness and customer value.
    
    Your response should be a detailed JSON object with pricing recommendations, reasoning, and projected impacts.`;
    
    const prompt = `
    Please analyze the following subscription plan and market data to generate a price recommendation:
    
    SUBSCRIPTION PLAN DATA:
    ${JSON.stringify(data.plan, null, 2)}
    
    USER METRICS:
    ${JSON.stringify(data.userMetrics, null, 2)}
    
    MARKET TRENDS:
    ${JSON.stringify(data.marketTrends, null, 2)}
    
    COMPETITIVE ANALYSIS:
    ${JSON.stringify(data.competitiveAnalysis, null, 2)}
    
    Based on this data, determine the optimal price point for this subscription plan.
    The recommendation should include:
    1. The current price
    2. The recommended price
    3. Market trends analysis with impact estimates
    4. User metrics analysis showing how various metrics influenced the recommendation
    5. Competitive analysis comparing the plan to competitors
    6. Projected impact on revenue, user retention, and new subscriptions
    7. Detailed reasoning for the recommendation
    8. A confidence score (0-1) for the recommendation
    
    Format your response as a JSON object with these sections.
    `;
    
    try {
      return await generateJson(prompt, {
        model: 'grok-3',
        systemPrompt,
        temperature: 0.2,
        maxTokens: 2000
      });
    } catch (error) {
      console.error('Error calling XAI for price recommendation:', error);
      // Return a default structure with the original price
      return {
        currentPrice: parseFloat(data.plan.currentPrice),
        recommendedPrice: parseFloat(data.plan.currentPrice),
        marketTrends: [],
        userMetrics: [],
        competitiveAnalysis: [],
        projectedImpact: {
          revenue: 0,
          userRetention: 0,
          newSubscriptions: 0
        },
        reasoning: "Unable to generate recommendation due to API error.",
        confidenceScore: 0
      };
    }
  }
}

export const priceOptimizationService = new PriceOptimizationService();