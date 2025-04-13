import { 
  users, type User, type InsertUser,
  contactSubmissions, type Contact, type InsertContact,
  clientPreviews, type ClientPreview, type InsertClientPreview,
  subscriptionPlans, type SubscriptionPlan, type InsertSubscriptionPlan,
  userSubscriptions, type UserSubscription, type InsertUserSubscription,
  marketplaceItems, type MarketplaceItem, type InsertMarketplaceItem,
  marketplaceOrders, type MarketplaceOrder, type InsertMarketplaceOrder,
  advertisements, type Advertisement, type InsertAdvertisement,
  userSessions, contentViewMetrics, feedback,
  type UserSession, type ContentViewMetric, type Feedback,
  type InsertUserSession, type InsertContentViewMetric, type InsertFeedback,
  posts, mockupRequests, mockupEngagement, marketplaceServiceEngagement,
  type MockupRequest, type InsertMockupRequest, type MarketplaceServiceEngagement,
  priceRecommendations, subscriptionPriceHistory,
  type PriceRecommendation, type InsertPriceRecommendation,
  type PriceHistory, type InsertPriceHistory
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gt, lt, sql, desc, asc, ilike, or } from "drizzle-orm";

// Extend the interface with needed CRUD methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined>;
  validateUserCredentials(username: string, password: string): Promise<User | undefined>;
  updateUserVerification(userId: number, verified: boolean): Promise<User>;
  
  // User onboarding methods
  createUserOnboarding(onboarding: InsertUserOnboarding): Promise<UserOnboarding>;
  getUserOnboarding(userId: number): Promise<UserOnboarding | undefined>;
  updateUserOnboarding(userId: number, data: Partial<InsertUserOnboarding>): Promise<UserOnboarding>;
  getOnboardingCompletionRate(): Promise<{ completed: number, total: number, rate: number }>;
  generatePersonalizedOnboarding(userId: number, businessType: string): Promise<string>;
  
  // Contact methods
  createContactSubmission(contact: InsertContact): Promise<Contact>;
  getContactSubmissions(): Promise<Contact[]>;
  
  // Client Preview methods
  createClientPreview(preview: InsertClientPreview): Promise<ClientPreview>;
  getClientPreviewByCode(code: string): Promise<ClientPreview | undefined>;
  validateClientPreviewCode(code: string): Promise<boolean>;
  
  // Subscription methods
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  getAllSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined>;
  createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription>;
  getUserSubscriptions(userId: number): Promise<UserSubscription[]>;
  getUserActiveSubscription(userId: number): Promise<UserSubscription | undefined>;
  updateUserSubscription(id: number, data: Partial<InsertUserSubscription>): Promise<UserSubscription>;
  updateSubscriptionPlan(id: number, data: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan>;
  
  // Price optimization methods
  createPriceRecommendation(recommendation: InsertPriceRecommendation): Promise<PriceRecommendation>;
  getPriceRecommendations(status?: string): Promise<PriceRecommendation[]>;
  getPriceRecommendation(id: number): Promise<PriceRecommendation | undefined>;
  updatePriceRecommendation(id: number, data: Partial<PriceRecommendation>): Promise<PriceRecommendation>;
  createPriceHistory(history: InsertPriceHistory): Promise<PriceHistory>;
  getPriceHistory(planId: number): Promise<PriceHistory[]>;
  
  // Marketplace methods
  createMarketplaceItem(item: InsertMarketplaceItem): Promise<MarketplaceItem>;
  getAllMarketplaceItems(): Promise<MarketplaceItem[]>;
  getAvailableMarketplaceItems(): Promise<MarketplaceItem[]>;
  getMarketplaceItem(id: number): Promise<MarketplaceItem | undefined>;
  updateMarketplaceItem(id: number, data: Partial<InsertMarketplaceItem>): Promise<MarketplaceItem>;
  createMarketplaceOrder(order: InsertMarketplaceOrder): Promise<MarketplaceOrder>;
  getUserMarketplaceOrders(userId: number): Promise<MarketplaceOrder[]>;
  updateMarketplaceOrder(id: number, data: Partial<InsertMarketplaceOrder>): Promise<MarketplaceOrder>;
  
  // Advertisement methods
  createAdvertisement(ad: InsertAdvertisement): Promise<Advertisement>;
  getAllAdvertisements(): Promise<Advertisement[]>;
  getActiveAdvertisements(): Promise<Advertisement[]>;
  getActiveAdvertisementsByType(type: string): Promise<Advertisement[]>;
  getAdvertisement(id: number): Promise<Advertisement | undefined>;
  updateAdvertisement(id: number, data: Partial<InsertAdvertisement>): Promise<Advertisement>;
  incrementAdImpressions(id: number): Promise<void>;
  incrementAdClicks(id: number): Promise<void>;
  
  // Search methods
  searchPosts(query: string): Promise<any[]>;
  searchMarketplaceItems(query: string): Promise<any[]>;
  searchServices(query: string): Promise<any[]>;
  
  // Feedback methods
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  getFeedback(id: number): Promise<Feedback | undefined>;
  getAllFeedback(limit?: number, status?: string): Promise<Feedback[]>;
  updateFeedbackStatus(id: number, status: string): Promise<Feedback | undefined>;
  
  // Mockup requests methods
  createMockupRequest(request: InsertMockupRequest): Promise<MockupRequest>;
  getMockupRequest(id: number): Promise<MockupRequest | undefined>;
  getUserMockupRequests(userId: number): Promise<MockupRequest[]>;
  updateMockupRequest(id: number, data: Partial<MockupRequest>): Promise<MockupRequest>;
  getRecentMockupRequests(limit?: number): Promise<MockupRequest[]>;
  getMockupRequestsByStatus(status: string, limit?: number): Promise<MockupRequest[]>;
  
  // Marketplace service engagement methods
  getMarketplaceServiceEngagement(): Promise<any[]>;
  trackServiceClick(serviceId: number): Promise<boolean>;
  trackServiceInquiry(serviceId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [user] = await db.update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId));
    return user;
  }
  
  async validateUserCredentials(username: string, password: string): Promise<User | undefined> {
    const user = await this.getUserByUsername(username);
    if (!user) return undefined;
    
    // In a real application, we'd verify the password against a hashed value
    // using bcrypt.compare. For now, we'll return the user.
    return user;
  }
  
  async updateUserVerification(userId: number, verified: boolean): Promise<User> {
    const [user] = await db.update(users)
      .set({ 
        verified, 
        verificationToken: verified ? null : users.verificationToken, 
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
  
  // User onboarding methods
  async createUserOnboarding(onboarding: InsertUserOnboarding): Promise<UserOnboarding> {
    const [userOnboardingRecord] = await db.insert(userOnboarding).values(onboarding).returning();
    return userOnboardingRecord;
  }
  
  async getUserOnboarding(userId: number): Promise<UserOnboarding | undefined> {
    const [userOnboardingRecord] = await db.select().from(userOnboarding).where(eq(userOnboarding.userId, userId));
    return userOnboardingRecord;
  }
  
  async updateUserOnboarding(userId: number, data: Partial<InsertUserOnboarding>): Promise<UserOnboarding> {
    const [userOnboardingRecord] = await db.update(userOnboarding)
      .set({ ...data, updatedAt: new Date(), lastEngagedAt: new Date() })
      .where(eq(userOnboarding.userId, userId))
      .returning();
    return userOnboardingRecord;
  }
  
  async getOnboardingCompletionRate(): Promise<{ completed: number, total: number, rate: number }> {
    const allUsers = await db.select().from(users);
    const completedOnboardingUsers = allUsers.filter(user => user.onboardingComplete);
    
    const completedCount = completedOnboardingUsers.length;
    const totalCount = allUsers.length;
    const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    
    return {
      completed: completedCount,
      total: totalCount,
      rate: completionRate
    };
  }
  
  async generatePersonalizedOnboarding(userId: number, businessType: string): Promise<string> {
    try {
      // Get the user data
      const user = await this.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // This would normally call an AI service to generate personalized onboarding tips
      // Here we're implementing a placeholder that returns a basic message based on business type
      const businessTypeMap: Record<string, string> = {
        'ecommerce': 'Focus on setting up product listings, payment processing, and cart functionality.',
        'service': 'Build out your service offerings, booking system, and testimonials section.',
        'blog': 'Create a content calendar, set up categories, and implement newsletter signup.',
        'portfolio': 'Showcase your best work with high-quality images and detailed project descriptions.',
        'business': 'Highlight your team, services, and include strong calls-to-action on every page.'
      };
      
      const defaultTips = 'Welcome to Elevion! Start by completing your profile and exploring our web development marketplace.';
      const personalizedTips = businessTypeMap[businessType.toLowerCase()] || defaultTips;
      
      return personalizedTips;
    } catch (error) {
      console.error('Error generating personalized onboarding:', error);
      return 'Welcome to Elevion! Start by exploring our web development marketplace and tools.';
    }
  }
  
  // Contact methods
  async createContactSubmission(contact: InsertContact): Promise<Contact> {
    const [contactSubmission] = await db.insert(contactSubmissions).values(contact).returning();
    return contactSubmission;
  }
  
  async getContactSubmissions(): Promise<Contact[]> {
    return await db.select().from(contactSubmissions);
  }
  
  // Client Preview methods
  async createClientPreview(preview: InsertClientPreview): Promise<ClientPreview> {
    const [clientPreview] = await db.insert(clientPreviews).values(preview).returning();
    return clientPreview;
  }
  
  async getClientPreviewByCode(code: string): Promise<ClientPreview | undefined> {
    const now = new Date();
    const [preview] = await db.select().from(clientPreviews).where(
      and(
        eq(clientPreviews.code, code),
        eq(clientPreviews.isActive, true),
        gt(clientPreviews.expiresAt, now)
      )
    );
    return preview;
  }
  
  async validateClientPreviewCode(code: string): Promise<boolean> {
    const preview = await this.getClientPreviewByCode(code);
    return !!preview;
  }

  // Initialize sample data for client previews and analytics
  async initSampleData(): Promise<void> {
    try {
      // Check if we already have preview codes
      const existingPreviews = await db.select().from(clientPreviews);
      
      // Only add sample data if there are no existing previews
      if (existingPreviews.length === 0) {
        const samplePreviews: InsertClientPreview[] = [
          {
            code: "AERO123",
            clientName: "SkyHigh Airlines",
            projectId: 1,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            isActive: true
          },
          {
            code: "EXEC456",
            clientName: "Elite Air Charter",
            projectId: 2,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            isActive: true
          },
          {
            code: "momanddad",
            clientName: "Rollins Family Demo",
            projectId: 3,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            isActive: true
          }
        ];
        
        await db.insert(clientPreviews).values(samplePreviews);
      }
      
      // Initialize analytics data if needed
      const sessionsExist = await db.select().from(userSessions).limit(1);
      if (!sessionsExist || sessionsExist.length === 0) {
        await this.initAnalyticsSampleData();
      }
    } catch (error) {
      console.error("Error initializing sample data:", error);
    }
  }
  
  // Analytics methods
  async initAnalyticsSampleData(): Promise<void> {
    try {
      console.log('Initializing analytics sample data');
      
      // Get all users
      const allUsers = await db.select().from(users);
      
      if (allUsers.length === 0) {
        console.log('No users found for generating sample analytics data');
        return;
      }
      
      // Create sample user sessions for analytics
      const now = new Date();
      const oneDayMs = 24 * 60 * 60 * 1000;
      
      // Create session data for each user for the past 30 days
      const sampleSessions = [];
      
      for (const user of allUsers) {
        // Random number of sessions (1-20)
        const numSessions = Math.floor(Math.random() * 20) + 1;
        
        for (let i = 0; i < numSessions; i++) {
          // Random date within the last 30 days
          const daysAgo = Math.floor(Math.random() * 30);
          const sessionDate = new Date(now.getTime() - (daysAgo * oneDayMs));
          
          // Random session duration between 1 and 120 minutes (in seconds)
          const durationSeconds = Math.floor(Math.random() * 7200) + 60;
          
          // Random device type
          const deviceTypes = ['desktop', 'mobile', 'tablet'];
          const device = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
          
          // Random browser
          const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
          const browser = browsers[Math.floor(Math.random() * browsers.length)];
          
          // End time (session start + duration)
          const endTime = new Date(sessionDate.getTime() + (durationSeconds * 1000));
          
          sampleSessions.push({
            userId: user.id,
            sessionDuration: durationSeconds.toString(),
            startTime: sessionDate,
            endTime: endTime,
            device: device,
            browser: browser,
            ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            referrer: Math.random() > 0.7 ? 'google.com' : (Math.random() > 0.5 ? 'facebook.com' : null)
          });
          
          // Update the user's last login time for more recent users
          if (daysAgo < 5 && !user.lastLoginAt) {
            await db.update(users)
              .set({ lastLoginAt: sessionDate })
              .where(eq(users.id, user.id));
          }
        }
      }
      
      // Insert the sample sessions
      if (sampleSessions.length > 0) {
        await db.insert(userSessions).values(sampleSessions);
        console.log(`Created ${sampleSessions.length} sample user sessions for analytics`);
      }
      
      // Create content view metrics for sample data
      const contentItems = [
        { id: 1, title: 'Web Development Trends', type: 'blog' },
        { id: 2, title: 'Small Business Website Guide', type: 'guide' },
        { id: 3, title: 'SEO Best Practices', type: 'blog' },
        { id: 4, title: 'E-commerce Solutions', type: 'service' },
        { id: 5, title: 'Responsive Design Principles', type: 'blog' },
        { id: 6, title: 'Mobile App Development Process', type: 'guide' },
        { id: 7, title: 'Digital Marketing Strategies', type: 'blog' },
        { id: 8, title: 'Improving Website Performance', type: 'service' }
      ];
      
      const sampleContentMetrics = [];
      
      for (const content of contentItems) {
        // Random metrics
        const views = Math.floor(Math.random() * 300) + 50;
        const uniqueViews = Math.floor(views * (0.6 + (Math.random() * 0.3)));
        const avgTimeOnPage = (Math.random() * 4 + 1).toFixed(2);
        const bounceRate = (Math.random() * 60 + 10).toFixed(2);
        const conversionRate = (Math.random() * 5 + 0.5).toFixed(2);
        
        sampleContentMetrics.push({
          contentId: content.id,
          contentType: content.type,
          contentTitle: content.title,
          views: views,
          uniqueViews: uniqueViews,
          avgTimeOnPage: avgTimeOnPage,
          bounceRate: bounceRate,
          conversionRate: conversionRate
        });
      }
      
      // Insert the sample content metrics
      if (sampleContentMetrics.length > 0) {
        await db.insert(contentViewMetrics).values(sampleContentMetrics);
        console.log(`Created ${sampleContentMetrics.length} sample content view metrics for analytics`);
      }
      
    } catch (error) {
      console.error("Error initializing analytics sample data:", error);
    }
  }
  
  // Subscription methods
  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [subscriptionPlan] = await db.insert(subscriptionPlans).values(plan).returning();
    return subscriptionPlan;
  }
  
  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans).orderBy(asc(subscriptionPlans.price));
  }
  
  async getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(asc(subscriptionPlans.price));
  }
  
  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return plan;
  }
  
  async createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription> {
    const [userSubscription] = await db.insert(userSubscriptions).values(subscription).returning();
    return userSubscription;
  }
  
  async getUserSubscriptions(userId: number): Promise<UserSubscription[]> {
    return await db.select().from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId))
      .orderBy(desc(userSubscriptions.createdAt));
  }
  
  async getUserActiveSubscription(userId: number): Promise<UserSubscription | undefined> {
    const now = new Date();
    const [subscription] = await db.select().from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, 'active'),
          gt(userSubscriptions.currentPeriodEnd, now)
        )
      )
      .orderBy(desc(userSubscriptions.createdAt));
    return subscription;
  }
  
  async updateUserSubscription(id: number, data: Partial<InsertUserSubscription>): Promise<UserSubscription> {
    const [subscription] = await db.update(userSubscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userSubscriptions.id, id))
      .returning();
    return subscription;
  }
  
  async updateSubscriptionPlan(id: number, data: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan> {
    const [plan] = await db.update(subscriptionPlans)
      .set(data)
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return plan;
  }
  
  // Price optimization methods
  async createPriceRecommendation(recommendation: InsertPriceRecommendation): Promise<PriceRecommendation> {
    const [priceRecommendation] = await db.insert(priceRecommendations).values(recommendation).returning();
    return priceRecommendation;
  }
  
  async getPriceRecommendations(status?: string): Promise<PriceRecommendation[]> {
    if (status) {
      return await db.select()
        .from(priceRecommendations)
        .where(eq(priceRecommendations.status, status))
        .orderBy(desc(priceRecommendations.createdAt));
    }
    return await db.select()
      .from(priceRecommendations)
      .orderBy(desc(priceRecommendations.createdAt));
  }
  
  async getPriceRecommendation(id: number): Promise<PriceRecommendation | undefined> {
    const [recommendation] = await db.select()
      .from(priceRecommendations)
      .where(eq(priceRecommendations.id, id));
    return recommendation;
  }
  
  async updatePriceRecommendation(id: number, data: Partial<PriceRecommendation>): Promise<PriceRecommendation> {
    const [recommendation] = await db.update(priceRecommendations)
      .set(data)
      .where(eq(priceRecommendations.id, id))
      .returning();
    return recommendation;
  }
  
  async createPriceHistory(history: InsertPriceHistory): Promise<PriceHistory> {
    const [priceHistory] = await db.insert(subscriptionPriceHistory).values(history).returning();
    return priceHistory;
  }
  
  async getPriceHistory(planId: number): Promise<PriceHistory[]> {
    return await db.select()
      .from(subscriptionPriceHistory)
      .where(eq(subscriptionPriceHistory.planId, planId))
      .orderBy(desc(subscriptionPriceHistory.createdAt));
  }
  
  // Marketplace methods
  async createMarketplaceItem(item: InsertMarketplaceItem): Promise<MarketplaceItem> {
    const [marketplaceItem] = await db.insert(marketplaceItems).values(item).returning();
    return marketplaceItem;
  }
  
  async getAllMarketplaceItems(): Promise<MarketplaceItem[]> {
    return await db.select().from(marketplaceItems)
      .orderBy(desc(marketplaceItems.createdAt));
  }
  
  async getAvailableMarketplaceItems(): Promise<MarketplaceItem[]> {
    return await db.select().from(marketplaceItems)
      .where(eq(marketplaceItems.isAvailable, true))
      .orderBy(desc(marketplaceItems.createdAt));
  }
  
  async getMarketplaceItem(id: number): Promise<MarketplaceItem | undefined> {
    const [item] = await db.select().from(marketplaceItems).where(eq(marketplaceItems.id, id));
    return item;
  }
  
  async updateMarketplaceItem(id: number, data: Partial<InsertMarketplaceItem>): Promise<MarketplaceItem> {
    const [item] = await db.update(marketplaceItems)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(marketplaceItems.id, id))
      .returning();
    return item;
  }
  
  async createMarketplaceOrder(order: InsertMarketplaceOrder): Promise<MarketplaceOrder> {
    const [marketplaceOrder] = await db.insert(marketplaceOrders).values(order).returning();
    return marketplaceOrder;
  }
  
  async getUserMarketplaceOrders(userId: number): Promise<MarketplaceOrder[]> {
    return await db.select().from(marketplaceOrders)
      .where(eq(marketplaceOrders.buyerId, userId))
      .orderBy(desc(marketplaceOrders.createdAt));
  }
  
  async updateMarketplaceOrder(id: number, data: Partial<InsertMarketplaceOrder>): Promise<MarketplaceOrder> {
    const [order] = await db.update(marketplaceOrders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(marketplaceOrders.id, id))
      .returning();
    return order;
  }
  
  // Advertisement methods
  async createAdvertisement(ad: InsertAdvertisement): Promise<Advertisement> {
    const [advertisement] = await db.insert(advertisements).values(ad).returning();
    return advertisement;
  }
  
  async getAllAdvertisements(): Promise<Advertisement[]> {
    return await db.select().from(advertisements)
      .orderBy(desc(advertisements.createdAt));
  }
  
  async getActiveAdvertisements(): Promise<Advertisement[]> {
    const now = new Date();
    return await db.select().from(advertisements)
      .where(
        and(
          eq(advertisements.isActive, true),
          lt(advertisements.startDate, now),
          gt(advertisements.endDate, now)
        )
      )
      .orderBy(desc(advertisements.createdAt));
  }
  
  async getActiveAdvertisementsByType(type: string): Promise<Advertisement[]> {
    const now = new Date();
    return await db.select().from(advertisements)
      .where(
        and(
          eq(advertisements.isActive, true),
          eq(advertisements.type, type),
          lt(advertisements.startDate, now),
          gt(advertisements.endDate, now)
        )
      )
      .orderBy(desc(advertisements.createdAt));
  }
  
  async getAdvertisement(id: number): Promise<Advertisement | undefined> {
    const [ad] = await db.select().from(advertisements).where(eq(advertisements.id, id));
    return ad;
  }
  
  async updateAdvertisement(id: number, data: Partial<InsertAdvertisement>): Promise<Advertisement> {
    const [ad] = await db.update(advertisements)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(advertisements.id, id))
      .returning();
    return ad;
  }
  
  async incrementAdImpressions(id: number): Promise<void> {
    await db.update(advertisements)
      .set({ 
        impressions: sql`${advertisements.impressions} + 1`,
        updatedAt: new Date()
      })
      .where(eq(advertisements.id, id));
  }
  
  async incrementAdClicks(id: number): Promise<void> {
    await db.update(advertisements)
      .set({ 
        clicks: sql`${advertisements.clicks} + 1`,
        updatedAt: new Date()
      })
      .where(eq(advertisements.id, id));
  }
  
  // Search methods
  async searchPosts(query: string): Promise<any[]> {
    try {
      // Search in posts table for matching content
      return await db.select().from(posts).where(
        or(
          ilike(posts.title, `%${query}%`),
          ilike(posts.content, `%${query}%`),
          ilike(posts.tags, `%${query}%`)
        )
      ).limit(15);
    } catch (error) {
      console.error("Error searching posts:", error);
      return [];
    }
  }
  
  async searchMarketplaceItems(query: string): Promise<any[]> {
    try {
      // Search in marketplace items for matching content
      return await db.select().from(marketplaceItems).where(
        or(
          ilike(marketplaceItems.name, `%${query}%`),
          ilike(marketplaceItems.description, `%${query}%`),
          ilike(marketplaceItems.category, `%${query}%`)
        )
      ).limit(15);
    } catch (error) {
      console.error("Error searching marketplace items:", error);
      return [];
    }
  }
  
  async searchServices(query: string): Promise<any[]> {
    try {
      // We're filtering marketplaceItems with category='service' to represent services
      // This allows us to use the same table structure for both marketplace items and services
      return await db.select().from(marketplaceItems).where(
        and(
          eq(marketplaceItems.category, 'service'),
          or(
            ilike(marketplaceItems.name, `%${query}%`),
            ilike(marketplaceItems.description, `%${query}%`)
          )
        )
      ).limit(15);
    } catch (error) {
      console.error("Error searching services:", error);
      return [];
    }
  }
  
  // Feedback methods
  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    try {
      const [result] = await db.insert(feedback).values(feedbackData).returning();
      return result;
    } catch (error) {
      console.error("Error creating feedback:", error);
      throw error;
    }
  }
  
  async getFeedback(id: number): Promise<Feedback | undefined> {
    try {
      const [result] = await db.select().from(feedback).where(eq(feedback.id, id));
      return result;
    } catch (error) {
      console.error(`Error getting feedback with ID ${id}:`, error);
      return undefined;
    }
  }
  
  async getAllFeedback(limit: number = 100, status?: string): Promise<Feedback[]> {
    try {
      let query = db.select().from(feedback);
      
      if (status) {
        query = query.where(eq(feedback.status, status));
      }
      
      return await query.orderBy(desc(feedback.createdAt)).limit(limit);
    } catch (error) {
      console.error("Error getting all feedback:", error);
      return [];
    }
  }
  
  async updateFeedbackStatus(id: number, status: string): Promise<Feedback | undefined> {
    try {
      const [result] = await db.update(feedback)
        .set({ status, updatedAt: new Date() })
        .where(eq(feedback.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Error updating feedback status for ID ${id}:`, error);
      return undefined;
    }
  }

  // Mockup requests methods
  async createMockupRequest(request: InsertMockupRequest): Promise<MockupRequest> {
    try {
      const [mockupRequest] = await db.insert(mockupRequests).values(request).returning();
      return mockupRequest;
    } catch (error) {
      console.error("Error creating mockup request:", error);
      throw error;
    }
  }

  async getMockupRequest(id: number): Promise<MockupRequest | undefined> {
    try {
      const [request] = await db.select().from(mockupRequests).where(eq(mockupRequests.id, id));
      return request;
    } catch (error) {
      console.error(`Error getting mockup request with ID ${id}:`, error);
      return undefined;
    }
  }

  async getUserMockupRequests(userId: number): Promise<MockupRequest[]> {
    try {
      return await db.select().from(mockupRequests)
        .where(eq(mockupRequests.userId, userId))
        .orderBy(desc(mockupRequests.createdAt));
    } catch (error) {
      console.error(`Error getting mockup requests for user ID ${userId}:`, error);
      return [];
    }
  }

  async updateMockupRequest(id: number, data: Partial<MockupRequest>): Promise<MockupRequest> {
    try {
      const [request] = await db.update(mockupRequests)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(mockupRequests.id, id))
        .returning();
      return request;
    } catch (error) {
      console.error(`Error updating mockup request with ID ${id}:`, error);
      throw error;
    }
  }

  async getRecentMockupRequests(limit: number = 20): Promise<MockupRequest[]> {
    try {
      return await db.select().from(mockupRequests)
        .orderBy(desc(mockupRequests.createdAt))
        .limit(limit);
    } catch (error) {
      console.error(`Error getting recent mockup requests:`, error);
      return [];
    }
  }

  async getMockupRequestsByStatus(status: string, limit: number = 50): Promise<MockupRequest[]> {
    try {
      return await db.select().from(mockupRequests)
        .where(eq(mockupRequests.status, status))
        .orderBy(desc(mockupRequests.createdAt))
        .limit(limit);
    } catch (error) {
      console.error(`Error getting mockup requests by status ${status}:`, error);
      return [];
    }
  }

  // Marketplace Service Engagement methods
  async getMarketplaceServiceEngagement(): Promise<any[]> {
    try {
      const engagementData = await db.select({
        serviceId: marketplaceServiceEngagement.serviceId,
        serviceName: marketplaceItems.name,
        clicks: marketplaceServiceEngagement.clicks,
        inquiries: marketplaceServiceEngagement.inquiries,
        conversions: marketplaceServiceEngagement.conversions,
        viewDuration: marketplaceServiceEngagement.viewDuration,
        lastEngagedAt: marketplaceServiceEngagement.lastEngagedAt
      })
      .from(marketplaceServiceEngagement)
      .innerJoin(marketplaceItems, eq(marketplaceServiceEngagement.serviceId, marketplaceItems.id));
      
      return engagementData;
    } catch (error) {
      console.error('Error getting marketplace service engagement:', error);
      return [];
    }
  }
  
  async trackServiceClick(serviceId: number): Promise<boolean> {
    try {
      // Check if entry exists
      const [existing] = await db.select()
        .from(marketplaceServiceEngagement)
        .where(eq(marketplaceServiceEngagement.serviceId, serviceId));
      
      if (existing) {
        // Update existing record
        await db.update(marketplaceServiceEngagement)
          .set({ 
            clicks: existing.clicks + 1,
            lastEngagedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(marketplaceServiceEngagement.serviceId, serviceId));
      } else {
        // Create new record
        await db.insert(marketplaceServiceEngagement)
          .values({
            serviceId,
            clicks: 1,
            lastEngagedAt: new Date()
          });
      }
      
      return true;
    } catch (error) {
      console.error('Error tracking service click:', error);
      return false;
    }
  }
  
  async trackServiceInquiry(serviceId: number): Promise<boolean> {
    try {
      // Check if entry exists
      const [existing] = await db.select()
        .from(marketplaceServiceEngagement)
        .where(eq(marketplaceServiceEngagement.serviceId, serviceId));
      
      if (existing) {
        // Update existing record
        await db.update(marketplaceServiceEngagement)
          .set({ 
            inquiries: existing.inquiries + 1,
            lastEngagedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(marketplaceServiceEngagement.serviceId, serviceId));
      } else {
        // Create new record
        await db.insert(marketplaceServiceEngagement)
          .values({
            serviceId,
            inquiries: 1,
            lastEngagedAt: new Date()
          });
      }
      
      return true;
    } catch (error) {
      console.error('Error tracking service inquiry:', error);
      return false;
    }
  }
}

// Create a new instance of DatabaseStorage
export const storage = new DatabaseStorage();
