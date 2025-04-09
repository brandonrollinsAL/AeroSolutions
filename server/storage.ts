import { 
  users, type User, type InsertUser,
  contactSubmissions, type Contact, type InsertContact,
  clientPreviews, type ClientPreview, type InsertClientPreview
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gt } from "drizzle-orm";

// Extend the interface with needed CRUD methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Contact methods
  createContactSubmission(contact: InsertContact): Promise<Contact>;
  getContactSubmissions(): Promise<Contact[]>;
  
  // Client Preview methods
  createClientPreview(preview: InsertClientPreview): Promise<ClientPreview>;
  getClientPreviewByCode(code: string): Promise<ClientPreview | undefined>;
  validateClientPreviewCode(code: string): Promise<boolean>;
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
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
}

// Create a new instance of DatabaseStorage
export const storage = new DatabaseStorage();
