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
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }

    // Check Redis connection
    const redisConnected = await checkRedisConnection();
    if (!redisConnected) {
      logger.warn('Redis connection failed, caching will be disabled');
    }

    // Register routes
    server = await registerRoutes(app);

    // Add 404 handler
    app.use(notFound);

    // Add error logging middleware
    app.use(errorLogger);

    // Add error handling middleware
    app.use(errorHandler);

    // Setup Vite in development
    if (env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start server
    server.listen({
      port: env.PORT,
      host: "localhost",
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

      // Close database connection
      await closeDatabaseConnection();

      // Close Redis connection
      await closeRedisConnection();

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
