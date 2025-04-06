/**
 * AI Routes
 * 
 * Routes for AI-powered functionality using DeepSeek AI
 */

import { Router } from 'express';
import { deepseekService } from '../services/deepseek-service';
import { storage } from '../storage';
import { requireRole, requireAdmin } from '../middleware/role-check';

// Helper constants
const requireAuth = requireRole([]);

const router = Router();

/**
 * Get grant recommendations based on artist profile
 */
router.post('/grant-recommendations', requireAuth, async (req, res) => {
  try {
    const { artistId, ...artistProfile } = req.body;
    
    // Add the user ID to the profile for potential personalization
    const profileWithUserId = {
      ...artistProfile,
      userId: req.user!.id
    };
    
    // Get recommendations from DeepSeek
    const result = await deepseekService.getGrantRecommendations(profileWithUserId);
    
    if (!result.success) {
      console.error('[AI Route] Error getting grant recommendations:', result.error);
      return res.status(500).json({ error: result.error?.message || 'Failed to get grant recommendations' });
    }
    
    // If successful, store the recommendations in the database for this user
    const userId = req.user!.id;
    
    try {
      // Store recommendations in the database with user ID and artist ID if provided
      await storage.createOrUpdateGrantRecommendations({
        userId,
        artistId: artistId || null,
        recommendations: JSON.stringify(result.data),
      });
      
      console.log(`[AI Route] Stored grant recommendations for user ${userId}`);
    } catch (storageError) {
      console.error('[AI Route] Error storing grant recommendations:', storageError);
      // Continue even if storage fails, we can still return the recommendations
    }
    
    // Return the recommendations
    return res.json({ recommendations: result.data });
  } catch (error: any) {
    console.error('Error getting grant recommendations:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to get grant recommendations'
    });
  }
});

/**
 * Generate content using the DeepSeek API
 */
router.post('/generate-content', requireAuth, async (req, res) => {
  try {
    const { prompt, systemPrompt, temperature, max_tokens } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }
    
    const result = await deepseekService.generateContent({
      prompt,
      systemPrompt,
      temperature,
      max_tokens
    });
    
    if (!result.success) {
      console.error('[AI Route] Error generating content:', result.error);
      return res.status(500).json({ error: result.error?.message || 'Failed to generate content' });
    }
    
    return res.json({ content: result.data });
  } catch (error: any) {
    console.error('Error generating content:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to generate content'
    });
  }
});

/**
 * Get profile feedback to help artists improve their profiles
 */
router.post('/profile-feedback', requireAuth, async (req, res) => {
  try {
    const { artistProfile } = req.body;
    
    if (!artistProfile) {
      return res.status(400).json({ error: "Artist profile is required" });
    }
    
    const result = await deepseekService.getProfileFeedback({ artistProfile });
    
    if (!result.success) {
      console.error('[AI Route] Error getting profile feedback:', result.error);
      return res.status(500).json({ error: result.error?.message || 'Failed to get profile feedback' });
    }
    
    return res.json(result.data);
  } catch (error: any) {
    console.error('Error getting profile feedback:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to get profile feedback'
    });
  }
});

/**
 * Get AI service health status
 */
router.get('/service-status', requireAuth, async (req, res) => {
  try {
    const status = deepseekService.getHealthStatus();
    
    // Add helpful note about the service
    const responseWithNote = {
      ...status,
      note: "DeepSeek AI is the primary AI provider for this application"
    };
    
    res.json(responseWithNote);
  } catch (error: any) {
    console.error('[AI Route] Error getting DeepSeek AI service status:', error);
    res.status(500).json({
      error: "Failed to get DeepSeek AI service status"
    });
  }
});

/**
 * Admin route to reset circuit breaker
 */
router.post('/admin/reset-circuit-breaker', requireAuth, requireAdmin, async (req, res) => {
  try {
    console.log(`[Admin] Circuit breaker reset requested by user ${req.user!.id}`);
    
    // Call the reset method
    const resetResult = deepseekService.resetCircuitBreaker();
    
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

/**
 * Admin route to clear AI cache
 */
router.post('/admin/clear-cache', requireAuth, requireAdmin, async (req, res) => {
  try {
    console.log(`[Admin] AI cache clear requested by user ${req.user!.id}`);
    
    // Clear the cache
    deepseekService.clearCache();
    
    // Log the activity
    await storage.createActivity({
      userId: req.user!.id,
      action: 'ai_cache_clear',
      entityType: 'admin_action',
      details: {
        timestamp: new Date().toISOString(),
        service: 'deepseek'
      }
    });
    
    return res.json({
      status: 'success',
      message: 'DeepSeek AI cache has been cleared'
    });
  } catch (error: any) {
    console.error('Error clearing AI cache:', error);
    return res.status(500).json({ 
      status: 'error',
      message: error.message || "Failed to clear AI cache"
    });
  }
});

/**
 * User route to clear their own AI cache
 */
router.post('/clear-my-cache', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    console.log(`[AI Route] User ${userId} requested to clear their AI cache`);
    
    // Clear the user's recommendations from the database
    await storage.clearUserAICache(userId);
    
    // Log the activity
    await storage.createActivity({
      userId,
      action: 'ai_cache_clear',
      entityType: 'user_action',
      details: {
        timestamp: new Date().toISOString(),
        context: "grant_recommendations" 
      }
    });
    
    return res.json({
      status: 'success',
      message: 'Your AI recommendation cache has been cleared',
    });
  } catch (error: any) {
    console.error('Error clearing user AI cache:', error);
    return res.status(500).json({ 
      status: 'error',
      message: error.message || "Failed to clear AI cache"
    });
  }
});

export default router;