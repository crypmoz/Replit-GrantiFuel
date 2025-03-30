import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import compression from "compression";
import { setupSecurityMiddleware } from './middleware/security';
import { errorHandler, notFound } from './middleware/error-handler';
import { requestLogger, errorLogger } from './middleware/logger';
import { cacheMiddleware } from './middleware/cache';
import healthRoutes from './health';
import env from './config/env';
import { checkDatabaseConnection, closeDatabaseConnection } from './db';
import { checkRedisConnection, closeRedisConnection } from './middleware/cache';
import { logger } from './middleware/logger';

const app = express();
let server: any;

// Set environment
app.set('env', env.NODE_ENV);

// Add security middleware first
setupSecurityMiddleware(app);

// Add compression middleware
app.use(compression());

// Add body parsing middleware
app.use(express.json({ limit: env.MAX_FILE_SIZE }));
app.use(express.urlencoded({ extended: false, limit: env.MAX_FILE_SIZE }));

// Add request logging middleware
app.use(requestLogger);

// Add caching middleware for GET requests
app.use(cacheMiddleware(env.CACHE_TTL));

// Add health check routes
app.use('/health', healthRoutes);

// Register routes
(async () => {
  try {
    // Check database connection
    try {
      const dbConnected = await checkDatabaseConnection();
      if (!dbConnected) {
        logger.warn('Database connection failed, some features may not work properly');
      }
    } catch (err) {
      logger.warn('Database connection check error:', err);
      logger.warn('Continuing without database connection, some features may not work properly');
    }

    // Check Redis connection if URL is provided
    if (env.REDIS_URL) {
      const redisConnected = await checkRedisConnection();
      if (!redisConnected) {
        logger.warn('Redis connection failed, caching will be disabled');
      }
    } else {
      logger.info('Redis URL not provided, using in-memory cache');
    }

    // Register routes
    server = await registerRoutes(app);

    // Setup Vite in development or serve static files in production
    // This must come before the notFound handler
    if (env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    
    // Add 404 handler for API routes only (non-html requests)
    app.use('/api/*', notFound);
    
    // Add error logging middleware
    app.use(errorLogger);
    
    // Add error handling middleware
    app.use(errorHandler);

    // Start server
    server.listen({
      port: env.PORT,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });

    // Handle graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down server...');
      
      // Close server
      if (server) {
        await new Promise<void>((resolve) => {
          server.close(() => {
            logger.info('Server closed');
            resolve();
          });
        });
      }

      // Close database connection if it was established
      try {
        await closeDatabaseConnection();
      } catch (err) {
        logger.warn('Error closing database connection:', err);
      }

      // Close Redis connection if it was established
      try {
        await closeRedisConnection();
      } catch (err) {
        logger.warn('Error closing Redis connection:', err);
      }

      logger.info('Shutdown complete');
      process.exit(0);
    };

    // Handle process signals
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      shutdown();
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown();
    });

  } catch (err) {
    logger.error('Server startup error:', err);
    process.exit(1);
  }
})();
