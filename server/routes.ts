import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateProposal, answerQuestion } from "./services/ai";
import { z } from "zod";
import { setupAuth } from "./auth";
import Stripe from "stripe";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Initialize Stripe with secret key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
      const { planId, paymentMethodId } = req.body;
      if (!planId || !paymentMethodId) {
        return res.status(400).json({ error: "Missing required fields" });
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
          payment_method: paymentMethodId,
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
          metadata: {
            userId: user.id.toString()
          }
        });
        
        customerId = customer.id;
        await storage.updateStripeCustomerId(user.id, customerId);
      } else {
        // Update the customer's payment method
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId,
        });
        
        await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
      }
      
      // Create the subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            price: plan.stripePriceId, // This should be added when you set up plans in Stripe
            quantity: 1,
          },
        ],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });
      
      // Save subscription to database
      await storage.createSubscription({
        userId: user.id,
        planId: plan.id,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      });
      
      // Return the client secret for the payment intent
      const invoice = subscription.latest_invoice as any;
      const clientSecret = invoice?.payment_intent?.client_secret;
      
      return res.json({
        subscriptionId: subscription.id,
        clientSecret: clientSecret,
      });
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      return res.status(500).json({ error: error.message || "Failed to create subscription" });
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
        status: 'canceled',
        canceledAt: new Date()
      });
      
      return res.json({ message: "Subscription canceled successfully" });
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      return res.status(500).json({ error: error.message || "Failed to cancel subscription" });
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
            await storage.updateSubscription(userSubscription.id, {
              status: 'canceled',
              canceledAt: new Date()
            });
          }
        }
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
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
      const users = await db.select().from(usersTable).where(eq(usersTable.stripeCustomerId, customerId));
      if (users.length > 0) {
        return users[0].id;
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
