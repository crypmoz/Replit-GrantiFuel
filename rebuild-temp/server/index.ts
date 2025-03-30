import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import { checkDatabaseConnection, closeDatabaseConnection } from './db';
import { registerRoutes } from './routes';
import { setupVite, serveStatic } from './vite';
import { requestLogger, logger } from './middleware/logger';
import env from './config/env';

// Create Express application
const app = express();
let server: any;

// Configure middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(requestLogger);

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Initialize the application
async function initializeApp() {
  try {
    // Check database connection
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }
    
    // Register API routes
    server = await registerRoutes(app);
    
    // Set up Vite in development, or serve static files in production
    if (env.NODE_ENV === 'production') {
      serveStatic(app);
    } else {
      await setupVite(app, server);
    }
    
    // Start the server
    const port = process.env.PORT || 3000;
    server.listen(port, '0.0.0.0', () => {
      logger.info(`Server running on http://0.0.0.0:${port}`);
    });
    
    // Handle server errors
    server.on('error', (error: any) => {
      if (error.syscall !== 'listen') {
        throw error;
      }
      
      switch (error.code) {
        case 'EACCES':
          logger.error(`Port ${port} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`Port ${port} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

// Set up process handlers for graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Graceful shutdown function
async function gracefulShutdown() {
  logger.info('Shutting down gracefully...');
  
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
    });
  }
  
  try {
    await closeDatabaseConnection();
    logger.info('Database connections closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Initialize the application
initializeApp();