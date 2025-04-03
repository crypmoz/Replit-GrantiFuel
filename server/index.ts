import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import compression from "compression";
import { requestLogger } from "./middleware/request-logger";
import { backgroundProcessor } from "./services/background-processor";

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

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Start the background processor
    backgroundProcessor.startProcessingInterval();
    log('Background document processor started');
    
    // Queue any pending documents that might need processing
    backgroundProcessor.queueAllDocuments()
      .then(result => log(`Queued ${result.queued} documents for analysis`))
      .catch(err => console.error('Error queueing documents:', err));
  });
})();
