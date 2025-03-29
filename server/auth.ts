import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";
import { logger } from "./middleware/logger";

// Extend Express.User interface to include our User type
declare global {
  namespace Express {
    // Use type intersection to avoid recursive type reference
    interface User extends Omit<User, 'id'> {
      id: number;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Setup session - use env.SESSION_SECRET if available
  const sessionSecret = process.env.SESSION_SECRET || randomBytes(32).toString('hex');
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    }
  };

  // Trust proxy if in production
  if (process.env.NODE_ENV === 'production') {
    app.set("trust proxy", 1);
  }

  // Set up session and passport middleware
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          logger.info(`Login attempt failed: User ${username} not found`);
          return done(null, false, { message: "Invalid username or password" });
        }
        
        const isPasswordValid = await comparePasswords(password, user.password);
        
        if (!isPasswordValid) {
          logger.info(`Login attempt failed: Invalid password for user ${username}`);
          return done(null, false, { message: "Invalid username or password" });
        }

        logger.info(`User ${username} logged in successfully`);
        return done(null, user);
      } catch (error) {
        logger.error(`Login error: ${error}`);
        return done(error);
      }
    }),
  );

  // Configure passport serialization/deserialization
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Registration endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, name, email } = req.body;
      
      // Validate required fields
      if (!username || !password || !name || !email) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        name,
        email,
        role: "user"
      });

      // Log the user in automatically
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Don't send password in response
        const { password, ...userWithoutPassword } = user;
        
        logger.info(`New user registered: ${username}`);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      logger.error(`Registration error: ${error}`);
      next(error);
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User, info: { message?: string }) => {
      if (err) return next(err);
      
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Don't send password in response
        const { password, ...userWithoutPassword } = user;
        
        // Update last login timestamp (don't wait for it)
        if (user.id) {
          const now = new Date();
          storage.updateLastLogin(user.id, now).catch(err => {
            logger.error(`Failed to update last login time: ${err}`);
          });
        }
        
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    const username = (req.user as User)?.username || 'Unknown';
    
    req.logout((err) => {
      if (err) return next(err);
      
      logger.info(`User ${username} logged out`);
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Don't send password in response
    const { password, ...userWithoutPassword } = req.user as User;
    
    res.json(userWithoutPassword);
  });
}