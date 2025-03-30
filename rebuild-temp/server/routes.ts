import { Express, Request, Response, NextFunction } from 'express';
import { createServer, Server } from 'http';
import { storage } from './storage';
import { aiService } from './services/ai';
import { paymentService } from './services/payment';
import { upload, getFileUrl, deleteFile } from './services/upload';
import { setupAuth } from './services/auth';
import path from 'path';
import {
  answerQuestionSchema,
  generateProposalSchema,
  insertArtistSchema,
  insertApplicationSchema,
  insertTemplateSchema,
  insertDocumentSchema,
} from '@shared/schema';
import { logger } from './middleware/logger';
import { ZodError } from 'zod';

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app, storage);
  
  // Middleware to require authentication
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    next();
  };
  
  // Error handling middleware
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('API Error:', err);
    
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: err.errors,
      });
    }
    
    if (err.name === 'AIError' && 'statusCode' in err) {
      return res.status((err as any).statusCode).json({
        message: err.message,
      });
    }
    
    res.status(500).json({
      message: 'Internal server error',
    });
  });
  
  // Health check route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  
  // User profile routes
  app.get('/api/profile', requireAuth, async (req, res) => {
    res.json(req.user);
  });
  
  // Grant routes
  app.get('/api/grants', async (req, res, next) => {
    try {
      const grants = await storage.getAllGrants();
      res.json(grants);
    } catch (error) {
      next(error);
    }
  });
  
  app.get('/api/grants/:id', async (req, res, next) => {
    try {
      const grant = await storage.getGrant(parseInt(req.params.id));
      if (!grant) {
        return res.status(404).json({ message: 'Grant not found' });
      }
      res.json(grant);
    } catch (error) {
      next(error);
    }
  });
  
  // Artist routes
  app.get('/api/artists', requireAuth, async (req, res, next) => {
    try {
      const artists = await storage.getArtistsByUser(req.user.id);
      res.json(artists);
    } catch (error) {
      next(error);
    }
  });
  
  app.get('/api/artists/:id', requireAuth, async (req, res, next) => {
    try {
      const artist = await storage.getArtist(parseInt(req.params.id));
      if (!artist) {
        return res.status(404).json({ message: 'Artist not found' });
      }
      
      // Verify ownership
      if (artist.userId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json(artist);
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/api/artists', requireAuth, async (req, res, next) => {
    try {
      const artistData = insertArtistSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      
      const artist = await storage.createArtist(artistData);
      
      // Log activity
      await storage.createActivity({
        userId: req.user.id,
        action: 'create',
        entityType: 'artist',
        entityId: artist.id,
        details: { name: artist.name },
      });
      
      // Complete onboarding task if applicable
      await storage.completeOnboardingTask(req.user.id, 'first_artist_created');
      
      res.status(201).json(artist);
    } catch (error) {
      next(error);
    }
  });
  
  // Application routes
  app.get('/api/applications', requireAuth, async (req, res, next) => {
    try {
      const applications = await storage.getApplicationsByUser(req.user.id);
      res.json(applications);
    } catch (error) {
      next(error);
    }
  });
  
  app.get('/api/applications/:id', requireAuth, async (req, res, next) => {
    try {
      const application = await storage.getApplication(parseInt(req.params.id));
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }
      
      // Verify ownership
      if (application.userId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json(application);
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/api/applications', requireAuth, async (req, res, next) => {
    try {
      const applicationData = insertApplicationSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      
      // Verify artist ownership
      const artist = await storage.getArtist(applicationData.artistId);
      if (!artist || artist.userId !== req.user.id) {
        return res.status(403).json({ message: 'You do not have permission to use this artist' });
      }
      
      const application = await storage.createApplication(applicationData);
      
      // Log activity
      await storage.createActivity({
        userId: req.user.id,
        action: 'create',
        entityType: 'application',
        entityId: application.id,
        details: { grantId: application.grantId, status: application.status },
      });
      
      // Complete onboarding task if applicable
      await storage.completeOnboardingTask(req.user.id, 'first_application_started');
      
      res.status(201).json(application);
    } catch (error) {
      next(error);
    }
  });
  
  app.patch('/api/applications/:id', requireAuth, async (req, res, next) => {
    try {
      const applicationId = parseInt(req.params.id);
      const application = await storage.getApplication(applicationId);
      
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }
      
      // Verify ownership
      if (application.userId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const updatedApplication = await storage.updateApplication(applicationId, req.body);
      
      // If application is now submitted, log activity and complete onboarding
      if (req.body.status === 'submitted' && application.status !== 'submitted') {
        // Log activity
        await storage.createActivity({
          userId: req.user.id,
          action: 'submit',
          entityType: 'application',
          entityId: application.id,
          details: { grantId: application.grantId },
        });
        
        // Complete onboarding task if applicable
        await storage.completeOnboardingTask(req.user.id, 'first_application_completed');
      }
      
      res.json(updatedApplication);
    } catch (error) {
      next(error);
    }
  });
  
  // Template routes
  app.get('/api/templates', requireAuth, async (req, res, next) => {
    try {
      const templates = await storage.getTemplatesByUser(req.user.id);
      res.json(templates);
    } catch (error) {
      next(error);
    }
  });
  
  app.get('/api/templates/:id', requireAuth, async (req, res, next) => {
    try {
      const template = await storage.getTemplate(parseInt(req.params.id));
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }
      
      // Verify ownership
      if (template.userId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json(template);
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/api/templates', requireAuth, async (req, res, next) => {
    try {
      const templateData = insertTemplateSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      
      const template = await storage.createTemplate(templateData);
      
      // Log activity
      await storage.createActivity({
        userId: req.user.id,
        action: 'create',
        entityType: 'template',
        entityId: template.id,
        details: { name: template.name, type: template.type },
      });
      
      // Complete onboarding task if applicable
      await storage.completeOnboardingTask(req.user.id, 'first_template_saved');
      
      res.status(201).json(template);
    } catch (error) {
      next(error);
    }
  });
  
  app.patch('/api/templates/:id', requireAuth, async (req, res, next) => {
    try {
      const templateId = parseInt(req.params.id);
      const template = await storage.getTemplate(templateId);
      
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }
      
      // Verify ownership
      if (template.userId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const updatedTemplate = await storage.updateTemplate(templateId, req.body);
      res.json(updatedTemplate);
    } catch (error) {
      next(error);
    }
  });
  
  // Document routes
  app.get('/api/documents', requireAuth, async (req, res, next) => {
    try {
      const documents = await storage.getDocumentsByUser(req.user.id);
      res.json(documents);
    } catch (error) {
      next(error);
    }
  });
  
  app.get('/api/documents/public', async (req, res, next) => {
    try {
      const documents = await storage.getApprovedDocuments();
      res.json(documents);
    } catch (error) {
      next(error);
    }
  });
  
  app.get('/api/documents/:id', requireAuth, async (req, res, next) => {
    try {
      const document = await storage.getDocument(parseInt(req.params.id));
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      // Verify access (public or owned)
      if (!document.isPublic && document.userId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json(document);
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/api/documents', requireAuth, upload.single('file'), async (req, res, next) => {
    try {
      const file = req.file;
      let fileData = {};
      
      if (file) {
        fileData = {
          fileName: file.filename,
          fileType: path.extname(file.originalname).substring(1),
          fileUrl: getFileUrl(file.filename),
          fileSize: file.size,
        };
      }
      
      const documentData = insertDocumentSchema.parse({
        ...req.body,
        ...fileData,
        userId: req.user.id,
        tags: req.body.tags ? JSON.parse(req.body.tags) : [],
      });
      
      const document = await storage.createDocument(documentData);
      
      // Log activity
      await storage.createActivity({
        userId: req.user.id,
        action: 'create',
        entityType: 'document',
        entityId: document.id,
        details: { title: document.title, type: document.type },
      });
      
      // Complete onboarding task if applicable
      await storage.completeOnboardingTask(req.user.id, 'first_document_uploaded');
      
      res.status(201).json(document);
    } catch (error) {
      next(error);
    }
  });
  
  app.patch('/api/documents/:id', requireAuth, upload.single('file'), async (req, res, next) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      // Verify ownership
      if (document.userId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const file = req.file;
      let fileData = {};
      
      // If new file uploaded, delete old file and update
      if (file) {
        // Delete previous file if exists
        if (document.fileName) {
          const filePath = path.join(process.cwd(), 'uploads', document.fileName);
          await deleteFile(filePath);
        }
        
        fileData = {
          fileName: file.filename,
          fileType: path.extname(file.originalname).substring(1),
          fileUrl: getFileUrl(file.filename),
          fileSize: file.size,
        };
      }
      
      const updatedData = {
        ...req.body,
        ...fileData,
        tags: req.body.tags ? JSON.parse(req.body.tags) : undefined,
      };
      
      const updatedDocument = await storage.updateDocument(documentId, updatedData);
      res.json(updatedDocument);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete('/api/documents/:id', requireAuth, async (req, res, next) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      // Verify ownership
      if (document.userId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Delete file if exists
      if (document.fileName) {
        const filePath = path.join(process.cwd(), 'uploads', document.fileName);
        await deleteFile(filePath);
      }
      
      await storage.deleteDocument(documentId);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  
  // AI routes
  app.post('/api/ai/generate-proposal', requireAuth, async (req, res, next) => {
    try {
      const data = generateProposalSchema.parse(req.body);
      
      // Complete onboarding task if applicable
      await storage.completeOnboardingTask(req.user.id, 'ai_assistant_used');
      
      const proposal = await aiService.generateProposal(
        data.projectDescription, 
        data.grantName, 
        data.artistName
      );
      
      res.json({ proposal });
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/api/ai/answer-question', requireAuth, async (req, res, next) => {
    try {
      const data = answerQuestionSchema.parse(req.body);
      
      // Complete onboarding task if applicable
      await storage.completeOnboardingTask(req.user.id, 'ai_assistant_used');
      
      const answer = await aiService.answerQuestion(
        data.question, 
        data.conversationHistory
      );
      
      res.json({ answer });
    } catch (error) {
      next(error);
    }
  });
  
  // Onboarding routes
  app.get('/api/onboarding', requireAuth, async (req, res, next) => {
    try {
      const tasks = await storage.getUserOnboardingTasks(req.user.id);
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/api/onboarding/:task', requireAuth, async (req, res, next) => {
    try {
      const task = req.params.task;
      const data = req.body.data;
      
      const completedTask = await storage.completeOnboardingTask(req.user.id, task, data);
      res.status(201).json(completedTask);
    } catch (error) {
      next(error);
    }
  });
  
  // Subscription plan routes
  app.get('/api/subscription-plans', async (req, res, next) => {
    try {
      const plans = await storage.getAllSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      next(error);
    }
  });
  
  // User subscription routes
  app.get('/api/subscription', requireAuth, async (req, res, next) => {
    try {
      const subscription = await storage.getUserSubscription(req.user.id);
      
      if (!subscription) {
        return res.status(404).json({ message: 'No active subscription found' });
      }
      
      // If subscription exists in Stripe, get latest status
      if (subscription.stripeSubscriptionId && paymentService.isConfigured()) {
        try {
          const stripeSubscription = await paymentService.retrieveSubscription(
            subscription.stripeSubscriptionId
          );
          
          // Update subscription status if needed
          if (stripeSubscription.status !== subscription.status) {
            await storage.updateSubscription(subscription.id, {
              status: stripeSubscription.status,
            });
            
            subscription.status = stripeSubscription.status;
          }
        } catch (stripeError) {
          logger.error('Error retrieving Stripe subscription:', stripeError);
          // Continue with the database subscription data
        }
      }
      
      res.json(subscription);
    } catch (error) {
      next(error);
    }
  });
  
  // Payment routes
  app.post('/api/create-payment-intent', requireAuth, async (req, res, next) => {
    try {
      if (!paymentService.isConfigured()) {
        return res.status(503).json({ message: 'Payment service is not available' });
      }
      
      const { amount } = req.body;
      
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: 'Valid amount is required' });
      }
      
      const paymentIntent = await paymentService.createPaymentIntent(
        amount,
        'usd',
        req.user.stripeCustomerId
      );
      
      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/api/create-subscription', requireAuth, async (req, res, next) => {
    try {
      if (!paymentService.isConfigured()) {
        return res.status(503).json({ message: 'Payment service is not available' });
      }
      
      const { planId } = req.body;
      
      if (!planId) {
        return res.status(400).json({ message: 'Plan ID is required' });
      }
      
      // Get the subscription plan
      const plan = await storage.getSubscriptionPlan(planId);
      
      if (!plan || !plan.active) {
        return res.status(404).json({ message: 'Subscription plan not found or inactive' });
      }
      
      if (!plan.stripePriceId) {
        return res.status(400).json({ message: 'Plan is not configured for payment' });
      }
      
      // Check if user already has a Stripe customer ID
      let customerId = req.user.stripeCustomerId;
      
      if (!customerId) {
        // Create a customer in Stripe
        const customer = await paymentService.createCustomer(
          req.user.email,
          req.user.name,
          { userId: req.user.id.toString() }
        );
        
        customerId = customer.id;
        
        // Update user with Stripe customer ID
        await storage.updateStripeCustomerId(req.user.id, customerId);
      }
      
      // Create a subscription
      const subscription = await paymentService.createSubscription(
        customerId,
        plan.stripePriceId,
        { userId: req.user.id.toString(), planId: planId.toString() }
      );
      
      // Save subscription to database
      await storage.createSubscription({
        userId: req.user.id,
        planId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      });
      
      // Return the client secret for payment completion
      const clientSecret = (subscription.latest_invoice as any)?.payment_intent?.client_secret;
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret,
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/api/cancel-subscription', requireAuth, async (req, res, next) => {
    try {
      if (!paymentService.isConfigured()) {
        return res.status(503).json({ message: 'Payment service is not available' });
      }
      
      // Get user's active subscription
      const subscription = await storage.getUserSubscription(req.user.id);
      
      if (!subscription) {
        return res.status(404).json({ message: 'No active subscription found' });
      }
      
      if (!subscription.stripeSubscriptionId) {
        return res.status(400).json({ message: 'Subscription is not linked to a payment provider' });
      }
      
      // Cancel subscription with Stripe
      await paymentService.cancelSubscription(subscription.stripeSubscriptionId);
      
      // Update subscription in database
      await storage.updateSubscription(subscription.id, {
        status: 'canceled',
        canceledAt: new Date(),
      });
      
      res.json({ message: 'Subscription canceled successfully' });
    } catch (error) {
      next(error);
    }
  });
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}