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
  type InsertUserSession, type InsertContentViewMetric
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gt, lt, sql, desc, asc } from "drizzle-orm";

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

  // Initialize sample data for client previews
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
          const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
          
          // Random pages viewed (1-15)
          const pagesViewed = Math.floor(Math.random() * 15) + 1;
          
          sampleSessions.push({
            userId: user.id,
            sessionStart: sessionDate,
            durationSeconds: durationSeconds,
            deviceType: deviceType,
            pagesViewed: pagesViewed,
            ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            userAgent: 'Mozilla/5.0 (compatible)',
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
      const contentTitles = [
        'Web Development Trends', 
        'Small Business Website Guide', 
        'SEO Best Practices', 
        'E-commerce Solutions',
        'Responsive Design Principles',
        'Mobile App Development Process',
        'Digital Marketing Strategies',
        'Improving Website Performance'
      ];
      
      const sampleContentViews = [];
      
      for (const title of contentTitles) {
        // Random number of views (50-350)
        const views = Math.floor(Math.random() * 300) + 50;
        
        for (let i = 0; i < views; i++) {
          // Random date within the last 30 days
          const daysAgo = Math.floor(Math.random() * 30);
          const viewDate = new Date(now.getTime() - (daysAgo * oneDayMs));
          
          // Random time spent (5-600 seconds)
          const timeSpentSeconds = Math.floor(Math.random() * 595) + 5;
          
          // Random conversion (5% chance)
          const converted = Math.random() < 0.05;
          
          sampleContentViews.push({
            contentId: contentTitles.indexOf(title) + 1,
            contentTitle: title,
            viewedAt: viewDate,
            timeSpentSeconds: timeSpentSeconds,
            converted: converted,
            deviceType: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)],
            userId: Math.random() < 0.7 ? allUsers[Math.floor(Math.random() * allUsers.length)].id : null
          });
        }
      }
      
      // Insert the sample content views
      if (sampleContentViews.length > 0) {
        await db.insert(contentViewMetrics).values(sampleContentViews);
        console.log(`Created ${sampleContentViews.length} sample content view metrics for analytics`);
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
}

// Create a new instance of DatabaseStorage
export const storage = new DatabaseStorage();
