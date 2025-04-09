import { 
  users, type User, type InsertUser,
  contactSubmissions, type Contact, type InsertContact,
  clientPreviews, type ClientPreview, type InsertClientPreview
} from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private contacts: Map<number, Contact>;
  private clientPreviews: Map<number, ClientPreview>;
  
  private currentUserId: number;
  private currentContactId: number;
  private currentPreviewId: number;

  constructor() {
    this.users = new Map();
    this.contacts = new Map();
    this.clientPreviews = new Map();
    
    this.currentUserId = 1;
    this.currentContactId = 1;
    this.currentPreviewId = 1;
    
    // Initialize with sample client preview codes
    this.initSampleData();
  }

  private initSampleData() {
    // Add sample client preview data
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
      }
    ];
    
    samplePreviews.forEach(preview => {
      this.createClientPreview(preview);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Contact methods
  async createContactSubmission(contact: InsertContact): Promise<Contact> {
    const id = this.currentContactId++;
    const now = new Date();
    const contactSubmission: Contact = { 
      ...contact, 
      id, 
      createdAt: now
    };
    this.contacts.set(id, contactSubmission);
    return contactSubmission;
  }
  
  async getContactSubmissions(): Promise<Contact[]> {
    return Array.from(this.contacts.values());
  }
  
  // Client Preview methods
  async createClientPreview(preview: InsertClientPreview): Promise<ClientPreview> {
    const id = this.currentPreviewId++;
    const clientPreview: ClientPreview = { ...preview, id };
    this.clientPreviews.set(id, clientPreview);
    return clientPreview;
  }
  
  async getClientPreviewByCode(code: string): Promise<ClientPreview | undefined> {
    return Array.from(this.clientPreviews.values()).find(
      (preview) => preview.code === code && preview.isActive && new Date(preview.expiresAt) > new Date()
    );
  }
  
  async validateClientPreviewCode(code: string): Promise<boolean> {
    const preview = await this.getClientPreviewByCode(code);
    return !!preview;
  }
}

export const storage = new MemStorage();
