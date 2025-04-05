import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import compression from "compression";
import { requestLogger } from "./middleware/request-logger";
import { backgroundProcessor } from "./services/background-processor";
import http from 'http';

const app = express();
// Add compression middleware
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add request logger middleware for API routes
app.use('/api', requestLogger({
  logHeaders: false,
  logBody: true,
  logQueryParams: true,
  maskSensitiveData: true
}));

// Legacy logger - keeping for backward compatibility
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const errorId = `err-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    // Log detailed error information
    console.error(`[ERROR ${errorId}] ${req.method} ${req.path}`, {
      errorId,
      status,
      message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      query: req.query,
      body: req.body,
      user: req.user ? { id: req.user.id, username: req.user.username } : null
    });

    // Provide response with less sensitive information
    res.status(status).json({ 
      message,
      errorId,
      status
    });
    
    // Don't throw the error again as it was already logged
  });
  
  // Add a direct API access endpoint that bypasses Vite for health checks
  app.get('/__api_health', async (req: Request, res: Response) => {
    // Set up the response with proper headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    try {
      // Check database connection
      let dbStatus = 'healthy';
      let dbError = null;
      
      try {
        // Try a simple database query to ensure connection is working
        const { db } = await import('./db');
        await db.execute('SELECT 1 as check');
      } catch (error) {
        dbStatus = 'error';
        dbError = (error as Error).message;
      }
      
      // Get system memory usage
      const memoryUsage = process.memoryUsage();
      
      // Get uptime info
      const uptime = {
        serverUptime: process.uptime(),
        nodeUptime: Math.floor(process.uptime()),
        systemUptime: Math.floor(process.uptime()),
      };
      
      // Return enhanced health status
      res.send(JSON.stringify({
        status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        message: dbStatus === 'healthy' ? 
          "API server is running normally" : 
          "API server is running but database connection has issues",
        environment: process.env.NODE_ENV || 'development',
        checks: {
          database: {
            status: dbStatus,
            error: dbError
          }
        },
        system: {
          memory: {
            rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
            heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
            heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
          },
          uptime: uptime
        }
      }));
    } catch (error) {
      console.error("Error in API health check:", error);
      res.status(500).send(JSON.stringify({
        status: "error",
        timestamp: new Date().toISOString(),
        message: "Error performing health check",
        error: (error as Error).message
      }));
    }
  });
  
  // Direct access to AI health info that bypasses Vite
  app.get('/__ai_health', async (req: Request, res: Response) => {
    // Import service here to avoid circular dependencies
    const { aiService } = await import('./services/ai-service');
    
    // Set headers to prevent caching and ensure the response is treated as JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    try {
      // Check if reset parameter was provided
      const shouldReset = req.query.reset === 'true';
      let resetResult = null;
      
      // Perform circuit breaker reset if requested
      if (shouldReset) {
        console.log('[Health Check] Circuit breaker reset requested via health endpoint');
        resetResult = aiService.resetCircuitBreaker();
      }
      
      // Get service information after potential reset
      const isDeepseekConfigured = !!process.env.DEEPSEEK_API_KEY;
      const serviceInfo = aiService.getServiceInfo();
      const circuitState = serviceInfo.circuitBreakerState.state;
      
      // Send JSON response
      res.send(JSON.stringify({
        status: "success",
        provider: "deepseek",
        serviceConfigured: isDeepseekConfigured,
        serviceState: circuitState,
        timestamp: new Date().toISOString(),
        resetPerformed: shouldReset,
        resetResult: resetResult
      }));
    } catch (error) {
      console.error("Error checking AI health:", error);
      
      // Send error response
      res.status(500).send(JSON.stringify({
        status: "error",
        message: "Error checking AI service health",
        timestamp: new Date().toISOString()
      }));
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Attempt to start the server on port 5000, but fall back to other ports if needed
  const tryPorts = [5000, 5001, 5002];
  
  let currentPortIndex = 0;
  
  function tryNextPort() {
    if (currentPortIndex >= tryPorts.length) {
      log(`Failed to start server on any port from ${tryPorts.join(', ')}`);
      process.exit(1);
      return;
    }
    
    const port = tryPorts[currentPortIndex];
    
    const serverInstance = server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }).on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        log(`Port ${port} is already in use, trying next port...`);
        currentPortIndex++;
        tryNextPort();
      } else {
        console.error('Server error:', error);
        process.exit(1);
      }
    }).on('listening', () => {
      log(`serving on port ${port}`);
      
      // Start the background processor
      backgroundProcessor.startProcessingInterval();
      log('Background document processor started');
      
      // Queue any pending documents that might need processing
      backgroundProcessor.queueAllDocuments()
        .then(result => log(`Queued ${result.queued} documents for analysis`))
        .catch(err => console.error('Error queueing documents:', err));
    });
  }
  
  tryNextPort();
})();
