import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  activities: many(activities),
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
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  bio: text("bio"),
  genres: text("genres").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const artistsRelations = relations(artists, ({ many }) => ({
  applications: many(applications),
}));

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
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
  name: text("name").notNull(),
  description: text("description"),
  content: text("content").notNull(),
  type: text("type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertGrantSchema = createInsertSchema(grants).omit({ id: true, createdAt: true });
export const insertArtistSchema = createInsertSchema(artists).omit({ id: true, createdAt: true });
export const insertApplicationSchema = createInsertSchema(applications).omit({ id: true, startedAt: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true });
export const insertTemplateSchema = createInsertSchema(templates).omit({ id: true, createdAt: true });

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

export type User = typeof users.$inferSelect;
export type Grant = typeof grants.$inferSelect;
export type Artist = typeof artists.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Template = typeof templates.$inferSelect;
