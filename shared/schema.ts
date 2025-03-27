import { pgTable, text, serial, integer, boolean, timestamp, json, varchar, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  avatar: text("avatar"),
  bio: text("bio"),
  role: text("role").default("user").notNull(),
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

export const usersRelations = relations(users, ({ many }) => ({
  activities: many(activities),
  artists: many(artists),
  templates: many(templates),
  subscriptions: many(subscriptions),
}));

export const grants = pgTable("grants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  organization: text("organization").notNull(),
  amount: text("amount"),
  deadline: timestamp("deadline").notNull(),
  description: text("description"),
  requirements: text("requirements"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const grantsRelations = relations(grants, ({ many }) => ({
  applications: many(applications),
}));

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

export const artistsRelations = relations(artists, ({ many, one }) => ({
  applications: many(applications),
  user: one(users, {
    fields: [artists.userId],
    references: [users.id],
  }),
}));

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

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id"),
  details: json("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  content: text("content").notNull(),
  type: text("type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const templatesRelations = relations(templates, ({ one }) => ({
  user: one(users, {
    fields: [templates.userId],
    references: [users.id],
  }),
}));

// Subscription Plan Tiers
export const planTierEnum = pgEnum('plan_tier', ['free', 'basic', 'premium']);

export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  tier: planTierEnum("tier").notNull(),
  price: integer("price").notNull(), // stored in cents
  description: text("description").notNull(),
  maxApplications: integer("max_applications").notNull(),
  maxArtists: integer("max_artists").notNull(),
  features: text("features").array(),
  stripePriceId: text("stripe_price_id"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
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
export const insertGrantSchema = createInsertSchema(grants).omit({ id: true, createdAt: true });
export const insertArtistSchema = createInsertSchema(artists).omit({ id: true, createdAt: true });
export const insertApplicationSchema = createInsertSchema(applications).omit({ id: true, startedAt: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true });
export const insertTemplateSchema = createInsertSchema(templates).omit({ id: true, createdAt: true });
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({ id: true, createdAt: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true, canceledAt: true });

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

export type User = typeof users.$inferSelect;
export type Grant = typeof grants.$inferSelect;
export type Artist = typeof artists.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
