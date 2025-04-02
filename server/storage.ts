import { 
  users, type User, type InsertUser,
  grants, type Grant, type InsertGrant,
  artists, type Artist, type InsertArtist,
  applications, type Application, type InsertApplication,
  activities, type Activity, type InsertActivity,
  templates, type Template, type InsertTemplate,
  subscriptionPlans, type SubscriptionPlan, type InsertSubscriptionPlan,
  subscriptions, type Subscription, type InsertSubscription,
  documents, type Document, type InsertDocument,
  userOnboarding, type UserOnboarding, type InsertUserOnboarding
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(userId: number, updateData: Partial<User>): Promise<User | undefined>;
  updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User>;
  
  // Onboarding
  getUserOnboardingTasks(userId: number): Promise<UserOnboarding[]>;
  completeOnboardingTask(userId: number, task: string, data?: any): Promise<UserOnboarding>;
  
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
  updateTemplate(id: number, template: Partial<InsertTemplate>): Promise<Template | undefined>;
  
  // Knowledge Documents
  getAllDocuments(): Promise<Document[]>;
  getDocumentsByUser(userId: number): Promise<Document[]>;
  getApprovedDocuments(): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  
  // Subscription Plans
  getAllSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  
  // Subscriptions
  getUserSubscription(userId: number): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, subscription: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  // Session store
  sessionStore: session.Store;
  
  constructor() {
    const PostgresStore = connectPg(session);
    this.sessionStore = new PostgresStore({
      pool,
      createTableIfMissing: true
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(userId: number, updateData: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
  
  async updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ stripeCustomerId })
      .where(eq(users.id, userId))
      .returning();
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
    try {
      // Ensure deadline is a proper Date object
      if (insertGrant.deadline && !(insertGrant.deadline instanceof Date)) {
        insertGrant.deadline = new Date(insertGrant.deadline);
      }
      
      const [grant] = await db.insert(grants).values(insertGrant).returning();
      return grant;
    } catch (error) {
      console.error("Error creating grant:", error);
      throw error;
    }
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
  
  async updateTemplate(id: number, updateData: Partial<InsertTemplate>): Promise<Template | undefined> {
    const [template] = await db
      .update(templates)
      .set(updateData)
      .where(eq(templates.id, id))
      .returning();
    return template;
  }
  
  // Subscription Plan methods
  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.active, true));
  }
  
  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return plan;
  }
  
  async createSubscriptionPlan(insertPlan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [plan] = await db.insert(subscriptionPlans).values(insertPlan).returning();
    return plan;
  }
  
  // Subscription methods
  async getUserSubscription(userId: number): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    return subscription;
  }
  
  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db.insert(subscriptions).values(insertSubscription).returning();
    return subscription;
  }
  
  async updateSubscription(id: number, updateData: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const [subscription] = await db
      .update(subscriptions)
      .set(updateData)
      .where(eq(subscriptions.id, id))
      .returning();
    return subscription;
  }
  
  // Update canceledAt field directly since it's not in InsertSubscription
  async updateSubscriptionCanceledAt(id: number, canceledAt: Date): Promise<void> {
    await db
      .update(subscriptions)
      .set({ canceledAt })
      .where(eq(subscriptions.id, id));
  }
  
  // Knowledge Document methods
  async getAllDocuments(): Promise<Document[]> {
    return await db.select().from(documents).orderBy(desc(documents.createdAt));
  }
  
  async getDocumentsByUser(userId: number): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt));
  }
  
  async getApprovedDocuments(): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(and(
        eq(documents.isApproved, true),
        eq(documents.isPublic, true)
      ))
      .orderBy(desc(documents.createdAt));
  }
  
  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }
  
  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db.insert(documents).values(insertDocument).returning();
    return document;
  }
  
  async updateDocument(id: number, updateData: Partial<InsertDocument>): Promise<Document | undefined> {
    const [document] = await db
      .update(documents)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(documents.id, id))
      .returning();
    return document;
  }
  
  async deleteDocument(id: number): Promise<boolean> {
    const result = await db
      .delete(documents)
      .where(eq(documents.id, id));
    return true; // In Drizzle, the delete operation doesn't return the number of affected rows
  }
  
  // Onboarding task methods
  async getUserOnboardingTasks(userId: number): Promise<UserOnboarding[]> {
    return await db
      .select()
      .from(userOnboarding)
      .where(eq(userOnboarding.userId, userId))
      .orderBy(desc(userOnboarding.completedAt));
  }
  
  async completeOnboardingTask(userId: number, task: string, data?: any): Promise<UserOnboarding> {
    // Check if task already exists to avoid duplicates
    const existingTask = await db
      .select()
      .from(userOnboarding)
      .where(and(
        eq(userOnboarding.userId, userId),
        // Use the raw value directly for the enum column
        eq(userOnboarding.task, task as any)
      ))
      .limit(1);
      
    // If task already exists, return it without modification
    if (existingTask.length > 0) {
      return existingTask[0];
    }
    
    // Insert new onboarding task
    const [onboardingTask] = await db
      .insert(userOnboarding)
      .values({
        userId,
        task: task as any, // Cast to any to work around enum type checking
        data: data || null
      })
      .returning();
      
    return onboardingTask;
  }
}

