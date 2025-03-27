import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateProposal, answerQuestion } from "./services/ai";
import { z } from "zod";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Middleware to check authentication for protected routes
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };
  
  // API Routes
  
  // Users routes
  app.get("/api/users/current", requireAuth, (req, res) => {
    res.json(req.user);
  });
  
  app.get("/api/users/:id", requireAuth, async (req, res) => {
    // Only allow admin to access other users or users to access their own info
    if (req.user!.id !== parseInt(req.params.id) && req.user!.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const user = await storage.getUser(parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json(user);
  });
  
  // Grants routes
  app.get("/api/grants", async (req, res) => {
    const grants = await storage.getAllGrants();
    return res.json(grants);
  });

  app.get("/api/grants/:id", async (req, res) => {
    const grant = await storage.getGrant(parseInt(req.params.id));
    if (!grant) {
      return res.status(404).json({ message: "Grant not found" });
    }
    return res.json(grant);
  });

  app.post("/api/grants", requireAuth, async (req, res) => {
    const grant = await storage.createGrant({
      ...req.body,
      userId: req.user!.id
    });
    return res.status(201).json(grant);
  });
  
  // Artists routes
  app.get("/api/artists", async (req, res) => {
    const artists = await storage.getAllArtists();
    return res.json(artists);
  });

  app.get("/api/artists/:id", async (req, res) => {
    const artist = await storage.getArtist(parseInt(req.params.id));
    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }
    return res.json(artist);
  });

  app.post("/api/artists", requireAuth, async (req, res) => {
    const artist = await storage.createArtist({
      ...req.body,
      userId: req.user!.id
    });
    return res.status(201).json(artist);
  });
  
  // Applications routes
  app.get("/api/applications", async (req, res) => {
    const applications = await storage.getAllApplications();
    return res.json(applications);
  });

  app.get("/api/applications/:id", async (req, res) => {
    const application = await storage.getApplication(parseInt(req.params.id));
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    return res.json(application);
  });

  app.post("/api/applications", requireAuth, async (req, res) => {
    const application = await storage.createApplication({
      ...req.body,
      userId: req.user!.id
    });
    return res.status(201).json(application);
  });

  app.patch("/api/applications/:id", requireAuth, async (req, res) => {
    // Get existing application to verify ownership
    const existingApplication = await storage.getApplication(parseInt(req.params.id));
    if (!existingApplication) {
      return res.status(404).json({ message: "Application not found" });
    }
    
    // Check if the application belongs to the current user
    if (existingApplication.userId !== req.user!.id) {
      return res.status(403).json({ message: "You don't have permission to modify this application" });
    }
    
    const application = await storage.updateApplication(parseInt(req.params.id), req.body);
    return res.json(application);
  });

  // Activities routes
  app.get("/api/activities", async (req, res) => {
    const activities = await storage.getAllActivities();
    return res.json(activities);
  });

  app.post("/api/activities", requireAuth, async (req, res) => {
    const activity = await storage.createActivity({
      ...req.body,
      userId: req.user!.id
    });
    return res.status(201).json(activity);
  });

  // Templates routes
  app.get("/api/templates", async (req, res) => {
    const templates = await storage.getAllTemplates();
    return res.json(templates);
  });

  app.get("/api/templates/:id", async (req, res) => {
    const template = await storage.getTemplate(parseInt(req.params.id));
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }
    return res.json(template);
  });

  app.post("/api/templates", requireAuth, async (req, res) => {
    const template = await storage.createTemplate({
      ...req.body,
      userId: req.user!.id
    });
    return res.status(201).json(template);
  });
  
  app.put("/api/templates/:id", requireAuth, async (req, res) => {
    // Get existing template to verify ownership
    const existingTemplate = await storage.getTemplate(parseInt(req.params.id));
    if (!existingTemplate) {
      return res.status(404).json({ message: "Template not found" });
    }
    
    // Check if the template belongs to the current user
    if (existingTemplate.userId !== req.user!.id) {
      return res.status(403).json({ message: "You don't have permission to modify this template" });
    }
    
    const template = await storage.updateTemplate(parseInt(req.params.id), req.body);
    return res.json(template);
  });

  // AI Assistant routes
  const generateProposalSchema = z.object({
    projectDescription: z.string(),
    grantName: z.string().optional(),
    artistName: z.string().optional(),
    proposalType: z.string().optional()
  });

  app.post("/api/ai/generate-proposal", requireAuth, async (req, res) => {
    try {
      const parsedBody = generateProposalSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.error });
      }
      
      const { projectDescription, grantName, artistName, proposalType } = parsedBody.data;
      
      const proposal = await generateProposal(
        projectDescription,
        grantName,
        artistName,
        proposalType
      );
      
      // Create an activity to record the proposal generation
      await storage.createActivity({
        userId: req.user!.id,
        action: "GENERATED",
        entityType: "PROPOSAL",
        // No need to specify entityId if it's nullable in the schema
        details: {
          projectDescription: projectDescription.substring(0, 100),
          grantName,
          artistName
        }
      });
      
      return res.json({ proposal });
    } catch (error) {
      console.error('Error in proposal generation endpoint:', error);
      return res.status(500).json({ error: "Failed to generate proposal" });
    }
  });

  const answerQuestionSchema = z.object({
    question: z.string(),
    conversationHistory: z.array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string()
      })
    ).optional().default([])
  });

  app.post("/api/ai/answer-question", requireAuth, async (req, res) => {
    try {
      const parsedBody = answerQuestionSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.error });
      }
      
      const { question, conversationHistory } = parsedBody.data;
      
      const answer = await answerQuestion(question, conversationHistory);
      
      // Create an activity to record the question
      await storage.createActivity({
        userId: req.user!.id,
        action: "ASKED",
        entityType: "QUESTION",
        // No need to specify entityId if it's nullable in the schema
        details: {
          question: question.substring(0, 100),
          answer: answer.substring(0, 100)
        }
      });
      
      return res.json({ answer });
    } catch (error) {
      console.error('Error in answer question endpoint:', error);
      return res.status(500).json({ error: "Failed to answer question" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
