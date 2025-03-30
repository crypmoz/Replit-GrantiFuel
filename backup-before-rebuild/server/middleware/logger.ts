import winston from 'winston';
import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import env from '../config/env';

// Create Winston logger
const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    env.LOG_FORMAT === 'json' 
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
  ),
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // Write production logs to a file
    ...(env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
          new winston.transports.File({ 
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
        ]
      : []),
  ],
});

// Request logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = performance.now();

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    referer: req.get('referer'),
    contentType: req.get('content-type'),
    contentLength: req.get('content-length'),
    query: req.query,
    params: req.params,
    body: req.body,
  });

  // Log response
  res.on('finish', () => {
    const duration = performance.now() - start;
    const level = res.statusCode >= 400 ? 'error' : 'info';

    logger[level]('Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration.toFixed(2)}ms`,
      contentLength: res.get('content-length'),
      contentType: res.get('content-type'),
      user: req.user ? { id: req.user.id, email: req.user.email } : undefined,
    });
  });

  next();
}

// Error logging middleware
export function errorLogger(err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error('Error occurred', {
    error: {
      name: err.name,
      message: err.message,
      stack: env.NODE_ENV === 'development' ? err.stack : undefined,
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      referer: req.get('referer'),
      contentType: req.get('content-type'),
      contentLength: req.get('content-length'),
      query: req.query,
      params: req.params,
      body: req.body,
      user: req.user ? { id: req.user.id, email: req.user.email } : undefined,
    },
  });

  next(err);
}

// Export logger instance
export { logger }; 