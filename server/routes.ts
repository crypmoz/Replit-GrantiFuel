import { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aiService, GrantRecommendation } from "./services/ai-service";
import { z } from "zod";
import { setupAuth } from "./auth";
import Stripe from "stripe";
import { db } from "./db";
import { users, subscriptions, grantRecommendationProfileSchema, type InsertArtist, type GrantWithAIRecommendation } from "@shared/schema";
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import { requireRole, requireAdmin, requireGrantWriter, requireManager, requireArtist } from './middleware/role-check';

// Middleware to prevent caching for all API responses
const noCacheMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  });
  next();
};

// Initialize Stripe with secret key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage2 = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    // Generate a unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter to allow only permitted file types
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
  const allowedExtensions = ['.pdf', '.docx', '.txt'];
  
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'));
  }
};

// Create multer upload instance
const upload = multer({ 
  storage: storage2,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication first
  setupAuth(app);
  
  // Apply the no-cache middleware to all API routes
  app.use('/api', noCacheMiddleware);
  
  // Basic authentication check - use this when any authenticated user can access a route
  const requireAuth = requireRole([]);
  
  // Add request batching for improved performance
  app.post("/api/batch", requireAuth, async (req, res) => {
    try {
      const { requests } = req.body;
      
      if (!Array.isArray(requests)) {
        return res.status(400).json({ error: "Requests must be an array" });
      }
      
      // Limit batch size for performance reasons
      if (requests.length > 20) {
        return res.status(400).json({ error: "Batch request limit exceeded (max 20)" });
      }
      
      const results = await Promise.all(
        requests.map(async (request) => {
          const { url, method = "GET", body } = request;
          
          if (!url || typeof url !== "string") {
            return { error: "Invalid request URL" };
          }
          
          try {
            // Extract path parameters from URL pattern
            const urlParts = url.split('/');
            let id: number | null = null;
            
            // Check for ID pattern in URL (like /api/resource/:id)
            if (urlParts.length > 3 && !isNaN(parseInt(urlParts[3]))) {
              id = parseInt(urlParts[3]);
            }
            
            // Create a mock response object that captures the response
            const mockRes = {
              status: (code: number) => {
                mockRes.statusCode = code;
                return mockRes;
              },
              json: (data: any) => {
                mockRes.data = data;
                return mockRes;
              },
              send: (data: any) => {
                mockRes.data = data;
                return mockRes;
              },
              statusCode: 200,
              data: null as any,
            };
            
            // Expanded route handling with more endpoints supported
            const userId = req.user?.id;
            
            // Handle different routes based on URL pattern and method
            if (url === "/api/user" && method === "GET") {
              mockRes.data = req.user;
            } 
            else if (url.startsWith("/api/subscription-plans") && method === "GET") {
              mockRes.data = await storage.getAllSubscriptionPlans();
            }
            else if (url === "/api/user/subscription" && method === "GET") {
              // Ensure userId exists before querying
              if (userId) {
                const subscription = await storage.getUserSubscription(userId);
                if (subscription) {
                  const plan = await storage.getSubscriptionPlan(subscription.planId);
                  mockRes.data = { subscription, plan };
                } else {
                  mockRes.status(404).json({ message: "No active subscription found" });
                }
              } else {
                mockRes.status(401).json({ message: "Authentication required" });
              }
            }
            // REST API endpoints with resource patterns
            else if (url.startsWith("/api/grants")) {
              if (method === "GET") {
                if (id) {
                  // Single grant request
                  const grant = await storage.getGrant(id);
                  if (grant) {
                    mockRes.data = grant;
                  } else {
                    mockRes.status(404).json({ message: "Grant not found" });
                  }
                } else {
                  // All grants request
                  mockRes.data = await storage.getAllGrants();
                }
              }
            } 
            else if (url.startsWith("/api/artists")) {
              if (method === "GET") {
                if (id) {
                  // Single artist request
                  const artist = await storage.getArtist(id);
                  if (artist) {
                    mockRes.data = artist;
                  } else {
                    mockRes.status(404).json({ message: "Artist not found" });
                  }
                } else {
                  // All artists request
                  mockRes.data = await storage.getAllArtists();
                }
              }
            } 
            else if (url.startsWith("/api/applications")) {
              if (method === "GET") {
                if (id) {
                  // Single application request
                  const application = await storage.getApplication(id);
                  if (application) {
                    mockRes.data = application;
                  } else {
                    mockRes.status(404).json({ message: "Application not found" });
                  }
                } else {
                  // All applications request
                  mockRes.data = await storage.getAllApplications();
                }
              }
            } 
            else if (url.startsWith("/api/documents")) {
              if (method === "GET") {
                if (id) {
                  // Single document request
                  const document = await storage.getDocument(id);
                  if (document) {
                    mockRes.data = document;
                  } else {
                    mockRes.status(404).json({ message: "Document not found" });
                  }
                } else {
                  // All documents request
                  mockRes.data = await storage.getAllDocuments();
                }
              }
            } 
            else if (url.startsWith("/api/templates")) {
              if (method === "GET") {
                if (id) {
                  // Single template request
                  const template = await storage.getTemplate(id);
                  if (template) {
                    mockRes.data = template;
                  } else {
                    mockRes.status(404).json({ message: "Template not found" });
                  }
                } else {
                  // All templates request
                  mockRes.data = await storage.getAllTemplates();
                }
              }
            } 
            else {
              mockRes.status(404).json({ error: "Route not found in batch processing" });
            }
            
            return {
              status: mockRes.statusCode,
              data: mockRes.data,
            };
          } catch (error: any) {
            console.error(`Error processing batch request for ${url}:`, error);
            return {
              status: 500,
              error: error.message || "Internal server error",
            };
          }
        })
      );
      
      // Send results without caching to ensure fresh data
      res.json({ results });
    } catch (error: any) {
      console.error("Error processing batch request:", error);
      res.status(500).json({ error: error.message || "Failed to process batch request" });
    }
  });
  
  // Serve uploaded files
  app.use('/uploads', express.static(uploadsDir));
  
  // API Routes
  
  // Users routes
  app.get("/api/users/current", requireAuth, (req, res) => {
    res.json(req.user);
  });
  
  // Admin user management routes
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      return res.json(users);
    } catch (error) {
      console.error("Error getting users:", error);
      return res.status(500).json({ message: "Error getting users" });
    }
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
  
  app.patch("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const { role, active } = req.body;
      
      // Validate input
      if (role && !['admin', 'grant_writer', 'manager', 'artist', 'user'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      if (typeof active !== 'undefined' && typeof active !== 'boolean') {
        return res.status(400).json({ message: "Active status must be boolean" });
      }
      
      const updatedUser = await storage.updateUser(
        parseInt(req.params.id), 
        { role, active }
      );
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      return res.status(500).json({ message: "Error updating user" });
    }
  });
  
  // Grants routes
  app.get("/api/grants", async (req, res) => {
    // If user is authenticated, try to provide personalized grants
    if (req.isAuthenticated()) {
      try {
        // Get the user's artist profile if it exists
        const userArtists = await storage.getArtistsByUserId(req.user!.id);
        
        // Get all grants for both scenarios (AI and regular matching)
        const allGrants = await storage.getAllGrants();
        
        // Get user's onboarding status
        const onboardingTasks = await storage.getUserOnboardingTasks(req.user!.id);
        
        // Mark that user has viewed grants
        if (!onboardingTasks.some(task => task.task === 'first_grant_viewed')) {
          await storage.completeOnboardingTask(req.user!.id, 'first_grant_viewed', {
            timestamp: new Date()
          });
        }
        
        // If user has an artist profile with genre data, use AI to generate recommendations
        if (userArtists.length > 0 && userArtists[0].genres && userArtists[0].genres.length > 0) {
          const userArtist = userArtists[0];
          
          try {
            // Create a profile for AI recommendation
            const aiProfile = {
              genre: userArtist.genres?.join(', ') || '',
              careerStage: userArtist.careerStage || '',
              instrumentOrRole: userArtist.primaryInstrument || '',
              location: userArtist.location || undefined,
              projectType: userArtist.projectType || undefined
            };
            
            // Call AI service to get recommendations
            const aiResult = await aiService.getGrantRecommendations(aiProfile);
            
            if (aiResult.success && aiResult.data && aiResult.data.length > 0) {
              console.log(`[AIService] Generated ${aiResult.data.length} recommendations for user ${req.user!.id}`);
              
              // Create an activity record for using AI recommendations
              await storage.createActivity({
                userId: req.user!.id,
                action: "RECEIVED",
                entityType: "AI_GRANT_RECOMMENDATIONS",
                details: {
                  count: aiResult.data.length,
                  source: "grants_page"
                }
              });
              
              // Merge AI recommendations with existing grants
              // For AI recommendations without exact matches in our database, keep them as supplementary
              const mergedGrants: GrantWithAIRecommendation[] = [...allGrants]; 
              const aiRecommendations = aiResult.data;
              
              // Add AI recommendations at the beginning with their match scores
              aiRecommendations.forEach(rec => {
                // Check if this recommendation already exists in our database (by name similarity)
                const existingIndex = mergedGrants.findIndex(g => 
                  g.name.toLowerCase() === rec.name.toLowerCase() || 
                  g.organization.toLowerCase() === rec.organization.toLowerCase()
                );
                
                if (existingIndex >= 0) {
                  // Update existing grant with AI match score
                  mergedGrants[existingIndex] = {
                    ...mergedGrants[existingIndex],
                    matchScore: rec.matchScore,
                    aiRecommended: true
                  } as GrantWithAIRecommendation;
                } else {
                  // Add new AI recommendation as a "virtual grant"
                  mergedGrants.unshift({
                    id: -1, // Use negative ID to mark as virtual
                    userId: req.user!.id,
                    name: rec.name,
                    organization: rec.organization,
                    amount: rec.amount,
                    deadline: typeof rec.deadline === 'string' ? new Date(rec.deadline) : new Date(),
                    description: rec.description,
                    requirements: Array.isArray(rec.requirements) 
                      ? rec.requirements.join(", ") 
                      : typeof rec.requirements === 'string' 
                        ? rec.requirements 
                        : "",
                    website: rec.url,
                    matchScore: rec.matchScore,
                    aiRecommended: true,
                    createdAt: new Date()
                  } as GrantWithAIRecommendation);
                }
              });
              
              // Sort by AI match score or regular match score
              const sortedGrants = mergedGrants
                .sort((a, b) => {
                  // Prioritize AI-recommended grants
                  if (a.aiRecommended && !b.aiRecommended) return -1;
                  if (!a.aiRecommended && b.aiRecommended) return 1;
                  
                  // Then sort by match score (if available)
                  const scoreA = a.matchScore || 0;
                  const scoreB = b.matchScore || 0;
                  return scoreB - scoreA;
                });
              
              // Complete the AI assistant onboarding task if needed
              try {
                const aiAssistantTask = onboardingTasks.find(t => t.task === 'ai_assistant_used');
                if (!aiAssistantTask) {
                  await storage.completeOnboardingTask(req.user!.id, 'ai_assistant_used', {
                    feature: 'integrated_grant_recommendations',
                    timestamp: new Date()
                  });
                }
              } catch (err) {
                console.error('Error updating onboarding task:', err);
                // Continue execution even if onboarding task update fails
              }
              
              return res.json({
                grants: sortedGrants,
                isPersonalized: true,
                profileComplete: true,
                aiEnhanced: true
              });
            }
          } catch (aiError) {
            console.error("Error getting AI grant recommendations:", aiError);
            // Fall back to basic recommendation algorithm below
          }
          
          // If AI service fails or returns no results, fall back to basic matching
          const genres = userArtist.genres || [];
          
          // Basic filtering/ranking logic for grants as fallback
          const rankedGrants: GrantWithAIRecommendation[] = allGrants.map(grant => {
            let matchScore = 50; // Base score
            
            // If the grant description or requirements contains any of the user's genres, increase score
            if (grant.description) {
              for (const genre of genres) {
                if (grant.description.toLowerCase().includes(genre.toLowerCase())) {
                  matchScore += 10;
                  break;
                }
              }
            }
            
            if (grant.requirements) {
              for (const genre of genres) {
                if (grant.requirements.toLowerCase().includes(genre.toLowerCase())) {
                  matchScore += 5;
                  break;
                }
              }
            }
            
            // Higher score for grants with upcoming deadlines (not expired)
            if (grant.deadline && new Date(grant.deadline) > new Date()) {
              matchScore += 15;
              
              // Even higher for grants with deadlines in the next 30 days
              const daysTillDeadline = Math.floor((new Date(grant.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
              if (daysTillDeadline <= 30) {
                matchScore += 10;
              }
            }
            
            return {
              ...grant,
              matchScore
            };
          });
          
          // Sort by match score
          const topGrants = rankedGrants
            .sort((a, b) => {
              const scoreA = a.matchScore || 0;
              const scoreB = b.matchScore || 0;
              return scoreB - scoreA;
            });
          
          // Return personalized grants with fallback matching
          return res.json({
            grants: topGrants,
            isPersonalized: true,
            profileComplete: true,
            aiEnhanced: false
          });
        } else {
          // User has no artist profile or incomplete data
          return res.json({
            grants: allGrants.slice(0, 10), // Show more grants when non-personalized
            isPersonalized: false,
            profileComplete: false,
            missingInfo: !userArtists.length ? 'artistProfile' : 'genres'
          });
        }
      } catch (error) {
        console.error("Error getting personalized grants:", error);
        // Fall back to regular grants
        const grants = await storage.getAllGrants();
        return res.json(grants);
      }
    } else {
      // Not authenticated, just return all grants
      const grants = await storage.getAllGrants();
      return res.json(grants);
    }
  });

  app.get("/api/grants/:id", async (req, res) => {
    const grant = await storage.getGrant(parseInt(req.params.id));
    if (!grant) {
      return res.status(404).json({ message: "Grant not found" });
    }
    return res.json(grant);
  });

  app.post("/api/grants", requireAuth, async (req, res) => {
    try {
      // Handle date strings properly
      const body = req.body;
      
      // If deadline is a string, convert it to a Date object
      if (typeof body.deadline === 'string') {
        body.deadline = new Date(body.deadline);
      }
      
      const grant = await storage.createGrant({
        ...body,
        userId: req.user!.id
      });
      
      return res.status(201).json(grant);
    } catch (error: any) {
      console.error("Error creating grant:", error);
      return res.status(500).json({ 
        message: "Failed to create grant", 
        error: error.message || "Unknown error" 
      });
    }
  });

  app.delete("/api/grants/:id", requireAdmin, async (req, res) => {
    try {
      const grantId = parseInt(req.params.id);
      if (isNaN(grantId)) {
        return res.status(400).json({ message: "Invalid grant ID" });
      }
      
      // Check if grant exists
      const grant = await storage.getGrant(grantId);
      if (!grant) {
        return res.status(404).json({ message: "Grant not found" });
      }
      
      // Delete the grant
      await storage.deleteGrant(grantId);
      
      // Return success
      return res.status(200).json({ message: "Grant deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting grant:", error);
      return res.status(500).json({ 
        message: "Failed to delete grant", 
        error: error.message || "Unknown error" 
      });
    }
  });
  
  // Artists routes
  app.get("/api/artists", async (req, res) => {
    const artists = await storage.getAllArtists();
    return res.json(artists);
  });
  
  // Get artists by user ID - this route must come before the /:id route
  app.get("/api/artists/by-user/:userId", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // If requesting someone else's artists, require admin
      if (userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Not authorized to view this artist" });
      }
      
      const artists = await storage.getArtistsByUserId(userId);
      return res.json(artists.length > 0 ? artists[0] : null);
    } catch (error) {
      console.error("Error fetching artist by user ID:", error);
      return res.status(500).json({ message: "Error fetching artist profile" });
    }
  });

  // Get artist by ID (this comes after the by-user route)
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
  
  app.patch("/api/artists/:id", requireAuth, async (req, res) => {
    try {
      // Get the artist first to check ownership
      const artist = await storage.getArtist(parseInt(req.params.id));
      
      if (!artist) {
        return res.status(404).json({ message: "Artist not found" });
      }
      
      // Check if the current user owns this artist or is an admin
      if (artist.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Not authorized to update this artist" });
      }
      
      // Only include valid fields to update (don't allow updating userId)
      const { name, email, phone, bio, genres, careerStage, primaryInstrument, location, projectType } = req.body;
      const updateData: Partial<InsertArtist> = {};
      
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (bio !== undefined) updateData.bio = bio;
      if (genres !== undefined) updateData.genres = genres;
      if (careerStage !== undefined) updateData.careerStage = careerStage;
      if (primaryInstrument !== undefined) updateData.primaryInstrument = primaryInstrument;
      if (location !== undefined) updateData.location = location;
      if (projectType !== undefined) updateData.projectType = projectType;
      
      // Update the artist
      const updatedArtist = await storage.updateArtist(parseInt(req.params.id), updateData);
      
      // Create activity record for the update
      await storage.createActivity({
        userId: req.user!.id,
        action: "UPDATED",
        entityType: "ARTIST",
        entityId: artist.id,
        details: { name: artist.name }
      });
      
      return res.json(updatedArtist);
    } catch (error: any) {
      console.error("Error updating artist:", error);
      return res.status(500).json({ message: "Error updating artist", error: error.message });
    }
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
      
      const result = await aiService.generateProposal({
        projectTitle: projectDescription.substring(0, 50) || "Project Proposal",  // Create a title from description
        artistName: artistName || "Artist",
        artistBio: "Professional musician",     // Default bio
        artistGenre: "Music",                   // Default genre
        grantName: grantName || "Arts Grant",
        grantOrganization: "Arts Foundation",   // Default organization
        grantRequirements: "Music project funding requirements", // Default requirements
        projectDescription: projectDescription || "Music project proposal"
      });
      
      if (!result.success) {
        return res.status(500).json({ error: result.error || "Failed to generate proposal" });
      }
      
      const proposal = result.data;
      
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
      
      const result = await aiService.answerQuestion({
        question,
        conversationHistory
      });
      
      if (!result.success) {
        return res.status(500).json({ error: result.error || "Failed to answer question" });
      }
      
      const answer = result.data;
      
      // Create an activity to record the question
      await storage.createActivity({
        userId: req.user!.id,
        action: "ASKED",
        entityType: "QUESTION",
        // No need to specify entityId if it's nullable in the schema
        details: {
          question: question.substring(0, 100),
          answer: answer ? answer.substring(0, 100) : "No answer generated"
        }
      });
      
      return res.json({ answer });
    } catch (error) {
      console.error('Error in answer question endpoint:', error);
      return res.status(500).json({ error: "Failed to answer question" });
    }
  });
  
  app.post("/api/ai/grant-recommendations", requireAuth, async (req, res) => {
    try {
      const parsedBody = grantRecommendationProfileSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.error });
      }
      
      const profile = parsedBody.data;
      
      // Call the enhanced AI service to get recommendations
      const result = await aiService.getGrantRecommendations(profile);
      
      if (!result.success) {
        return res.status(500).json({ error: result.error || "Failed to generate grant recommendations" });
      }
      
      const recommendations = result.data;
      
      // Create an activity to record the grant recommendations query
      await storage.createActivity({
        userId: req.user!.id,
        action: "REQUESTED",
        entityType: "GRANT_RECOMMENDATIONS",
        details: {
          genre: profile.genre,
          careerStage: profile.careerStage,
          instrumentOrRole: profile.instrumentOrRole,
          recommendationsCount: recommendations ? recommendations.length : 0
        }
      });
      
      // Complete the onboarding task if it hasn't been completed yet
      if (profile.genre && profile.careerStage && profile.instrumentOrRole) {
        try {
          const tasks = await storage.getUserOnboardingTasks(req.user!.id);
          const aiAssistantTask = tasks.find(t => t.task === 'ai_assistant_used');
          
          if (!aiAssistantTask) {
            await storage.completeOnboardingTask(req.user!.id, 'ai_assistant_used', {
              feature: 'grant_recommendations',
              timestamp: new Date()
            });
          }
        } catch (err) {
          console.error('Error updating onboarding task:', err);
          // Continue execution even if onboarding task update fails
        }
      }
      
      return res.json({ recommendations });
    } catch (error) {
      console.error('Error in grant recommendations endpoint:', error);
      return res.status(500).json({ error: "Failed to generate grant recommendations" });
    }
  });
  
  // Document analysis endpoint
  app.post("/api/ai/analyze-document/:id", requireAuth, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      
      if (isNaN(documentId)) {
        return res.status(400).json({ error: "Invalid document ID" });
      }
      
      // Check if the document exists and user has access
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      // Only allow document owners or admins to analyze
      if (document.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ error: "You don't have permission to analyze this document" });
      }
      
      // Get document analysis from AI service
      const result = await aiService.analyzeDocument(documentId);
      
      if (!result.success) {
        return res.status(500).json({ error: result.error || "Failed to analyze document" });
      }
      
      // Create an activity to record the document analysis
      await storage.createActivity({
        userId: req.user!.id,
        action: "ANALYZED",
        entityType: "DOCUMENT",
        entityId: documentId,
        details: {
          documentTitle: document.title,
          documentType: document.type
        }
      });
      
      return res.json({ analysis: result.data });
    } catch (error) {
      console.error("Error analyzing document:", error);
      return res.status(500).json({ error: "Failed to analyze document" });
    }
  });

  // Onboarding routes
  app.get("/api/onboarding", requireAuth, async (req, res) => {
    try {
      const tasks = await storage.getUserOnboardingTasks(req.user!.id);
      return res.json(tasks);
    } catch (error) {
      console.error("Error getting onboarding tasks:", error);
      return res.status(500).json({ message: "Error getting onboarding tasks" });
    }
  });

  app.post("/api/onboarding/complete", requireAuth, async (req, res) => {
    try {
      const { task, data } = req.body;
      
      if (!task) {
        return res.status(400).json({ message: "Task is required" });
      }
      
      const completedTask = await storage.completeOnboardingTask(req.user!.id, task, data);
      
      // Create an activity record for task completion
      await storage.createActivity({
        userId: req.user!.id,
        action: "COMPLETED",
        entityType: "ONBOARDING",
        entityId: completedTask.id,
        details: { task, completedAt: new Date() }
      });
      
      return res.status(201).json(completedTask);
    } catch (error) {
      console.error("Error completing onboarding task:", error);
      return res.status(500).json({ message: "Error completing onboarding task" });
    }
  });

  // Subscription routes
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await storage.getAllSubscriptionPlans();
      return res.json(plans);
    } catch (error) {
      console.error('Error getting subscription plans:', error);
      return res.status(500).json({ error: "Failed to get subscription plans" });
    }
  });

  app.get("/api/user/subscription", requireAuth, async (req, res) => {
    try {
      const subscription = await storage.getUserSubscription(req.user!.id);
      if (!subscription) {
        return res.status(404).json({ message: "No active subscription found" });
      }
      
      // Get the plan details
      const plan = await storage.getSubscriptionPlan(subscription.planId);
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      return res.json({ subscription, plan });
    } catch (error) {
      console.error('Error getting user subscription:', error);
      return res.status(500).json({ error: "Failed to get subscription" });
    }
  });

  // Stripe payment and subscription routes
  app.post("/api/create-customer", requireAuth, async (req, res) => {
    try {
      // Check if user already has a Stripe customer ID
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.stripeCustomerId) {
        return res.json({ customerId: user.stripeCustomerId });
      }
      
      // Create a new customer
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: user.username,
        metadata: {
          userId: user.id.toString()
        }
      });
      
      // Update user with Stripe customer ID
      await storage.updateStripeCustomerId(user.id, customer.id);
      
      return res.json({ customerId: customer.id });
    } catch (error: any) {
      console.error('Error creating Stripe customer:', error);
      return res.status(500).json({ error: error.message || "Failed to create customer" });
    }
  });

  app.post("/api/create-subscription", requireAuth, async (req, res) => {
    try {
      const { planId } = req.body;
      if (!planId) {
        return res.status(400).json({ error: "Missing required plan ID" });
      }
      
      // Get the user
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get the plan
      const plan = await storage.getSubscriptionPlan(parseInt(planId));
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      // Create or get the customer
      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          name: user.username,
          metadata: {
            userId: user.id.toString()
          }
        });
        
        customerId = customer.id;
        await storage.updateStripeCustomerId(user.id, customerId);
      }
      
      // Create a payment intent directly instead of subscription
      // This works around potential issues with Stripe price IDs
      const paymentIntent = await stripe.paymentIntents.create({
        amount: plan.price, // Already in cents in our database
        currency: "usd",
        customer: customerId,
        metadata: {
          userId: user.id.toString(),
          planId: plan.id.toString(),
          planName: plan.name,
          planTier: plan.tier
        },
      });
      
      // We'll create the subscription record after successful payment
      // through the webhook, or manually in our database for now
      
      return res.json({
        clientSecret: paymentIntent.client_secret,
        planName: plan.name,
        planPrice: plan.price
      });
    } catch (error: any) {
      console.error('Error creating subscription payment:', error);
      return res.status(500).json({ error: error.message || "Failed to create subscription payment" });
    }
  });

  app.post("/api/cancel-subscription", requireAuth, async (req, res) => {
    try {
      // Get the user's current subscription
      const subscription = await storage.getUserSubscription(req.user!.id);
      if (!subscription) {
        return res.status(404).json({ message: "No active subscription found" });
      }
      
      if (!subscription.stripeSubscriptionId) {
        return res.status(400).json({ message: "No Stripe subscription ID found" });
      }
      
      // Cancel at period end
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
      
      // Update the subscription in the database
      await storage.updateSubscription(subscription.id, {
        status: 'canceled'
      });
      
      // Update the canceledAt field using the storage method
      await storage.updateSubscriptionCanceledAt(subscription.id, new Date());
      
      return res.json({ message: "Subscription canceled successfully" });
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      return res.status(500).json({ error: error.message || "Failed to cancel subscription" });
    }
  });
  
  // One-time payment
  app.post("/api/create-payment-intent", requireAuth, async (req, res) => {
    try {
      const { amount, planId } = req.body;
      
      // Validate input
      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }
      
      // Get the plan if planId is provided
      let plan;
      if (planId) {
        plan = await storage.getSubscriptionPlan(parseInt(planId));
        if (!plan) {
          return res.status(404).json({ message: "Subscription plan not found" });
        }
      }
      
      // Create a PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          userId: req.user!.id.toString(),
          planId: planId ? planId.toString() : undefined
        },
      });
      
      // Return the client secret
      return res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      return res.status(500).json({ error: error.message || "Failed to create payment intent" });
    }
  });

  // Record successful payment and create subscription
  app.post("/api/record-subscription-payment", requireAuth, async (req, res) => {
    try {
      const { paymentIntentId, planId } = req.body;
      
      if (!paymentIntentId || !planId) {
        return res.status(400).json({ error: "Missing required payment intent ID or plan ID" });
      }
      
      // Verify the payment intent exists and is successful
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (!paymentIntent || paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ error: "Invalid payment intent or payment not successful" });
      }
      
      // Get the plan
      const plan = await storage.getSubscriptionPlan(parseInt(planId));
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      // Get the user
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user already has an active subscription
      const existingSubscription = await storage.getUserSubscription(user.id);
      if (existingSubscription && existingSubscription.status === 'active') {
        return res.status(400).json({ message: "User already has an active subscription" });
      }
      
      // Calculate subscription period (1 month from now)
      const now = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      
      // Save subscription to database
      const subscription = await storage.createSubscription({
        userId: user.id,
        planId: plan.id,
        stripeCustomerId: user.stripeCustomerId || '', // Should be set by this point
        stripeSubscriptionId: paymentIntentId, // We're using the payment intent ID as a reference
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: endDate
      });
      
      return res.status(201).json({
        message: "Subscription created successfully",
        subscription
      });
    } catch (error: any) {
      console.error('Error recording subscription payment:', error);
      return res.status(500).json({ error: error.message || "Failed to record subscription" });
    }
  });

  // Stripe webhook handler for subscription events
  app.post("/api/stripe-webhook", async (req, res) => {
    let event;
    
    try {
      // Verify the event came from Stripe
      const signature = req.headers['stripe-signature'] as string;
      
      if (!process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(400).json({ error: "Missing Stripe webhook secret" });
      }
      
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error: any) {
      console.error('⚠️ Webhook signature verification failed:', error.message);
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }
    
    // Handle the event
    switch (event.type) {
      case 'invoice.payment_succeeded':
        const invoicePaymentSucceeded = event.data.object as Stripe.Invoice;
        // Handle successful payment
        if (invoicePaymentSucceeded.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoicePaymentSucceeded.subscription as string
          );
          
          const userId = await getUserIdFromCustomerId(subscription.customer as string);
          if (userId) {
            const userSubscription = await storage.getUserSubscription(userId);
            if (userSubscription) {
              await storage.updateSubscription(userSubscription.id, {
                status: subscription.status,
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000)
              });
            }
          }
        }
        break;
        
      case 'invoice.payment_failed':
        const invoicePaymentFailed = event.data.object as Stripe.Invoice;
        // Handle failed payment
        if (invoicePaymentFailed.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoicePaymentFailed.subscription as string
          );
          
          const userId = await getUserIdFromCustomerId(subscription.customer as string);
          if (userId) {
            const userSubscription = await storage.getUserSubscription(userId);
            if (userSubscription) {
              await storage.updateSubscription(userSubscription.id, {
                status: 'past_due'
              });
            }
          }
        }
        break;
        
      case 'customer.subscription.deleted':
        const subscriptionDeleted = event.data.object as Stripe.Subscription;
        // Handle subscription cancellation
        const userId = await getUserIdFromCustomerId(subscriptionDeleted.customer as string);
        if (userId) {
          const userSubscription = await storage.getUserSubscription(userId);
          if (userSubscription) {
            // Update status
            await storage.updateSubscription(userSubscription.id, {
              status: 'canceled'
            });
            
            // Update the canceledAt field using the storage method
            await storage.updateSubscriptionCanceledAt(userSubscription.id, new Date());
          }
        }
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
  });

  // Knowledge Documents routes
  app.get("/api/documents", requireAuth, async (req, res) => {
    try {
      // Regular users can only see approved and public documents or their own
      // Admin users can see all documents
      if (req.user!.role === 'admin') {
        const documents = await storage.getAllDocuments();
        return res.json(documents);
      } else {
        // Get approved public documents
        const approvedDocs = await storage.getApprovedDocuments();
        
        // Get user's own documents
        const userDocs = await storage.getDocumentsByUser(req.user!.id);
        
        // Combine and deduplicate (a user's doc might also be approved)
        const combinedDocs = [...approvedDocs];
        
        // Add user docs that aren't already in the approved list
        for (const userDoc of userDocs) {
          if (!combinedDocs.some(doc => doc.id === userDoc.id)) {
            combinedDocs.push(userDoc);
          }
        }
        
        return res.json(combinedDocs);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      return res.status(500).json({ error: "Failed to retrieve documents" });
    }
  });
  
  app.get("/api/documents/:id", requireAuth, async (req, res) => {
    try {
      const docId = parseInt(req.params.id);
      const document = await storage.getDocument(docId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check if user has permission to view this document
      const isAdmin = req.user!.role === 'admin';
      const isOwner = document.userId === req.user!.id;
      const isPublicAndApproved = document.isPublic && document.isApproved;
      
      if (!isAdmin && !isOwner && !isPublicAndApproved) {
        return res.status(403).json({ message: "You don't have permission to view this document" });
      }
      
      return res.json(document);
    } catch (error) {
      console.error('Error fetching document:', error);
      return res.status(500).json({ error: "Failed to retrieve document" });
    }
  });
  
  // Regular document creation (without file)
  app.post("/api/documents", requireAuth, async (req, res) => {
    try {
      // All documents are automatically approved for AI training
      let documentData = {
        ...req.body,
        userId: req.user!.id,
        isApproved: true
      };
      
      const document = await storage.createDocument(documentData);
      
      // Create an activity record
      await storage.createActivity({
        userId: req.user!.id,
        action: "CREATED",
        entityType: "DOCUMENT",
        entityId: document.id,
        details: {
          title: document.title,
          type: document.type
        }
      });
      
      return res.status(201).json(document);
    } catch (error) {
      console.error('Error creating document:', error);
      return res.status(500).json({ error: "Failed to create document" });
    }
  });
  
  // Document creation with file upload
  app.post("/api/documents/upload", requireAuth, upload.single('file'), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      // Determine if this is an admin user (for auto-classification)
      const isAdmin = req.user!.role === 'admin';
      
      // Check if this is part of a batch upload (admin only)
      const isBatchUpload = isAdmin && req.body.isBatchUpload === 'true';
      
      // Determine file type for database
      let fileType: 'pdf' | 'docx' | 'txt' = 'none' as any;
      const extension = path.extname(file.originalname).toLowerCase();
      
      if (extension === '.pdf') fileType = 'pdf';
      else if (extension === '.docx') fileType = 'docx';
      else if (extension === '.txt') fileType = 'txt';
      
      // Create relative URL for file
      const fileUrl = `/uploads/${path.basename(file.path)}`;
      
      let documentData: any;
      
      // If admin is uploading, we can use AI to extract info automatically
      if (isAdmin && req.body.autoClassify === 'true') {
        try {
          // Read file content
          const fileContent = fs.readFileSync(file.path, 'utf8');
          
          // Use AI to classify document
          const classificationResult = await aiService.classifyDocument(fileContent, file.originalname);
          
          if (!classificationResult.success || !classificationResult.data) {
            throw new Error('AI classification failed');
          }
          
          // Use the AI-generated metadata
          const { 
            title, 
            content, 
            type, 
            tags, 
            confidence
          } = classificationResult.data;
          
          documentData = {
            userId: req.user!.id,
            title,
            content,
            type,
            tags,
            isPublic: req.body.isPublic === 'true',
            // File data
            fileName: file.originalname,
            fileType,
            fileUrl,
            fileSize: file.size,
            // Classification confidence
            aiClassified: true,
            aiConfidence: confidence
          };
        } catch (aiError) {
          console.error('[Server] AI document classification failed:', aiError);
          // Fall back to manual fields if AI fails
          
          // Get JSON data from request body
          const { title, content, type, tags, isPublic } = req.body;
          
          if (!title || !content || !type) {
            // Clean up uploaded file if data is invalid
            fs.unlinkSync(file.path);
            return res.status(400).json({ 
              error: "AI classification failed and required fields are missing. Please provide title, content, and type." 
            });
          }
          
          documentData = {
            userId: req.user!.id,
            title,
            content,
            type,
            tags: tags ? JSON.parse(tags) : [],
            isPublic: isPublic === 'true',
            // File data
            fileName: file.originalname,
            fileType,
            fileUrl,
            fileSize: file.size,
            aiClassified: false
          };
        }
      } else {
        // Regular upload process (non-admin or admin without auto-classification)
        // Get JSON data from request body
        const { title, content, type, tags, isPublic } = req.body;
        
        if (!title || !content || !type) {
          // Clean up uploaded file if data is invalid
          fs.unlinkSync(file.path);
          return res.status(400).json({ error: "Missing required fields: title, content, and type are required" });
        }
        
        documentData = {
          userId: req.user!.id,
          title,
          content,
          type,
          tags: tags ? JSON.parse(tags) : [],
          isPublic: isPublic === 'true',
          // File data
          fileName: file.originalname,
          fileType,
          fileUrl,
          fileSize: file.size,
          aiClassified: false
        };
      }
      
      // All documents are automatically approved for AI training
      documentData.isApproved = true;
      
      const document = await storage.createDocument(documentData);
      
      // Create an activity record
      await storage.createActivity({
        userId: req.user!.id,
        action: "UPLOADED",
        entityType: "DOCUMENT",
        entityId: document.id,
        details: {
          title: document.title,
          type: document.type,
          fileName: document.fileName,
          fileType: document.fileType,
          aiClassified: documentData.aiClassified || false,
          isBatchUpload: isBatchUpload || false
        }
      });
      
      return res.status(201).json(document);
    } catch (error) {
      console.error('Error uploading document:', error);
      
      // Clean up file if there was an error
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting file after failed upload:', unlinkError);
        }
      }
      
      return res.status(500).json({ error: "Failed to upload document" });
    }
  });
  
  app.put("/api/documents/:id", requireAuth, async (req, res) => {
    try {
      const docId = parseInt(req.params.id);
      const existingDoc = await storage.getDocument(docId);
      
      if (!existingDoc) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check if user has permission to update this document
      const isAdmin = req.user!.role === 'admin';
      const isOwner = existingDoc.userId === req.user!.id;
      
      if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: "You don't have permission to update this document" });
      }
      
      // For regular users, prevent setting isApproved
      let updateData = { ...req.body };
      if (!isAdmin) {
        delete updateData.isApproved;
      }
      
      const updatedDoc = await storage.updateDocument(docId, updateData);
      return res.json(updatedDoc);
    } catch (error) {
      console.error('Error updating document:', error);
      return res.status(500).json({ error: "Failed to update document" });
    }
  });
  
  app.delete("/api/documents/:id", requireAuth, async (req, res) => {
    try {
      const docId = parseInt(req.params.id);
      const existingDoc = await storage.getDocument(docId);
      
      if (!existingDoc) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check if user has permission to delete this document
      const isAdmin = req.user!.role === 'admin';
      const isOwner = existingDoc.userId === req.user!.id;
      
      if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: "You don't have permission to delete this document" });
      }
      
      await storage.deleteDocument(docId);
      
      // Create an activity record
      await storage.createActivity({
        userId: req.user!.id,
        action: "DELETED",
        entityType: "DOCUMENT",
        entityId: docId,
        details: {
          title: existingDoc.title,
          type: existingDoc.type
        }
      });
      
      return res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error('Error deleting document:', error);
      return res.status(500).json({ error: "Failed to delete document" });
    }
  });
  
  // Approve a document (admin only)
  app.post("/api/documents/:id/approve", requireAuth, async (req, res) => {
    try {
      // Check if user is an admin
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Only administrators can approve documents" });
      }
      
      const docId = parseInt(req.params.id);
      const existingDoc = await storage.getDocument(docId);
      
      if (!existingDoc) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const updatedDoc = await storage.updateDocument(docId, {
        isApproved: true
      });
      
      // Create an activity record
      await storage.createActivity({
        userId: req.user!.id,
        action: "APPROVED",
        entityType: "DOCUMENT",
        entityId: docId,
        details: {
          title: existingDoc.title,
          type: existingDoc.type
        }
      });
      
      return res.json(updatedDoc);
    } catch (error) {
      console.error('Error approving document:', error);
      return res.status(500).json({ error: "Failed to approve document" });
    }
  });

  // Helper function to get user ID from Stripe customer ID
  async function getUserIdFromCustomerId(customerId: string): Promise<number | null> {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (!customer || customer.deleted) {
        return null;
      }
      
      // Try to get the user ID from metadata
      if (customer.metadata && customer.metadata.userId) {
        return parseInt(customer.metadata.userId);
      }
      
      // If not in metadata, try to find by customer ID in the database
      const usersFound = await db.select().from(users).where(eq(users.stripeCustomerId, customerId));
      if (usersFound.length > 0) {
        return usersFound[0].id;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user from customer ID:', error);
      return null;
    }
  }

  const httpServer = createServer(app);

  return httpServer;
}
