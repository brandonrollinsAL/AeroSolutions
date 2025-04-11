import { pgTable, text, serial, integer, boolean, timestamp, decimal, json, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema with Stripe integration
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").default("user").notNull(), // user, admin
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Contact submission schema
export const contactSubmissions = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertContactSchema = createInsertSchema(contactSubmissions).pick({
  name: true,
  email: true,
  company: true,
  message: true,
});

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contactSubmissions.$inferSelect;

// Client Preview schema
export const clientPreviews = pgTable("client_previews", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  clientName: text("client_name").notNull(),
  projectId: integer("project_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const insertClientPreviewSchema = createInsertSchema(clientPreviews).pick({
  code: true,
  clientName: true,
  projectId: true,
  expiresAt: true,
  isActive: true,
});

export type InsertClientPreview = z.infer<typeof insertClientPreviewSchema>;
export type ClientPreview = typeof clientPreviews.$inferSelect;

// Subscription plans schema
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  interval: text("interval").notNull(), // 'month', 'year'
  features: json("features").$type<string[]>().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  stripePriceId: text("stripe_price_id").notNull(),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).pick({
  name: true,
  description: true,
  price: true,
  interval: true,
  features: true,
  isActive: true,
  stripePriceId: true,
});

export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

// User subscriptions schema
export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  planId: integer("plan_id").notNull().references(() => subscriptionPlans.id),
  status: text("status").notNull(), // 'active', 'canceled', 'past_due'
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
  stripeSubscriptionId: text("stripe_subscription_id").notNull(),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).pick({
  userId: true,
  planId: true,
  status: true,
  currentPeriodStart: true,
  currentPeriodEnd: true,
  cancelAtPeriodEnd: true,
  stripeSubscriptionId: true,
  stripeCustomerId: true,
});

export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;
export type UserSubscription = typeof userSubscriptions.$inferSelect;

// Marketplace items schema
export const marketplaceItems = pgTable("marketplace_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  category: text("category").notNull(),
  tags: json("tags").$type<string[]>().default([]).notNull(),
  images: json("images").$type<string[]>().default([]).notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  stripeProductId: text("stripe_product_id"),
  stripePriceId: text("stripe_price_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertMarketplaceItemSchema = createInsertSchema(marketplaceItems).pick({
  name: true,
  description: true,
  price: true,
  sellerId: true,
  category: true,
  tags: true,
  images: true,
  isAvailable: true,
  stripeProductId: true,
  stripePriceId: true,
});

export type InsertMarketplaceItem = z.infer<typeof insertMarketplaceItemSchema>;
export type MarketplaceItem = typeof marketplaceItems.$inferSelect;

// Marketplace orders schema
export const marketplaceOrders = pgTable("marketplace_orders", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id").notNull().references(() => users.id),
  itemId: integer("item_id").notNull().references(() => marketplaceItems.id),
  quantity: integer("quantity").default(1).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(), // 'pending', 'completed', 'cancelled'
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertMarketplaceOrderSchema = createInsertSchema(marketplaceOrders).pick({
  buyerId: true,
  itemId: true,
  quantity: true,
  totalPrice: true,
  status: true,
  stripePaymentIntentId: true,
});

export type InsertMarketplaceOrder = z.infer<typeof insertMarketplaceOrderSchema>;
export type MarketplaceOrder = typeof marketplaceOrders.$inferSelect;

// Advertisements schema
export const advertisements = pgTable("advertisements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'banner', 'sidebar', 'popup'
  imageUrl: text("image_url").notNull(),
  targetUrl: text("target_url").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(), 
  isActive: boolean("is_active").default(true).notNull(),
  impressions: integer("impressions").default(0).notNull(),
  clicks: integer("clicks").default(0).notNull(),
  position: text("position"), // 'header', 'footer', 'sidebar'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAdvertisementSchema = createInsertSchema(advertisements).pick({
  name: true,
  type: true,
  imageUrl: true,
  targetUrl: true,
  startDate: true,
  endDate: true,
  isActive: true,
  position: true,
});

export type InsertAdvertisement = z.infer<typeof insertAdvertisementSchema>;
export type Advertisement = typeof advertisements.$inferSelect;
