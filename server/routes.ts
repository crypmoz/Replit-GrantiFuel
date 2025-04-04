import { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aiService, GrantRecommendation } from "./services/ai-service";
import { anthropicService } from "./services/anthropic-service";
import { backgroundProcessor } from "./services/background-processor";
import { z } from "zod";
import axios from "axios";
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
            else if (url === "/api/user/onboarding" && method === "GET") {
              // Ensure userId exists before querying
              if (userId) {
                const onboardingTasks = await storage.getUserOnboardingTasks(userId);
                mockRes.data = onboardingTasks;
              } else {
                mockRes.status(401).json({ message: "Authentication required" });
              }
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
            // Templates feature removed - considered useless
            /*
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
            */
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
  
  // Admin Tools
  app.post("/api/admin/ai/reset-circuit-breaker", requireAdmin, async (req, res) => {
    try {
      console.log(`[Admin] Circuit breaker reset requested by user ${req.user!.id}`);
      
      // Call the reset method
      const resetResult = aiService.resetCircuitBreaker();
      
      // Log the activity
      await storage.createActivity({
        userId: req.user!.id,
        action: 'ai_circuit_breaker_reset',
        entityType: 'admin_action',
        details: {
          status: resetResult.status,
          message: resetResult.message
        }
      });
      
      return res.json(resetResult);
    } catch (error: any) {
      console.error('Error resetting AI circuit breaker:', error);
      return res.status(500).json({ 
        status: 'error',
        message: error.message || "Failed to reset circuit breaker"
      });
    }
  });
  
  // Get AI service status for admin
  app.get("/api/admin/ai/status", requireAdmin, async (req, res) => {
    try {
      console.log(`[Admin] AI status check requested by user ${req.user!.id}`);
      
      // Get service info using the proper method
      const serviceInfo = aiService.getServiceInfo();
      
      // Log the activity
      await storage.createActivity({
        userId: req.user!.id,
        action: 'ai_status_check',
        entityType: 'admin_action',
        details: {
          timestamp: new Date().toISOString()
        }
      });
      
      return res.json({
        status: 'success',
        message: 'AI system status retrieved successfully',
        ...serviceInfo
      });
    } catch (error: any) {
      console.error('Error getting AI status:', error);
      return res.status(500).json({ 
        status: 'error',
        message: error.message || "Failed to get AI status"
      });
    }
  });
  
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
        
        // Always try to use AI to generate recommendations for any artist/musician role
        // This will work even if the user doesn't have a complete profile
        const userRole = req.user!.role;
        
        // Check if user is artist or grant writer (both should get recommendations)
        if (userRole === 'artist' || userRole === 'grant_writer') {
          // Get artist profile if it exists (or create a minimal default one)
          const userArtist = userArtists.length > 0 ? userArtists[0] : {
            id: null,
            genres: [],
            careerStage: '',
            primaryInstrument: '',
            location: '',
            projectType: ''
          };
          
          // First check if we already have cached recommendations
          const cachedRecommendations = await storage.getGrantRecommendationsForUser(req.user!.id);
          
          if (cachedRecommendations && 
              cachedRecommendations.recommendations && 
              Array.isArray(cachedRecommendations.recommendations) &&
              cachedRecommendations.recommendations.length > 0) {
            
            console.log(`[Cache] Using cached recommendations for user ${req.user!.id}`);
            
            // We have cached recommendations, use them
            const aiRecommendations = cachedRecommendations.recommendations;
            
            // Create an activity record for using cached recommendations
            await storage.createActivity({
              userId: req.user!.id,
              action: "RETRIEVED",
              entityType: "CACHED_GRANT_RECOMMENDATIONS",
              details: {
                count: Array.isArray(aiRecommendations) ? aiRecommendations.length : 0,
                source: "grants_page",
                cacheAge: cachedRecommendations.updatedAt 
                  ? Math.floor((Date.now() - new Date(cachedRecommendations.updatedAt).getTime()) / (1000 * 60)) + ' minutes'
                  : 'unknown'
              }
            });
            
            // Merge AI recommendations with existing grants
            const mergedGrants: GrantWithAIRecommendation[] = [...allGrants]; 
            
            // Add AI recommendations at the beginning with their match scores
            aiRecommendations.forEach(rec => {
              // Check if this recommendation already exists in our database (by name similarity)
              const existingIndex = mergedGrants.findIndex(g => 
                g.name.toLowerCase() === rec.name.toLowerCase() || 
                g.organization?.toLowerCase() === rec.organization?.toLowerCase()
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
                  organization: rec.organization || "Unknown",
                  amount: rec.amount || "$0-$10,000",
                  deadline: typeof rec.deadline === 'string' ? new Date(rec.deadline) : new Date(),
                  description: rec.description || "",
                  requirements: Array.isArray(rec.requirements) 
                    ? rec.requirements.join(", ") 
                    : typeof rec.requirements === 'string' 
                      ? rec.requirements 
                      : "",
                  website: rec.url || "",
                  matchScore: rec.matchScore || 50,
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
            
            // Instead of running AI again, schedule a background refresh if cache is old
            const cacheAgeMs = cachedRecommendations.updatedAt 
              ? Date.now() - new Date(cachedRecommendations.updatedAt).getTime()
              : Number.MAX_SAFE_INTEGER;
            
            const CACHE_REFRESH_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours
            
            if (cacheAgeMs > CACHE_REFRESH_THRESHOLD) {
              // Queue a background refresh without waiting for it
              console.log(`[Cache] Scheduling background refresh of recommendations for user ${req.user!.id}`);
              setTimeout(async () => {
                try {
                  // Create a profile for AI recommendation with default values if needed
                  const aiProfile = {
                    genre: userArtist.genres?.join(', ') || 'music',
                    careerStage: userArtist.careerStage || 'all stages',
                    instrumentOrRole: userArtist.primaryInstrument || 'musician',
                    location: userArtist.location || undefined,
                    projectType: userArtist.projectType || undefined,
                    userId: req.user!.id // Always include userId to access all documents
                  };
                  
                  const refreshResult = await aiService.getGrantRecommendations(aiProfile);
                  if (refreshResult.success && refreshResult.data && refreshResult.data.length > 0) {
                    console.log(`[Background] Refreshed ${refreshResult.data.length} recommendations for user ${req.user!.id}`);
                    
                    // Save updated recommendations to database for future use
                    await storage.createOrUpdateGrantRecommendations({
                      userId: req.user!.id,
                      artistId: userArtist.id || null,
                      recommendations: refreshResult.data,
                      queryParams: aiProfile
                    });
                  }
                } catch (backgroundError) {
                  console.error('[Background] Failed to refresh recommendations:', backgroundError);
                }
              }, 100); // Just enough delay to not block the response
            }
            
            return res.json({
              grants: sortedGrants,
              isPersonalized: true,
              profileComplete: true,
              aiEnhanced: true,
              fromCache: true
            });
          } else {
            // No cached recommendations, we'll need to create a job to generate them
            // But first, return placeholder recommendations so the page loads quickly
            
            // Return grants without placeholders
            const loading = {
              message: "Loading personalized grant recommendations...",
              status: "loading"
            };
            
            // Create a profile for AI recommendation
            const aiProfile = {
              genre: userArtist.genres?.join(', ') || 'music',
              careerStage: userArtist.careerStage || 'all stages',
              instrumentOrRole: userArtist.primaryInstrument || 'musician',
              location: userArtist.location || undefined,
              projectType: userArtist.projectType || undefined,
              userId: req.user!.id // Always include userId to access all documents
            };
            
            // Trigger background job to generate real recommendations
            setTimeout(async () => {
              try {
                console.log(`[Background] Starting recommendation generation for user ${req.user!.id}`);
                const backgroundResult = await aiService.getGrantRecommendations(aiProfile);
                if (backgroundResult.success && backgroundResult.data && backgroundResult.data.length > 0) {
                  console.log(`[Background] Generated ${backgroundResult.data.length} recommendations for user ${req.user!.id}`);
                  
                  // Save to database for future use
                  await storage.createOrUpdateGrantRecommendations({
                    userId: req.user!.id,
                    artistId: userArtist.id || null,
                    recommendations: backgroundResult.data,
                    queryParams: aiProfile
                  });
                }
              } catch (backgroundError) {
                console.error('[Background] Failed to generate recommendations:', backgroundError);
              }
            }, 100);
            
            // Log activity
            await storage.createActivity({
              userId: req.user!.id,
              action: "GENERATING",
              entityType: "GRANT_RECOMMENDATIONS",
              details: {
                loadingState: true,
                regularGrantsShown: allGrants.length
              }
            });
            
            return res.json({
              grants: allGrants,
              isPersonalized: true,
              profileComplete: true,
              aiEnhanced: false,
              fromCache: false,
              generatingRecommendations: true,
              loadingMessage: loading.message
            });
          }
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
        return res.json({ grants });
      }
    } else {
      // Not authenticated, just return all grants
      const grants = await storage.getAllGrants();
      return res.json({ grants });
    }
  });

  app.get("/api/grants/:id", async (req, res) => {
    // Check if the ID is a document-based recommendation (starts with "doc-based-")
    if (req.params.id.startsWith("doc-based-")) {
      // This is an AI-generated recommendation, not stored in the database
      // Return the cached recommendation or an error
      return res.status(404).json({ message: "Grant not found in database. This may be an AI-generated recommendation." });
    }
    
    // Parse ID as integer for database lookup, with error handling
    let grantId;
    try {
      grantId = parseInt(req.params.id);
      if (isNaN(grantId)) {
        throw new Error("Invalid grant ID format");
      }
    } catch (error) {
      return res.status(400).json({ message: "Invalid grant ID format" });
    }
    
    const grant = await storage.getGrant(grantId);
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
    try {
      // Find the first artist for this user
      const userArtists = await storage.getArtistsByUserId(req.user!.id);
      
      if (!userArtists || userArtists.length === 0) {
        return res.status(400).json({ 
          message: "You need to create an artist profile before submitting applications",
          code: "ARTIST_REQUIRED"
        });
      }
      
      // Use the first artist ID if none is specified
      const application = await storage.createApplication({
        ...req.body,
        userId: req.user!.id,
        artistId: req.body.artistId || userArtists[0].id
      });
      
      return res.status(201).json(application);
    } catch (error: any) {
      console.error("Error creating application:", error);
      return res.status(500).json({ 
        message: "Error creating application", 
        error: error.message 
      });
    }
  });

  app.patch("/api/applications/:id", requireAuth, async (req, res) => {
    try {
      // Get existing application to verify ownership
      const existingApplication = await storage.getApplication(parseInt(req.params.id));
      if (!existingApplication) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Check if the application belongs to the current user
      if (existingApplication.userId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have permission to modify this application" });
      }
      
      // Only update if artistId is specified or remains unchanged
      const updateData = {...req.body};
      
      // If artistId is being changed to null, use the first artist of the user
      if ('artistId' in updateData && !updateData.artistId) {
        const userArtists = await storage.getArtistsByUserId(req.user!.id);
        if (!userArtists || userArtists.length === 0) {
          return res.status(400).json({ 
            message: "You need to create an artist profile before updating applications",
            code: "ARTIST_REQUIRED"  
          });
        }
        updateData.artistId = userArtists[0].id;
      }
      
      const application = await storage.updateApplication(parseInt(req.params.id), updateData);
      return res.json(application);
    } catch (error: any) {
      console.error("Error updating application:", error);
      return res.status(500).json({ 
        message: "Error updating application", 
        error: error.message 
      });
    }
  });

  // Application export route
  app.post("/api/applications/:id/export", requireAuth, async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      if (isNaN(applicationId)) {
        return res.status(400).json({ error: "Invalid application ID" });
      }
      
      const { format } = req.body;
      if (!format || (format !== "pdf" && format !== "docx")) {
        return res.status(400).json({ error: "Invalid format. Must be 'pdf' or 'docx'" });
      }
      
      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      
      // Check if user has access to this application
      if (application.userId !== req.user!.id && req.user!.role !== 'admin' && req.user!.role !== 'manager') {
        return res.status(403).json({ error: "You don't have permission to export this application" });
      }
      
      // Get related grant and artist data
      const grant = await storage.getGrant(application.grantId);
      const artist = await storage.getArtist(application.artistId);
      
      if (!grant || !artist) {
        return res.status(404).json({ error: "Grant or artist associated with this application not found" });
      }
      
      // Generate document content based on application data
      // Note: In a real implementation, this would use an actual document generation library
      // For this example, we'll generate a simple text file/buffer
      const documentContent = Buffer.from(`
        GrantiFuel Application Export
        ============================
        
        Grant: ${grant.name}
        Organization: ${grant.organization}
        Amount: ${grant.amount || 'Not specified'}
        Deadline: ${grant.deadline.toLocaleDateString()}
        
        Artist: ${artist.name}
        Email: ${artist.email}
        Phone: ${artist.phone || 'Not provided'}
        Career Stage: ${artist.careerStage || 'Not specified'}
        Primary Instrument: ${artist.primaryInstrument || 'Not specified'}
        Location: ${artist.location || 'Not specified'}
        
        Application Status: ${application.status}
        Progress: ${application.progress}%
        Started: ${application.startedAt.toLocaleDateString()}
        ${application.submittedAt ? `Submitted: ${application.submittedAt.toLocaleDateString()}` : ''}
        
        Application Answers:
        ${JSON.stringify(application.answers, null, 2)}
      `);
      
      // Set content type header based on requested format
      if (format === "pdf") {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="application_${applicationId}.pdf"`);
      } else {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="application_${applicationId}.docx"`);
      }
      
      // In a real implementation, we would generate actual PDF or DOCX here
      // For this example, we're just sending the text buffer
      res.send(documentContent);
      
      // Record activity
      await storage.createActivity({
        userId: req.user!.id,
        action: "exported",
        entityType: "application",
        entityId: applicationId,
        details: {
          format,
          grantName: grant.name,
          artistName: artist.name
        }
      });
      
    } catch (error: any) {
      console.error("Error exporting application:", error);
      res.status(500).json({ error: "Error exporting application: " + error.message });
    }
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

  // Templates routes removed - feature considered useless

  // POST and PUT for template operations removed - feature considered useless

  // AI Assistant routes
  const generateProposalSchema = z.object({
    projectDescription: z.string(),
    grantName: z.string().optional(),
    artistName: z.string().optional(),
    proposalType: z.string().optional(),
    userProfile: z.object({
      careerStage: z.string().optional(),
      genre: z.string().optional(),
      instrumentOrRole: z.string().optional()
    }).optional()
  });
  
  // Note: The admin route to reset AI circuit breaker is defined at the top of the file

  app.post("/api/ai/generate-proposal", requireAuth, async (req, res) => {
    try {
      const parsedBody = generateProposalSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.error });
      }
      
      const { projectDescription, grantName, artistName, proposalType, userProfile } = parsedBody.data;
      
      // Get user profile info if available from database as a fallback
      let artistProfile = null;
      if (req.user) {
        try {
          const artists = await storage.getArtistsByUserId(req.user.id);
          if (artists && artists.length > 0) {
            // Format the artist into the expected profile structure
            const artist = artists[0];
            artistProfile = {
              careerStage: artist.careerStage || undefined,
              genre: Array.isArray(artist.genres) && artist.genres.length > 0 ? artist.genres[0] : undefined,
              instrumentOrRole: artist.primaryInstrument || undefined,
              name: artist.name,
              bio: artist.bio || undefined,
              location: artist.location || undefined
            };
          }
        } catch (profileError) {
          console.error("Error fetching artist profile for context:", profileError);
          // Continue without profile info
        }
      }
      
      // Use the user-provided profile from the frontend if available, otherwise use database profile
      const profile = userProfile || artistProfile;
      
      // Cast the profile to ensure we can safely access properties that might not exist
      const typedProfile = profile as { 
        careerStage?: string; 
        genre?: string; 
        instrumentOrRole?: string;
        name?: string;
        bio?: string;
        location?: string;
      } | undefined;
      
      const result = await aiService.generateProposal({
        projectTitle: projectDescription.substring(0, 50) || "Project Proposal",  // Create a title from description
        artistName: artistName || typedProfile?.name || "Artist",
        artistBio: typedProfile?.bio || "Professional musician",     // Use profile bio if available
        artistGenre: typedProfile?.genre || "Music",                 // Use profile genre if available
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

  // Claude Music Proposal endpoint
  app.post("/api/ai/claude-music-proposal", requireAuth, async (req, res) => {
    try {
      // Reuse the same schema since data structure is similar
      const parsedBody = generateProposalSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.error });
      }
      
      const { projectDescription, grantName, artistName, proposalType, userProfile } = parsedBody.data;
      
      // Get user profile info if available from database as a fallback
      let artistProfile = null;
      if (req.user) {
        try {
          const artists = await storage.getArtistsByUserId(req.user.id);
          if (artists && artists.length > 0) {
            // Format the artist into the expected profile structure
            const artist = artists[0];
            artistProfile = {
              careerStage: artist.careerStage || undefined,
              genre: Array.isArray(artist.genres) && artist.genres.length > 0 ? artist.genres[0] : undefined,
              instrumentOrRole: artist.primaryInstrument || undefined,
              name: artist.name,
              bio: artist.bio || undefined,
              location: artist.location || undefined
            };
          }
        } catch (profileError) {
          console.error("Error fetching artist profile for context:", profileError);
          // Continue without profile info
        }
      }
      
      // Use the user-provided profile from the frontend if available, otherwise use database profile
      const profile = userProfile || artistProfile;
      
      // Cast the profile to ensure we can safely access properties that might not exist
      const typedProfile = profile as { 
        careerStage?: string; 
        genre?: string; 
        instrumentOrRole?: string;
        name?: string;
        bio?: string;
        location?: string;
      } | undefined;
      
      // Check for Anthropic API key
      if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(500).json({ error: "Anthropic API key not configured" });
      }

      // Generate proposal using Claude
      const result = await anthropicService.generateMusicProposal({
        projectDescription: projectDescription || "Music project proposal",
        artistName: artistName || typedProfile?.name || "Artist",
        artistBio: typedProfile?.bio || "Professional musician",
        artistGenre: typedProfile?.genre || "Music",
        grantName: grantName || "Arts Grant", 
        grantOrganization: "Arts Foundation",
        grantRequirements: "Music project funding requirements",
        projectTitle: projectDescription.substring(0, 50) || "Project Proposal"
      });
      
      if (!result.success) {
        return res.status(500).json({ error: result.error || "Failed to generate proposal with Claude" });
      }
      
      const proposal = result.data;
      
      // Create an activity to record the Claude proposal generation
      await storage.createActivity({
        userId: req.user!.id,
        action: "GENERATED",
        entityType: "CLAUDE_PROPOSAL",
        details: {
          projectDescription: projectDescription.substring(0, 100),
          grantName,
          artistName,
          model: "claude-3.7-sonnet"
        }
      });
      
      return res.json({ proposal });
    } catch (error) {
      console.error('Error in Claude proposal generation endpoint:', error);
      return res.status(500).json({ error: "Failed to generate proposal with Claude" });
    }
  });

  const answerQuestionSchema = z.object({
    question: z.string(),
    conversationHistory: z.array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string()
      })
    ).optional().default([]),
    userProfile: z.object({
      careerStage: z.string().optional(),
      genre: z.string().optional(),
      instrumentOrRole: z.string().optional()
    }).optional()
  });

  app.post("/api/ai/answer-question", requireAuth, async (req, res) => {
    try {
      // Check if Deepseek API key is configured
      if (!process.env.DEEPSEEK_API_KEY) {
        console.error("[AI Route] No Deepseek API key configured");
        return res.status(503).json({ 
          error: "AI service is currently unavailable. Please contact the administrator to set up the AI integration."
        });
      }
      
      const parsedBody = answerQuestionSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.error });
      }
      
      const { question, conversationHistory, userProfile } = parsedBody.data;
      
      // Get user profile info if available
      let artistProfile = null;
      if (req.user) {
        try {
          const artists = await storage.getArtistsByUserId(req.user.id);
          if (artists && artists.length > 0) {
            // Format the artist into the expected profile structure
            const artist = artists[0];
            artistProfile = {
              careerStage: artist.careerStage || undefined,
              genre: Array.isArray(artist.genres) && artist.genres.length > 0 ? artist.genres[0] : undefined,
              instrumentOrRole: artist.primaryInstrument || undefined,
              name: artist.name,
              bio: artist.bio || undefined,
              location: artist.location || undefined
            };
          }
        } catch (profileError) {
          console.error("Error fetching artist profile for context:", profileError);
          // Continue without profile info
        }
      }
      
      console.log(`[AI Route] Processing question from user ${req.user!.id}: "${question}"`);
      console.log(`[AI Route] Using ${conversationHistory?.length || 0} conversation history messages`);
      
      // Log the userProfile if provided
      if (userProfile) {
        console.log(`[AI Route] Using user-provided profile: genre=${userProfile.genre}, careerStage=${userProfile.careerStage}, instrumentOrRole=${userProfile.instrumentOrRole}`);
      }
      
      const result = await aiService.answerQuestion({
        question,
        // Need to have a defined object or undefined, not null
        artistProfile: userProfile || artistProfile || undefined,
        conversationHistory,
      });
      
      if (!result.success) {
        console.error(`[AI Route] Question answering failed: ${result.error}`);
        return res.status(500).json({ error: result.error || "Failed to answer question" });
      }
      
      const answer = result.data;
      console.log(`[AI Route] Successfully answered question (length: ${answer?.length || 0} chars)`);
      
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
      return res.status(500).json({ 
        error: "Failed to answer question. Please try again or contact support if the issue persists."
      });
    }
  });
  
  // Special endpoint for clearing AI cache for testing purposes
  app.post("/api/ai/clear-cache", requireAuth, async (req, res) => {
    try {
      const result = aiService.clearCache();
      console.log("[AI Route] Cache cleared:", result);
      res.json({ success: true, message: "AI cache cleared successfully" });
    } catch (error) {
      console.error("[AI Route] Error clearing cache:", error);
      res.status(500).json({ error: "Failed to clear AI cache" });
    }
  });
  
  app.post("/api/ai/grant-recommendations", requireAuth, async (req, res) => {
    try {
      // Check if Deepseek API key is configured
      if (!process.env.DEEPSEEK_API_KEY) {
        console.error("[AI Route] No Deepseek API key configured");
        return res.status(503).json({ 
          error: "AI service is currently unavailable. Please contact the administrator to set up the AI integration."
        });
      }
      
      const parsedBody = grantRecommendationProfileSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.error });
      }
      
      const profile = parsedBody.data;
      
      // Add userId to profile for document retrieval
      const profileWithUserId = {
        ...profile,
        userId: req.user!.id
      };
      
      console.log(`[AI Route] Getting grant recommendations for user ${req.user!.id}`);
      console.log(`[AI Route] Profile: genre=${profile.genre}, careerStage=${profile.careerStage}, instrumentOrRole=${profile.instrumentOrRole}`);
      
      // Call the enhanced AI service to get recommendations
      const result = await aiService.getGrantRecommendations(profileWithUserId);
      
      if (!result.success) {
        console.error(`[AI Route] Grant recommendations failed: ${result.error}`);
        return res.status(500).json({ error: result.error || "Failed to generate grant recommendations" });
      }
      
      const recommendations = result.data;
      console.log(`[AI Route] Generated ${recommendations?.length || 0} grant recommendations`);
      
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
      // Check if Deepseek API key is configured
      if (!process.env.DEEPSEEK_API_KEY) {
        console.error("[AI Route] No Deepseek API key configured");
        return res.status(503).json({ 
          error: "AI service is currently unavailable. Please contact the administrator to set up the AI integration."
        });
      }
      
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
      
      console.log(`[AI Route] Analyzing document ID ${documentId} for user ${req.user!.id}`);
      console.log(`[AI Route] Document title: "${document.title}", type: ${document.type}`);
      
      // Get document analysis from AI service
      const result = await aiService.analyzeDocument(documentId);
      
      if (!result.success) {
        console.error(`[AI Route] Document analysis failed: ${result.error}`);
        return res.status(500).json({ error: result.error || "Failed to analyze document" });
      }
      
      console.log(`[AI Route] Successfully analyzed document`);
      
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
      return res.status(500).json({ 
        error: "Failed to analyze document. Please try again or contact support if the issue persists."
      });
    }
  });
  
  // Generate application content using AI
  app.post("/api/ai/generate-application-content", requireAuth, async (req, res) => {
    try {
      // Check if Deepseek API key is configured
      if (!process.env.DEEPSEEK_API_KEY) {
        console.error("[AI Route] No Deepseek API key configured");
        return res.status(503).json({ 
          error: "AI service is currently unavailable. Please contact the administrator to set up the AI integration."
        });
      }
      
      const { 
        grantId, 
        artistId, 
        grantName, 
        grantOrganization, 
        grantRequirements, 
        artistName, 
        artistBio, 
        artistGenre,
        artistAccomplishments,
        projectIdea
      } = req.body;
      
      if (!grantName || !artistName) {
        return res.status(400).json({ error: "Missing required parameters" });
      }
      
      // Get existing grant details if grantId is provided
      let grantDetails = null;
      if (grantId) {
        grantDetails = await storage.getGrant(grantId);
      }
      
      // Get existing artist details if artistId is provided
      let artistDetails = null;
      if (artistId) {
        artistDetails = await storage.getArtist(artistId);
      }
      
      // Get relevant documents if artist ID is provided
      const relevantDocuments: { 
        title: string; 
        content: string; 
        type: string;
      }[] = [];
      
      if (artistId) {
        const userId = artistDetails?.userId;
        if (userId) {
          const userDocs = await storage.getDocumentsByUser(userId);
          // Only include public documents or documents owned by the current user
          const filteredDocs = userDocs.filter(doc => 
            doc.isPublic === true || doc.userId === req.user!.id
          );
          
          // Map to simpler structure
          relevantDocuments.push(...filteredDocs.map(doc => ({
            title: doc.title,
            content: doc.content,
            type: doc.type
          })));
        }
      }
      
      // Combine provided data with existing data
      const combinedParams = {
        grantName: grantName || grantDetails?.name || '',
        grantOrganization: grantOrganization || grantDetails?.organization || '',
        grantRequirements: grantRequirements || (grantDetails?.requirements && Array.isArray(grantDetails.requirements) ? grantDetails.requirements.join(', ') : ''),
        grantAmount: grantDetails?.amount || 'Not specified',
        grantDeadline: grantDetails?.deadline || 'Not specified',
        artistName: artistName || artistDetails?.name || '',
        artistBio: artistBio || artistDetails?.bio || '',
        artistGenre: artistGenre || (artistDetails?.genres && Array.isArray(artistDetails.genres) ? artistDetails.genres.join(', ') : ''),
        artistCareerStage: artistDetails?.careerStage || 'Not specified',
        artistLocation: artistDetails?.location || 'Not specified',
        // Handle accomplishments field - may not exist in schema yet
        artistAccomplishments: artistAccomplishments || '',
        // Use primaryInstrument instead of instrumentOrRole
        artistInstrumentOrRole: artistDetails?.primaryInstrument || 'Musician',
        projectIdea: projectIdea || '',
        relevantDocuments: relevantDocuments.map(doc => ({
          title: doc.title,
          content: doc.content,
          type: doc.type
        }))
      };
      
      console.log(`[AI Route] Generating application content for grant "${combinedParams.grantName}" and artist "${combinedParams.artistName}"`);
      
      // Create system prompt for application content generation
      const systemPrompt = `You are an expert grant writer specializing in helping musicians and artists.
Your task is to generate compelling content for a grant application based on the artist profile and grant details provided.
Focus on creating content that effectively communicates the artist's qualifications and project goals while meeting the requirements of the grant.

Use any provided documents as reference to make the application more specific and personalized.
If specific project ideas are provided, incorporate them into your response while refining and enhancing them.
The content should be tailored to the artist's career stage and genre while addressing the specific requirements of the grant.`;

      // Prepare additional document context if available
      let documentContext = '';
      if (combinedParams.relevantDocuments && combinedParams.relevantDocuments.length > 0) {
        documentContext += '\n\nRelevant Artist Documents:\n';
        combinedParams.relevantDocuments.forEach((doc, index) => {
          documentContext += `\nDocument ${index + 1}: ${doc.title} (${doc.type})\n${doc.content}\n`;
        });
      }

      const userPrompt = `Please generate application content for:

GRANT DETAILS:
- Name: ${combinedParams.grantName}
- Organization: ${combinedParams.grantOrganization}
- Requirements: ${combinedParams.grantRequirements}
- Amount: ${combinedParams.grantAmount}
- Deadline: ${combinedParams.grantDeadline}

ARTIST DETAILS:
- Name: ${combinedParams.artistName}
- Bio: ${combinedParams.artistBio}
- Genre: ${combinedParams.artistGenre}
- Career Stage: ${combinedParams.artistCareerStage}
- Location: ${combinedParams.artistLocation}
- Instrument/Role: ${combinedParams.artistInstrumentOrRole}
${combinedParams.artistAccomplishments ? '- Accomplishments:\n- ' + combinedParams.artistAccomplishments : ''}
${combinedParams.projectIdea ? '\nProject Idea From Artist:\n' + combinedParams.projectIdea : ''}
${documentContext}

Generate the following sections:
1. Project Title (short, memorable, and relevant to the artist's work)
2. Project Description (detailed explanation of what the project entails)
3. Artist Goals (what the artist hopes to achieve personally and professionally)
4. Project Impact (how this project will impact the artist's community or field)
5. Project Timeline (suggested milestones and timeline for the project)
6. Budget Outline (suggested budget categories with approximate allocations)

Return your response in this JSON format:
{
  "projectTitle": "Your generated title",
  "projectDescription": "Your detailed project description...",
  "artistGoals": "The artist's goals for this project...",
  "projectImpact": "The impact of this project...",
  "projectTimeline": "The suggested timeline for the project...",
  "budgetOutline": "The suggested budget breakdown..."
}`;

      console.log(`[AI Route] Generating application content with enhanced prompt`);
      
      // Use AIService instead of direct API call for better error handling and circuit breaking
      const result = await aiService.generateApplicationContent({
        artistProfile: {
          name: combinedParams.artistName,
          bio: combinedParams.artistBio,
          genre: combinedParams.artistGenre,
          careerStage: combinedParams.artistCareerStage,
          location: combinedParams.artistLocation,
          accomplishments: combinedParams.artistAccomplishments
        },
        grantDetails: {
          name: combinedParams.grantName,
          organization: combinedParams.grantOrganization,
          requirements: combinedParams.grantRequirements,
          amount: combinedParams.grantAmount,
          deadline: combinedParams.grantDeadline.toString() // Ensure deadline is a string
        },
        systemPrompt,
        userPrompt
      });
      
      if (!result.success) {
        console.error(`[AI Route] Application content generation failed: ${result.error}`);
        return res.status(500).json({ error: result.error || "Failed to generate application content" });
      }
      
      console.log(`[AI Route] Successfully generated application content`);
        
      // Create activity record for using AI to generate application content
      await storage.createActivity({
        userId: req.user!.id,
        action: "GENERATED",
        entityType: "APPLICATION_CONTENT",
        details: { 
          grantName: combinedParams.grantName,
          artistName: combinedParams.artistName,
          projectTitle: result.data?.projectTitle || 'Unknown project'
        }
      });
      
      return res.json({ content: result.data });
    } catch (error) {
      console.error('Error in generate application content endpoint:', error);
      return res.status(500).json({ error: "Failed to generate application content. Please try again later." });
    }
  });

  // Get required profile fields from AI analysis of documents
  app.get("/api/ai/profile-requirements", requireAuth, async (req, res) => {
    try {
      // Check if Deepseek API key is configured
      if (!process.env.DEEPSEEK_API_KEY) {
        console.error("[AI Route] No Deepseek API key configured");
        return res.status(503).json({ 
          error: "AI service is currently unavailable. Please contact the administrator to set up the AI integration."
        });
      }
      
      console.log(`[AI Route] Getting profile requirements for user ${req.user!.id}`);
      
      // First import the background processor
      const { backgroundProcessor } = require('./services/background-processor');
      
      try {
        // Get profile requirements from the background processor
        const profileRequirements = await backgroundProcessor.getProfileRequirements();
        
        console.log(`[AI Route] Successfully retrieved ${profileRequirements?.length || 0} profile requirements`);
        
        return res.json({ profileRequirements });
      } catch (bgpError) {
        console.warn(`[AI Route] Background processor error, falling back to direct API call: ${bgpError}`);
        
        // Fallback to direct AI service call if background processor fails
        const result = await aiService.getRequiredProfileFields();
        
        if (!result.success) {
          console.error(`[AI Route] Profile requirements failed: ${result.error}`);
          return res.status(500).json({ error: result.error || "Failed to get profile requirements" });
        }
        
        console.log(`[AI Route] Successfully retrieved ${result.data?.length || 0} profile requirements`);
        
        return res.json({ profileRequirements: result.data });
      }
    } catch (error) {
      console.error("Error getting profile requirements:", error);
      return res.status(500).json({ 
        error: "Failed to get profile requirements. Please try again or contact support if the issue persists."
      });
    }
  });

  // Onboarding routes - support both path formats for backward compatibility
  app.get("/api/user/onboarding", requireAuth, async (req, res) => {
    try {
      const tasks = await storage.getUserOnboardingTasks(req.user!.id);
      return res.json(tasks);
    } catch (error) {
      console.error("Error getting onboarding tasks:", error);
      return res.status(500).json({ message: "Error getting onboarding tasks" });
    }
  });

  // Keep the old endpoint for backward compatibility
  app.get("/api/onboarding", requireAuth, async (req, res) => {
    try {
      const tasks = await storage.getUserOnboardingTasks(req.user!.id);
      return res.json(tasks);
    } catch (error) {
      console.error("Error getting onboarding tasks:", error);
      return res.status(500).json({ message: "Error getting onboarding tasks" });
    }
  });

  app.post("/api/user/onboarding/complete", requireAuth, async (req, res) => {
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
  
  // Keep the old endpoint for backward compatibility
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
  
  // User onboarding progress endpoint is already defined above

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
  
  // Admin route to clear AI cache
  app.post("/api/admin/ai/clear-cache", requireAdmin, async (req, res) => {
    try {
      console.log(`[Admin] AI cache clear requested by user ${req.user!.id}`);
      
      // Clear both AI service caches
      const clearResult = aiService.clearCache();
      
      // Also clear Anthropic service cache if it's available
      let anthropicResult = { status: 'skipped', message: 'Anthropic service not available' };
      if (process.env.ANTHROPIC_API_KEY) {
        anthropicService.clearCache();
        anthropicResult = { status: 'success', message: 'Anthropic cache cleared' };
      }
      
      // Log the activity
      await storage.createActivity({
        userId: req.user!.id,
        action: "ADMIN",
        entityType: "AI_CACHE",
        details: {
          deepseek: {
            status: clearResult.status,
            message: clearResult.message
          },
          anthropic: anthropicResult,
          timestamp: new Date().toISOString()
        }
      });
      
      return res.json({
        status: 'success',
        message: 'AI caches cleared successfully',
        details: {
          deepseek: clearResult,
          anthropic: anthropicResult
        }
      });
    } catch (error: any) {
      console.error('Error clearing AI cache:', error);
      return res.status(500).json({ 
        status: 'error',
        message: error.message || "Failed to clear AI cache"
      });
    }
  });
  
  // Background processor queue management routes for admin
  app.post("/api/admin/background/queue-documents", requireAdmin, async (req, res) => {
    try {
      console.log(`[Admin] Document queue processing requested by user ${req.user!.id}`);
      
      // First import the background processor
      const { backgroundProcessor } = require('./services/background-processor');
      
      // Queue all unprocessed documents
      const result = await backgroundProcessor.queueAllDocuments();
      
      // Log the activity
      await storage.createActivity({
        userId: req.user!.id,
        action: "ADMIN",
        entityType: "BACKGROUND_PROCESSOR",
        details: {
          action: "queue_documents",
          count: result.queued,
          timestamp: new Date().toISOString()
        }
      });
      
      // Return the result
      return res.json({
        status: 'success',
        message: `Successfully queued ${result.queued} documents for processing`,
        queued: result.queued
      });
    } catch (error: any) {
      console.error('[Admin] Error queueing documents for processing:', error);
      return res.status(500).json({ 
        status: 'error',
        message: error.message || "Failed to queue documents for processing"
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
