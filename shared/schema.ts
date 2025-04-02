import { pgTable, text, serial, integer, boolean, timestamp, json, varchar, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Define enums
const userRole = pgEnum('user_role', ['admin', 'grant_writer', 'manager', 'artist']);
const planTier = pgEnum('plan_tier', ['free', 'basic', 'premium']);
const documentType = pgEnum('document_type', ['grant_info', 'artist_guide', 'application_tips', 'admin_knowledge', 'user_upload']);
const fileType = pgEnum('file_type', ['none', 'pdf', 'docx', 'txt']);
const onboardingTask = pgEnum('onboarding_task', [
  'profile_completed', 
  'first_grant_viewed', 
  'first_artist_created',
  'first_application_started',
  'ai_assistant_used', 
  'first_document_uploaded',
  'first_template_saved',
  'first_application_completed',
  'profile_picture_added',
  'notification_settings_updated'
]);

// Define tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  avatar: text("avatar"),
  bio: text("bio"),
  role: userRole("role").default("artist").notNull(),
  verified: boolean("verified").default(false).notNull(),
  verificationToken: text("verification_token"),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpires: timestamp("reset_password_expires"),
  lastLogin: timestamp("last_login"),
  active: boolean("active").default(true).notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const grants = pgTable("grants", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  organization: text("organization").notNull(),
  amount: text("amount"),
  deadline: timestamp("deadline").notNull(),
  description: text("description"),
  requirements: text("requirements"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const artists = pgTable("artists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  bio: text("bio"),
  genres: text("genres").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  grantId: integer("grant_id").notNull(),
  artistId: integer("artist_id").notNull(),
  status: text("status").notNull().default("draft"),
  progress: integer("progress").notNull().default(0),
  answers: json("answers"),
  submittedAt: timestamp("submitted_at"),
  startedAt: timestamp("started_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id"),
  details: json("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  content: text("content").notNull(),
  type: text("type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const documents = pgTable("knowledge_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: documentType("type").notNull(),
  tags: text("tags").array(),
  isPublic: boolean("is_public").default(false).notNull(),
  isApproved: boolean("is_approved").default(false).notNull(),
  // File upload fields
  fileName: text("file_name"),
  fileType: fileType("file_type").default('none'),
  fileUrl: text("file_url"),
  fileSize: integer("file_size"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  tier: planTier("tier").notNull(),
  price: integer("price").notNull(), // stored in cents
  description: text("description").notNull(),
  maxApplications: integer("max_applications").notNull(),
  maxArtists: integer("max_artists").notNull(),
  features: text("features").array(),
  stripePriceId: text("stripe_price_id"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userOnboarding = pgTable("user_onboarding", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  task: onboardingTask("task").notNull(),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
  data: json("data"),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  planId: integer("plan_id").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status").notNull().default("active"),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  canceledAt: timestamp("canceled_at"),
});

// Define relations
export const grantsRelations = relations(grants, ({ many, one }) => ({
  applications: many(applications),
  user: one(users, {
    fields: [grants.userId],
    references: [users.id],
  }),
}));

export const artistsRelations = relations(artists, ({ many, one }) => ({
  applications: many(applications),
  user: one(users, {
    fields: [artists.userId],
    references: [users.id],
  }),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  grant: one(grants, {
    fields: [applications.grantId],
    references: [grants.id],
  }),
  artist: one(artists, {
    fields: [applications.artistId],
    references: [artists.id],
  }),
  user: one(users, {
    fields: [applications.userId],
    references: [users.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

export const templatesRelations = relations(templates, ({ one }) => ({
  user: one(users, {
    fields: [templates.userId],
    references: [users.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
}));

export const userOnboardingRelations = relations(userOnboarding, ({ one }) => ({
  user: one(users, {
    fields: [userOnboarding.userId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [subscriptions.planId],
    references: [subscriptionPlans.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  activities: many(activities),
  artists: many(artists),
  grants: many(grants),
  templates: many(templates),
  subscriptions: many(subscriptions),
  documents: many(documents),
  onboardingTasks: many(userOnboarding),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  lastLogin: true,
  verificationToken: true,
  resetPasswordToken: true,
  resetPasswordExpires: true,
  verified: true,
  active: true
});

// For registration, we use a subset of user fields
export const registerSchema = insertUserSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  role: z.enum(['grant_writer', 'manager', 'artist']).default('artist'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const insertGrantSchema = createInsertSchema(grants).omit({ id: true, createdAt: true });
export const insertArtistSchema = createInsertSchema(artists).omit({ id: true, createdAt: true });
export const insertApplicationSchema = createInsertSchema(applications).omit({ id: true, startedAt: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true });
export const insertTemplateSchema = createInsertSchema(templates).omit({ id: true, createdAt: true });
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({ id: true, createdAt: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true, canceledAt: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserOnboardingSchema = createInsertSchema(userOnboarding).omit({ id: true, completedAt: true });

// Additional validation schemas for API requests
export const generateProposalSchema = z.object({
  projectDescription: z.string().min(1, "Project description is required"),
  grantName: z.string().optional(),
  artistName: z.string().optional(),
  proposalType: z.string().optional(),
});

export const answerQuestionSchema = z.object({
  question: z.string().min(1, "Question is required"),
  conversationHistory: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ).optional().default([]),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertGrant = z.infer<typeof insertGrantSchema>;
export type InsertArtist = z.infer<typeof insertArtistSchema>;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertUserOnboarding = z.infer<typeof insertUserOnboardingSchema>;

export type User = typeof users.$inferSelect;
export type Grant = typeof grants.$inferSelect;
export type Artist = typeof artists.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type UserOnboarding = typeof userOnboarding.$inferSelect;

// Export enums
export const userRoleEnum = userRole;
export const planTierEnum = planTier;
export const documentTypeEnum = documentType;
export const fileTypeEnum = fileType;
export const onboardingTaskEnum = onboardingTask;
