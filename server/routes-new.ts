import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { logger } from "./middleware/logger";
import { storage } from "./storage";
import { users, insertUserSchema, grants, applications, insertApplicationSchema, artists, activities, insertActivitySchema, templates, insertTemplateSchema, documents, insertDocumentSchema, subscriptionPlans, subscriptions, insertSubscriptionSchema } from "@shared/schema";
import Stripe from "stripe";
import { invalidateCache, cacheKeys } from "./middleware/cache";
import { setupAuth } from "./auth";

// Setup file uploads with multer
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const fileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',  // Images
    'application/pdf',  // PDFs
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  // Word docs
    'text/plain',  // Text files
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  // Excel
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',  // PowerPoint
    'application/zip',  // Zip archives
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`));
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // Initialize stripe if API key is available
  let stripe: Stripe | undefined;
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });
  }

  // Welcome route
  app.get("/api", (req, res) => {
    res.json({ message: "Welcome to GrantiFuel API" });
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}