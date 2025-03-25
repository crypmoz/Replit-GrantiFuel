import { 
  users, type User, type InsertUser,
  grants, type Grant, type InsertGrant,
  artists, type Artist, type InsertArtist,
  applications, type Application, type InsertApplication,
  activities, type Activity, type InsertActivity,
  templates, type Template, type InsertTemplate
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private grants: Map<number, Grant>;
  private artists: Map<number, Artist>;
  private applications: Map<number, Application>;
  private activities: Map<number, Activity>;
  private templates: Map<number, Template>;
  
  private userCurrentId: number;
  private grantCurrentId: number;
  private artistCurrentId: number;
  private applicationCurrentId: number;
  private activityCurrentId: number;
  private templateCurrentId: number;

  constructor() {
    this.users = new Map();
    this.grants = new Map();
    this.artists = new Map();
    this.applications = new Map();
    this.activities = new Map();
    this.templates = new Map();
    
    this.userCurrentId = 1;
    this.grantCurrentId = 1;
    this.artistCurrentId = 1;
    this.applicationCurrentId = 1;
    this.activityCurrentId = 1;
    this.templateCurrentId = 1;
    
    // Initialize with mock data
    this.initMockData();
  }
  
  private initMockData() {
    // Add a mock user
    this.createUser({
      username: "johndoe",
      password: "password123",
      name: "John Doe",
      email: "john@example.com",
      avatar: null
    });
    
    // Add mock grants
    this.createGrant({
      name: "Music Innovation Grant",
      organization: "Harmony Foundation",
      amount: "$5,000",
      deadline: new Date(2025, 5, 15),
      description: "Supporting innovative music projects",
      requirements: "Open to musicians with at least 2 years of experience"
    });
    
    this.createGrant({
      name: "Community Music Program",
      organization: "Metro Arts Council",
      amount: "$10,000",
      deadline: new Date(2025, 4, 30),
      description: "Funding community engagement through music",
      requirements: "Must include educational components"
    });
    
    // Add mock artists
    this.createArtist({
      name: "Emma Johnson",
      email: "emma@example.com",
      phone: "555-123-4567",
      bio: "Classical pianist with 10 years of experience",
      genres: ["Classical", "Contemporary"]
    });
    
    this.createArtist({
      name: "Marcus Rivera",
      email: "marcus@example.com",
      phone: "555-987-6543",
      bio: "Hip-hop producer and community educator",
      genres: ["Hip-Hop", "R&B", "Electronic"]
    });
    
    // Add mock applications
    this.createApplication({
      grantId: 1,
      artistId: 1,
      status: "in_progress",
      progress: 60,
      answers: { question1: "This project aims to...", question2: "The budget breakdown is..." },
      submittedAt: null
    });
    
    this.createApplication({
      grantId: 2,
      artistId: 2,
      status: "draft",
      progress: 25,
      answers: { question1: "Initial concept ideas..." },
      submittedAt: null
    });
    
    // Add mock activities
    this.createActivity({
      userId: 1,
      action: "created",
      entityType: "application",
      entityId: 1,
      details: { message: "Started application for Music Innovation Grant" }
    });
    
    this.createActivity({
      userId: 1,
      action: "updated",
      entityType: "application",
      entityId: 1,
      details: { message: "Updated project description" }
    });
    
    // Add mock templates
    this.createTemplate({
      name: "Standard Project Proposal",
      description: "General template for music project proposals",
      content: "# Project Proposal\n\n## Background\n\n## Goals\n\n## Budget\n\n## Timeline\n\n## Expected Impact",
      type: "proposal"
    });
    
    this.createTemplate({
      name: "Artist Statement",
      description: "Template for crafting compelling artist statements",
      content: "# Artist Statement\n\nAs an artist, my work explores...\n\nMy artistic journey began...\n\nThrough my music, I aim to...",
      type: "statement"
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
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }
  
  // Grant methods
  async getAllGrants(): Promise<Grant[]> {
    return Array.from(this.grants.values());
  }
  
  async getGrant(id: number): Promise<Grant | undefined> {
    return this.grants.get(id);
  }
  
  async createGrant(insertGrant: InsertGrant): Promise<Grant> {
    const id = this.grantCurrentId++;
    const grant: Grant = { ...insertGrant, id, createdAt: new Date() };
    this.grants.set(id, grant);
    return grant;
  }
  
  // Artist methods
  async getAllArtists(): Promise<Artist[]> {
    return Array.from(this.artists.values());
  }
  
  async getArtist(id: number): Promise<Artist | undefined> {
    return this.artists.get(id);
  }
  
  async createArtist(insertArtist: InsertArtist): Promise<Artist> {
    const id = this.artistCurrentId++;
    const artist: Artist = { ...insertArtist, id, createdAt: new Date() };
    this.artists.set(id, artist);
    return artist;
  }
  
  // Application methods
  async getAllApplications(): Promise<Application[]> {
    return Array.from(this.applications.values());
  }
  
  async getApplication(id: number): Promise<Application | undefined> {
    return this.applications.get(id);
  }
  
  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const id = this.applicationCurrentId++;
    const application: Application = { ...insertApplication, id, startedAt: new Date() };
    this.applications.set(id, application);
    return application;
  }
  
  async updateApplication(id: number, updateData: Partial<InsertApplication>): Promise<Application | undefined> {
    const application = this.applications.get(id);
    if (!application) return undefined;
    
    const updatedApplication = { ...application, ...updateData };
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }
  
  // Activity methods
  async getAllActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values());
  }
  
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.activityCurrentId++;
    const activity: Activity = { ...insertActivity, id, createdAt: new Date() };
    this.activities.set(id, activity);
    return activity;
  }
  
  // Template methods
  async getAllTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values());
  }
  
  async getTemplate(id: number): Promise<Template | undefined> {
    return this.templates.get(id);
  }
  
  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const id = this.templateCurrentId++;
    const template: Template = { ...insertTemplate, id, createdAt: new Date() };
    this.templates.set(id, template);
    return template;
  }
}

export const storage = new MemStorage();
