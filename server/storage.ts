import { 
  users, type User, type InsertUser,
  grants, type Grant, type InsertGrant,
  artists, type Artist, type InsertArtist,
  applications, type Application, type InsertApplication,
  activities, type Activity, type InsertActivity,
  templates, type Template, type InsertTemplate
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Grants
  getAllGrants(): Promise<Grant[]>;
  getGrant(id: number): Promise<Grant | undefined>;
  createGrant(grant: InsertGrant): Promise<Grant>;
  
  // Artists
  getAllArtists(): Promise<Artist[]>;
  getArtist(id: number): Promise<Artist | undefined>;
  createArtist(artist: InsertArtist): Promise<Artist>;
  
  // Applications
  getAllApplications(): Promise<Application[]>;
  getApplication(id: number): Promise<Application | undefined>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: number, application: Partial<InsertApplication>): Promise<Application | undefined>;
  
  // Activities
  getAllActivities(): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Templates
  getAllTemplates(): Promise<Template[]>;
  getTemplate(id: number): Promise<Template | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;
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
  
  // Grant methods
  async getAllGrants(): Promise<Grant[]> {
    return await db.select().from(grants).orderBy(desc(grants.deadline));
  }
  
  async getGrant(id: number): Promise<Grant | undefined> {
    const [grant] = await db.select().from(grants).where(eq(grants.id, id));
    return grant;
  }
  
  async createGrant(insertGrant: InsertGrant): Promise<Grant> {
    const [grant] = await db.insert(grants).values(insertGrant).returning();
    return grant;
  }
  
  // Artist methods
  async getAllArtists(): Promise<Artist[]> {
    return await db.select().from(artists).orderBy(artists.name);
  }
  
  async getArtist(id: number): Promise<Artist | undefined> {
    const [artist] = await db.select().from(artists).where(eq(artists.id, id));
    return artist;
  }
  
  async createArtist(insertArtist: InsertArtist): Promise<Artist> {
    const [artist] = await db.insert(artists).values(insertArtist).returning();
    return artist;
  }
  
  // Application methods
  async getAllApplications(): Promise<Application[]> {
    return await db.select().from(applications);
  }
  
  async getApplication(id: number): Promise<Application | undefined> {
    const [application] = await db.select().from(applications).where(eq(applications.id, id));
    return application;
  }
  
  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const [application] = await db.insert(applications).values(insertApplication).returning();
    return application;
  }
  
  async updateApplication(id: number, updateData: Partial<InsertApplication>): Promise<Application | undefined> {
    const [application] = await db
      .update(applications)
      .set(updateData)
      .where(eq(applications.id, id))
      .returning();
    return application;
  }
  
  // Activity methods
  async getAllActivities(): Promise<Activity[]> {
    return await db.select().from(activities).orderBy(desc(activities.createdAt));
  }
  
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db.insert(activities).values(insertActivity).returning();
    return activity;
  }
  
  // Template methods
  async getAllTemplates(): Promise<Template[]> {
    return await db.select().from(templates);
  }
  
  async getTemplate(id: number): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template;
  }
  
  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const [template] = await db.insert(templates).values(insertTemplate).returning();
    return template;
  }
}

// Initialize a database instance automatically
const initializeDatabase = async () => {
  // Create a default user if none exists
  const userCheck = await db.select().from(users).limit(1);
  
  if (userCheck.length === 0) {
    await db.insert(users).values({
      username: "admin",
      password: "admin123", // In a real app, this would be hashed
      name: "Admin User",
      email: "admin@example.com",
      avatar: null
    });
    
    // Add initial grants
    const [grant1] = await db.insert(grants).values({
      name: "Music Innovation Grant",
      organization: "Harmony Foundation",
      amount: "$5,000",
      deadline: new Date(2025, 5, 15),
      description: "Supporting innovative music projects",
      requirements: "Open to musicians with at least 2 years of experience"
    }).returning();
    
    const [grant2] = await db.insert(grants).values({
      name: "Community Music Program",
      organization: "Metro Arts Council",
      amount: "$10,000",
      deadline: new Date(2025, 4, 30),
      description: "Funding community engagement through music",
      requirements: "Must include educational components"
    }).returning();
    
    // Add initial artists
    const [artist1] = await db.insert(artists).values({
      name: "Emma Johnson",
      email: "emma@example.com",
      phone: "555-123-4567",
      bio: "Classical pianist with 10 years of experience",
      genres: ["Classical", "Contemporary"]
    }).returning();
    
    const [artist2] = await db.insert(artists).values({
      name: "Marcus Rivera",
      email: "marcus@example.com",
      phone: "555-987-6543",
      bio: "Hip-hop producer and community educator",
      genres: ["Hip-Hop", "R&B", "Electronic"]
    }).returning();
    
    // Add initial templates
    await db.insert(templates).values({
      name: "Standard Project Proposal",
      description: "General template for music project proposals",
      content: "# Project Proposal\n\n## Background\n\n## Goals\n\n## Budget\n\n## Timeline\n\n## Expected Impact",
      type: "proposal"
    });
    
    await db.insert(templates).values({
      name: "Artist Statement",
      description: "Template for crafting compelling artist statements",
      content: "# Artist Statement\n\nAs an artist, my work explores...\n\nMy artistic journey began...\n\nThrough my music, I aim to...",
      type: "statement"
    });
    
    // Add initial applications
    await db.insert(applications).values({
      grantId: grant1.id,
      artistId: artist1.id,
      status: "in_progress",
      progress: 60,
      answers: { question1: "This project aims to...", question2: "The budget breakdown is..." },
      submittedAt: null
    });
    
    await db.insert(applications).values({
      grantId: grant2.id,
      artistId: artist2.id,
      status: "draft",
      progress: 25,
      answers: { question1: "Initial concept ideas..." },
      submittedAt: null
    });
    
    console.log("Database initialized with default data");
  }
};

// Call initialization
initializeDatabase().catch(err => {
  console.error("Error initializing database:", err);
});

export const storage = new DatabaseStorage();
