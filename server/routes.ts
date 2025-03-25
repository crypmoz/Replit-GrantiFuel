import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateProposal, answerQuestion } from "./services/ai";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes
  
  // Users routes
  app.get("/api/users/:id", async (req, res) => {
    const user = await storage.getUser(parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json(user);
  });

  app.get("/api/users/current", async (req, res) => {
    // Mock current user for now
    const user = await storage.getUserByUsername("johndoe");
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

  const httpServer = createServer(app);

  return httpServer;
}
