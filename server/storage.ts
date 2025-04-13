import { 
  users, type User, type InsertUser,
  contactSubmissions, type Contact, type InsertContact,
  clientPreviews, type ClientPreview, type InsertClientPreview,
  subscriptionPlans, type SubscriptionPlan, type InsertSubscriptionPlan,
  userSubscriptions, type UserSubscription, type InsertUserSubscription,
  marketplaceItems, type MarketplaceItem, type InsertMarketplaceItem,
  marketplaceOrders, type MarketplaceOrder, type InsertMarketplaceOrder,
  advertisements, type Advertisement, type InsertAdvertisement,
  userSessions, contentViewMetrics, 
  type UserSession, type ContentViewMetric,
  type InsertUserSession, type InsertContentViewMetric,
  posts
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
      // For this example, we'll assume a 'services' table exists
      // In a real app, you might have a separate services table or reuse marketplaceItems
      // Here we'll use similar fields to marketplaceItems
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
}

// Create a new instance of DatabaseStorage
export const storage = new DatabaseStorage();