// Initialize a database instance automatically
const initializeDatabase = async () => {
  // Create a default user if none exists
  const userCheck = await db.select().from(users).limit(1);
  
  if (userCheck.length === 0) {
    // Create admin user with hashed password
    const salt = randomBytes(16).toString("hex");
    const buf = await scryptAsync("admin123", salt, 64) as Buffer;
    const hashedPassword = `${buf.toString("hex")}.${salt}`;
    
    // Insert user skipping the bio field that might cause problems
    const userValues = {
      username: "admin",
      password: hashedPassword,
      name: "Admin User",
      email: "admin@example.com",
      avatar: null,
      role: "admin",
      verified: true,
      active: true
    };
    
    const [user] = await db.insert(users).values(userValues).returning();
    
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
    
    // Add initial artists with userId reference
    const [artist1] = await db.insert(artists).values({
      userId: user.id,
      name: "Emma Johnson",
      email: "emma@example.com",
      phone: "555-123-4567",
      bio: "Classical pianist with 10 years of experience",
      genres: ["Classical", "Contemporary"]
    }).returning();
    
    const [artist2] = await db.insert(artists).values({
      userId: user.id,
      name: "Marcus Rivera",
      email: "marcus@example.com",
      phone: "555-987-6543",
      bio: "Hip-hop producer and community educator",
      genres: ["Hip-Hop", "R&B", "Electronic"]
    }).returning();
    
    // Add initial templates with userId reference
    await db.insert(templates).values({
      userId: user.id,
      name: "Standard Project Proposal",
      description: "General template for music project proposals",
      content: "# Project Proposal\n\n## Background\n\n## Goals\n\n## Budget\n\n## Timeline\n\n## Expected Impact",
      type: "proposal"
    });
    
    await db.insert(templates).values({
      userId: user.id,
      name: "Artist Statement",
      description: "Template for crafting compelling artist statements",
      content: "# Artist Statement\n\nAs an artist, my work explores...\n\nMy artistic journey began...\n\nThrough my music, I aim to...",
      type: "statement"
    });
    
    // Add initial applications
    await db.insert(applications).values({
      userId: user.id,
      grantId: grant1.id,
      artistId: artist1.id,
      status: "in_progress",
      progress: 60,
      answers: { question1: "This project aims to...", question2: "The budget breakdown is..." },
      submittedAt: null
    });
    
    await db.insert(applications).values({
      userId: user.id,
      grantId: grant2.id,
      artistId: artist2.id,
      status: "draft",
      progress: 25,
      answers: { question1: "Initial concept ideas..." },
      submittedAt: null
    });
    
    // Add initial activities for the user
    await db.insert(activities).values({
      userId: user.id,
      action: "CREATED",
      entityType: "ARTIST",
      entityId: artist1.id,
      details: { name: artist1.name }
    });
    
    await db.insert(activities).values({
      userId: user.id,
      action: "CREATED",
      entityType: "ARTIST",
      entityId: artist2.id,
      details: { name: artist2.name }
    });
    
    // Add subscription plans
    await db.insert(subscriptionPlans).values({
      name: "Free",
      tier: "free",
      price: 0,
      description: "Basic plan for individual musicians",
      maxApplications: 1,
      maxArtists: 1,
      features: ["1 grant application", "1 artist profile", "AI assistance", "Basic templates"],
      active: true
    });
    
    await db.insert(subscriptionPlans).values({
      name: "Basic",
      tier: "basic",
      price: 2500, // $25.00
      description: "Great for small ensembles and emerging artists",
      maxApplications: 5,
      maxArtists: 2,
      features: ["5 grant applications", "2 artist profiles", "Priority AI assistance", "All templates", "Email support"],
      stripePriceId: process.env.STRIPE_BASIC_PRICE_ID,
      active: true
    });
    
    await db.insert(subscriptionPlans).values({
      name: "Premium",
      tier: "premium",
      price: 6000, // $60.00
      description: "Professional package for established musicians and organizations",
      maxApplications: 20,
      maxArtists: 10,
      features: ["20 grant applications", "10 artist profiles", "Priority AI assistance", "All templates", "Priority support", "Grant deadline alerts", "Application analytics"],
      stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID,
      active: true
    });
    
    // Add initial knowledge documents
    await db.insert(documents).values({
      userId: user.id,
      title: "Guide to Grant Writing for Musicians",
      content: "# Guide to Grant Writing for Musicians\n\nGrant writing can be a challenging but rewarding process for musicians seeking funding. Here are some key tips for success:\n\n## Research Thoroughly\nIdentify grants that align with your musical focus and career stage. Look for foundations, government agencies, and private organizations that support your type of work.\n\n## Read Guidelines Carefully\nEach grant has specific requirements and preferences. Follow instructions exactly, and make sure you qualify before applying.\n\n## Be Clear and Specific\nClearly articulate your project goals, timeline, and budget. Use concrete examples and avoid jargon.\n\n## Tell Your Story\nMake your narrative compelling by connecting your musical work to broader impacts. Explain why your project matters and how it will benefit others.\n\n## Get Feedback\nHave colleagues review your application before submitting. A fresh perspective can identify weaknesses or unclear sections.\n\n## Plan Ahead\nStart working on applications well before deadlines. Quality applications take time to develop.",
      type: "application_tips",
      tags: ["grant writing", "funding", "tips", "music"],
      isPublic: true,
      isApproved: true
    });
    
    await db.insert(documents).values({
      userId: user.id,
      title: "Understanding Music Grant Evaluation Criteria",
      content: "# Understanding Music Grant Evaluation Criteria\n\nWhen reviewing grant applications for music projects, evaluators typically consider several key factors:\n\n## Artistic Merit\nEvaluators assess the quality, creativity, and originality of your work. Include samples of your best work and clearly explain your artistic vision.\n\n## Feasibility\nYour proposal must demonstrate that you can successfully complete the project. Include a realistic timeline, budget, and explanation of your qualifications.\n\n## Impact\nGrant makers want to fund projects that make a difference. Explain how your project will benefit your artistic development, your community, or the music field.\n\n## Innovation\nMany funders look for projects that break new ground or approach traditional forms in fresh ways. Highlight the innovative aspects of your work.\n\n## Diversity and Inclusion\nIncreasingly, funders value projects that engage diverse participants or address issues of equity and access in the arts.\n\n## Budget Clarity\nYour budget should be detailed, realistic, and appropriate for the scope of the project. Make sure all expenses are justified and clearly explained.",
      type: "grant_info",
      tags: ["evaluation", "criteria", "funding", "music grants"],
      isPublic: true,
      isApproved: true
    });
    
    console.log("Database initialized with default data");
  }
};

// Call initialization
initializeDatabase().catch(err => {
  console.error("Error initializing database:", err);
});

export const storage = new DatabaseStorage();
