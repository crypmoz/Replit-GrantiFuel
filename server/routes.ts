import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateProposal, answerQuestion } from "./services/ai";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes
  
  // Users routes
  app.get("/api/users/current", async (req, res) => {
    // Get the default admin user 
    const user = await storage.getUserByUsername("admin");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json(user);
  });
  
  app.get("/api/users/:id", async (req, res) => {
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

  app.post("/api/grants", async (req, res) => {
    const grant = await storage.createGrant(req.body);
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

  app.post("/api/artists", async (req, res) => {
    const artist = await storage.createArtist(req.body);
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

  app.post("/api/applications", async (req, res) => {
    const application = await storage.createApplication(req.body);
    return res.status(201).json(application);
  });

  app.patch("/api/applications/:id", async (req, res) => {
    const application = await storage.updateApplication(parseInt(req.params.id), req.body);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    return res.json(application);
  });

  // Activities routes
  app.get("/api/activities", async (req, res) => {
    const activities = await storage.getAllActivities();
    return res.json(activities);
  });

  app.post("/api/activities", async (req, res) => {
    const activity = await storage.createActivity(req.body);
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

  app.post("/api/templates", async (req, res) => {
    const template = await storage.createTemplate(req.body);
    return res.status(201).json(template);
  });

  // AI Assistant routes
  const generateProposalSchema = z.object({
    projectDescription: z.string(),
    grantName: z.string().optional(),
    artistName: z.string().optional(),
    proposalType: z.string().optional()
  });

  app.post("/api/ai/generate-proposal", async (req, res) => {
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
        userId: 1, // Default user ID
        action: "GENERATED",
        entityType: "PROPOSAL",
        entityId: 0, // Placeholder
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

  app.post("/api/ai/answer-question", async (req, res) => {
    try {
      const parsedBody = answerQuestionSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.error });
      }
      
      const { question, conversationHistory } = parsedBody.data;
      
      const answer = await answerQuestion(question, conversationHistory);
      
      // Create an activity to record the question
      await storage.createActivity({
        userId: 1, // Default user ID
        action: "ASKED",
        entityType: "QUESTION",
        entityId: 0, // Placeholder
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
