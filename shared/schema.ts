import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (original)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
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
