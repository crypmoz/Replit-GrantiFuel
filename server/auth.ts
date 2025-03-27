import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { pool, db } from "./db";
import connectPg from "connect-pg-simple";
import crypto from "crypto";
import { User as SelectUser, users } from "@shared/schema";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

// Create a PostgreSQL session store
const PostgresStore = connectPg(session);

// Generate secure hash for password
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Compare password with stored hash
async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  return await bcrypt.compare(supplied, stored);
}

// Generate a secure random token
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function setupAuth(app: Express) {
  // Session configuration
  const sessionSettings: session.SessionOptions = {
    store: new PostgresStore({
      pool,
      tableName: 'session' // Default is "session"
    }),
    secret: process.env.SESSION_SECRET || 'your-session-secret-should-be-in-env',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      sameSite: 'lax'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy for username/password authentication
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        if (!user.active) {
          return done(null, false, { message: "Account is disabled" });
        }
        
        const isValidPassword = await comparePasswords(password, user.password);
        
        if (!isValidPassword) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        // Update last login time
        await db.update(users)
          .set({ lastLogin: new Date() })
          .where(eq(users.id, user.id));
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  // Configure passport serialization
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || undefined);
    } catch (error) {
      done(error);
    }
  });

  // Register API routes
  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if username or email is already taken
      const existingUsername = await storage.getUserByUsername(req.body.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash password before storing
      const hashedPassword = await hashPassword(req.body.password);
      
      // Generate verification token if email verification is required
      const verificationToken = generateToken();
      
      // Create user with provided data
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
        verificationToken: req.body.verified ? undefined : verificationToken,
      });

      // Remove sensitive data before sending response
      const { password, verificationToken: token, ...userWithoutSensitiveData } = user;
      
      // Log user in automatically after registration
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutSensitiveData);
      });
      
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Invalid credentials" });
      
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        
        // Remove sensitive data before sending response
        const { password, verificationToken, resetPasswordToken, ...userWithoutSensitiveData } = user;
        
        res.status(200).json(userWithoutSensitiveData);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Remove sensitive data before sending response
    const { password, verificationToken, resetPasswordToken, ...userWithoutSensitiveData } = req.user!;
    
    res.json(userWithoutSensitiveData);
  });

  app.post("/api/verify-email", async (req, res, next) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "Verification token is required" });
      }
      
      // Find user by verification token
      const foundUsers = await db.select()
        .from(users)
        .where(eq(users.verificationToken, token))
        .limit(1);
      
      if (foundUsers.length === 0) {
        return res.status(400).json({ message: "Invalid verification token" });
      }
      
      // Update user as verified
      await db.update(users)
        .set({ verified: true, verificationToken: null })
        .where(eq(users.id, foundUsers[0].id));
      
      res.status(200).json({ message: "Email verified successfully" });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/forgot-password", async (req, res, next) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Find user by email
      const foundUsers = await db.select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      if (foundUsers.length === 0) {
        // Don't reveal whether email exists for security reasons
        return res.status(200).json({ message: "If your email is in our system, you will receive a password reset link" });
      }
      
      const token = generateToken();
      const expires = new Date();
      expires.setHours(expires.getHours() + 1); // Token expires in 1 hour
      
      // Update user with reset token and expiry
      await db.update(users)
        .set({ 
          resetPasswordToken: token,
          resetPasswordExpires: expires
        })
        .where(eq(users.id, foundUsers[0].id));
      
      // In a real application, send email with password reset link including token
      
      res.status(200).json({ message: "If your email is in our system, you will receive a password reset link" });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/reset-password", async (req, res, next) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: "Token and new password are required" });
      }
      
      // Find user by reset token
      const foundUsers = await db.select()
        .from(users)
        .where(eq(users.resetPasswordToken, token))
        .limit(1);
      
      if (foundUsers.length === 0) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      
      const user = foundUsers[0];
      
      // Check if token is expired
      if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
        return res.status(400).json({ message: "Password reset token has expired" });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(password);
      
      // Update user with new password and clear reset token
      await db.update(users)
        .set({ 
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpires: null
        })
        .where(eq(users.id, user.id));
      
      res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/user/profile", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user!.id;
      
      // Extract updatable fields only
      const { name, bio, avatar } = req.body;
      const updateData: any = {};
      
      if (name) updateData.name = name;
      if (bio !== undefined) updateData.bio = bio;
      if (avatar !== undefined) updateData.avatar = avatar;
      
      // Update user profile
      await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId));
      
      // Get updated user data
      const updatedUser = await storage.getUser(userId);
      
      // Remove sensitive data before sending response
      const { password, verificationToken, resetPasswordToken, ...userWithoutSensitiveData } = updatedUser!;
      
      res.status(200).json(userWithoutSensitiveData);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/user/password", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      
      // Verify current password
      const user = await storage.getUser(userId);
      const isValidPassword = await comparePasswords(currentPassword, user!.password);
      
      if (!isValidPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update user with new password
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, userId));
      
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      next(error);
    }
  });
}