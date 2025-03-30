import { db } from './db';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { pool } from './db';
import { logger } from './middleware/logger';
import { eq, and, desc } from 'drizzle-orm';
import {
  users, grants, artists, applications, activities, templates,
  subscriptionPlans, subscriptions, documents, userOnboarding,
  User, InsertUser, Grant, InsertGrant, Artist, InsertArtist,
  Application, InsertApplication, Activity, InsertActivity,
  Template, InsertTemplate, SubscriptionPlan, InsertSubscriptionPlan,
  Subscription, InsertSubscription, Document, InsertDocument,
  UserOnboarding, InsertUserOnboarding
} from '@shared/schema';

// Storage interface
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User>;
  updateLastLogin(userId: number, lastLogin: Date): Promise<User>;
  
  // Onboarding
  getUserOnboardingTasks(userId: number): Promise<UserOnboarding[]>;
  completeOnboardingTask(userId: number, task: string, data?: any): Promise<UserOnboarding>;
  
  // Grants
  getAllGrants(): Promise<Grant[]>;
  getGrant(id: number): Promise<Grant | undefined>;
  createGrant(grant: InsertGrant): Promise<Grant>;
  
  // Artists
  getAllArtists(): Promise<Artist[]>;
  getArtistsByUser(userId: number): Promise<Artist[]>;
  getArtist(id: number): Promise<Artist | undefined>;
  createArtist(artist: InsertArtist): Promise<Artist>;
  
  // Applications
  getAllApplications(): Promise<Application[]>;
  getApplicationsByUser(userId: number): Promise<Application[]>;
  getApplicationsByArtist(artistId: number): Promise<Application[]>;
  getApplication(id: number): Promise<Application | undefined>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: number, application: Partial<InsertApplication>): Promise<Application | undefined>;
  
  // Activities
  getAllActivities(): Promise<Activity[]>;
  getActivitiesByUser(userId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Templates
  getAllTemplates(): Promise<Template[]>;
  getTemplatesByUser(userId: number): Promise<Template[]>;
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

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      logger.error('Error getting user:', error);
      throw error;
    }
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      logger.error('Error getting user by username:', error);
      throw error;
    }
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values(insertUser)
        .returning();
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }
  
  async updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User> {
    try {
      const [user] = await db
        .update(users)
        .set({ stripeCustomerId })
        .where(eq(users.id, userId))
        .returning();
      return user;
    } catch (error) {
      logger.error('Error updating Stripe customer ID:', error);
      throw error;
    }
  }
  
  async updateLastLogin(userId: number, lastLogin: Date): Promise<User> {
    try {
      const [user] = await db
        .update(users)
        .set({ lastLogin })
        .where(eq(users.id, userId))
        .returning();
      return user;
    } catch (error) {
      logger.error('Error updating last login:', error);
      throw error;
    }
  }
  
  // Grant methods
  async getAllGrants(): Promise<Grant[]> {
    try {
      return await db.select().from(grants).orderBy(desc(grants.deadline));
    } catch (error) {
      logger.error('Error getting all grants:', error);
      throw error;
    }
  }
  
  async getGrant(id: number): Promise<Grant | undefined> {
    try {
      const [grant] = await db.select().from(grants).where(eq(grants.id, id));
      return grant;
    } catch (error) {
      logger.error('Error getting grant:', error);
      throw error;
    }
  }
  
  async createGrant(insertGrant: InsertGrant): Promise<Grant> {
    try {
      const [grant] = await db
        .insert(grants)
        .values(insertGrant)
        .returning();
      return grant;
    } catch (error) {
      logger.error('Error creating grant:', error);
      throw error;
    }
  }
  
  // Artist methods
  async getAllArtists(): Promise<Artist[]> {
    try {
      return await db.select().from(artists);
    } catch (error) {
      logger.error('Error getting all artists:', error);
      throw error;
    }
  }
  
  async getArtistsByUser(userId: number): Promise<Artist[]> {
    try {
      return await db.select().from(artists).where(eq(artists.userId, userId));
    } catch (error) {
      logger.error('Error getting artists by user:', error);
      throw error;
    }
  }
  
  async getArtist(id: number): Promise<Artist | undefined> {
    try {
      const [artist] = await db.select().from(artists).where(eq(artists.id, id));
      return artist;
    } catch (error) {
      logger.error('Error getting artist:', error);
      throw error;
    }
  }
  
  async createArtist(insertArtist: InsertArtist): Promise<Artist> {
    try {
      const [artist] = await db
        .insert(artists)
        .values(insertArtist)
        .returning();
      return artist;
    } catch (error) {
      logger.error('Error creating artist:', error);
      throw error;
    }
  }
  
  // Application methods
  async getAllApplications(): Promise<Application[]> {
    try {
      return await db.select().from(applications);
    } catch (error) {
      logger.error('Error getting all applications:', error);
      throw error;
    }
  }
  
  async getApplicationsByUser(userId: number): Promise<Application[]> {
    try {
      return await db.select().from(applications).where(eq(applications.userId, userId));
    } catch (error) {
      logger.error('Error getting applications by user:', error);
      throw error;
    }
  }
  
  async getApplicationsByArtist(artistId: number): Promise<Application[]> {
    try {
      return await db
        .select()
        .from(applications)
        .where(eq(applications.artistId, artistId));
    } catch (error) {
      logger.error('Error getting applications by artist:', error);
      throw error;
    }
  }
  
  async getApplication(id: number): Promise<Application | undefined> {
    try {
      const [application] = await db
        .select()
        .from(applications)
        .where(eq(applications.id, id));
      return application;
    } catch (error) {
      logger.error('Error getting application:', error);
      throw error;
    }
  }
  
  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    try {
      const [application] = await db
        .insert(applications)
        .values(insertApplication)
        .returning();
      return application;
    } catch (error) {
      logger.error('Error creating application:', error);
      throw error;
    }
  }
  
  async updateApplication(id: number, updateData: Partial<InsertApplication>): Promise<Application | undefined> {
    try {
      const [application] = await db
        .update(applications)
        .set(updateData)
        .where(eq(applications.id, id))
        .returning();
      return application;
    } catch (error) {
      logger.error('Error updating application:', error);
      throw error;
    }
  }
  
  // Activity methods
  async getAllActivities(): Promise<Activity[]> {
    try {
      return await db
        .select()
        .from(activities)
        .orderBy(desc(activities.createdAt));
    } catch (error) {
      logger.error('Error getting all activities:', error);
      throw error;
    }
  }
  
  async getActivitiesByUser(userId: number): Promise<Activity[]> {
    try {
      return await db
        .select()
        .from(activities)
        .where(eq(activities.userId, userId))
        .orderBy(desc(activities.createdAt));
    } catch (error) {
      logger.error('Error getting activities by user:', error);
      throw error;
    }
  }
  
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    try {
      const [activity] = await db
        .insert(activities)
        .values(insertActivity)
        .returning();
      return activity;
    } catch (error) {
      logger.error('Error creating activity:', error);
      throw error;
    }
  }
  
  // Template methods
  async getAllTemplates(): Promise<Template[]> {
    try {
      return await db.select().from(templates);
    } catch (error) {
      logger.error('Error getting all templates:', error);
      throw error;
    }
  }
  
  async getTemplatesByUser(userId: number): Promise<Template[]> {
    try {
      return await db
        .select()
        .from(templates)
        .where(eq(templates.userId, userId));
    } catch (error) {
      logger.error('Error getting templates by user:', error);
      throw error;
    }
  }
  
  async getTemplate(id: number): Promise<Template | undefined> {
    try {
      const [template] = await db
        .select()
        .from(templates)
        .where(eq(templates.id, id));
      return template;
    } catch (error) {
      logger.error('Error getting template:', error);
      throw error;
    }
  }
  
  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    try {
      const [template] = await db
        .insert(templates)
        .values(insertTemplate)
        .returning();
      return template;
    } catch (error) {
      logger.error('Error creating template:', error);
      throw error;
    }
  }
  
  async updateTemplate(id: number, updateData: Partial<InsertTemplate>): Promise<Template | undefined> {
    try {
      const [template] = await db
        .update(templates)
        .set(updateData)
        .where(eq(templates.id, id))
        .returning();
      return template;
    } catch (error) {
      logger.error('Error updating template:', error);
      throw error;
    }
  }
  
  // Subscription Plan methods
  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      return await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.active, true));
    } catch (error) {
      logger.error('Error getting all subscription plans:', error);
      throw error;
    }
  }
  
  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    try {
      const [plan] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, id));
      return plan;
    } catch (error) {
      logger.error('Error getting subscription plan:', error);
      throw error;
    }
  }
  
  async createSubscriptionPlan(insertPlan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    try {
      const [plan] = await db
        .insert(subscriptionPlans)
        .values(insertPlan)
        .returning();
      return plan;
    } catch (error) {
      logger.error('Error creating subscription plan:', error);
      throw error;
    }
  }
  
  // Subscription methods
  async getUserSubscription(userId: number): Promise<Subscription | undefined> {
    try {
      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active')
        ));
      return subscription;
    } catch (error) {
      logger.error('Error getting user subscription:', error);
      throw error;
    }
  }
  
  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    try {
      const [subscription] = await db
        .insert(subscriptions)
        .values(insertSubscription)
        .returning();
      return subscription;
    } catch (error) {
      logger.error('Error creating subscription:', error);
      throw error;
    }
  }
  
  async updateSubscription(id: number, updateData: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    try {
      const [subscription] = await db
        .update(subscriptions)
        .set(updateData)
        .where(eq(subscriptions.id, id))
        .returning();
      return subscription;
    } catch (error) {
      logger.error('Error updating subscription:', error);
      throw error;
    }
  }
  
  // Knowledge Document methods
  async getAllDocuments(): Promise<Document[]> {
    try {
      return await db
        .select()
        .from(documents)
        .orderBy(desc(documents.createdAt));
    } catch (error) {
      logger.error('Error getting all documents:', error);
      throw error;
    }
  }
  
  async getDocumentsByUser(userId: number): Promise<Document[]> {
    try {
      return await db
        .select()
        .from(documents)
        .where(eq(documents.userId, userId))
        .orderBy(desc(documents.createdAt));
    } catch (error) {
      logger.error('Error getting documents by user:', error);
      throw error;
    }
  }
  
  async getApprovedDocuments(): Promise<Document[]> {
    try {
      return await db
        .select()
        .from(documents)
        .where(and(
          eq(documents.isPublic, true),
          eq(documents.isApproved, true)
        ))
        .orderBy(desc(documents.createdAt));
    } catch (error) {
      logger.error('Error getting approved documents:', error);
      throw error;
    }
  }
  
  async getDocument(id: number): Promise<Document | undefined> {
    try {
      const [document] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, id));
      return document;
    } catch (error) {
      logger.error('Error getting document:', error);
      throw error;
    }
  }
  
  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    try {
      const [document] = await db
        .insert(documents)
        .values(insertDocument)
        .returning();
      return document;
    } catch (error) {
      logger.error('Error creating document:', error);
      throw error;
    }
  }
  
  async updateDocument(id: number, updateData: Partial<InsertDocument>): Promise<Document | undefined> {
    try {
      const [document] = await db
        .update(documents)
        .set(updateData)
        .where(eq(documents.id, id))
        .returning();
      return document;
    } catch (error) {
      logger.error('Error updating document:', error);
      throw error;
    }
  }
  
  async deleteDocument(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(documents)
        .where(eq(documents.id, id));
      return result.count > 0;
    } catch (error) {
      logger.error('Error deleting document:', error);
      throw error;
    }
  }
  
  // Onboarding methods
  async getUserOnboardingTasks(userId: number): Promise<UserOnboarding[]> {
    try {
      return await db
        .select()
        .from(userOnboarding)
        .where(eq(userOnboarding.userId, userId))
        .orderBy(desc(userOnboarding.completedAt));
    } catch (error) {
      logger.error('Error getting user onboarding tasks:', error);
      throw error;
    }
  }
  
  async completeOnboardingTask(userId: number, task: string, data?: any): Promise<UserOnboarding> {
    try {
      // Check if task already exists
      const existingTasks = await db
        .select()
        .from(userOnboarding)
        .where(and(
          eq(userOnboarding.userId, userId),
          eq(userOnboarding.task, task as any)
        ));
      
      // If task exists, return it
      if (existingTasks.length > 0) {
        return existingTasks[0];
      }
      
      // Otherwise create a new task completion
      const [newTask] = await db
        .insert(userOnboarding)
        .values({
          userId,
          task: task as any,
          data: data ? JSON.stringify(data) : null,
        })
        .returning();
      
      return newTask;
    } catch (error) {
      logger.error('Error completing onboarding task:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const storage = new DatabaseStorage();