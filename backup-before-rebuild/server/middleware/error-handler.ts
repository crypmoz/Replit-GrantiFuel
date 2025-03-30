import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { logger } from './logger';
import env from '../config/env';

// Custom error class for API errors
export class APIError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public errors?: any[]
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Error handler middleware
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error with request context
  logger.error('Error occurred', {
    error: {
      name: err.name,
      message: err.message,
      stack: env.NODE_ENV === 'development' ? err.stack : undefined,
      code: err instanceof APIError ? err.code : undefined,
      errors: err instanceof APIError ? err.errors : undefined,
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      body: req.body,
      query: req.query,
      params: req.params,
    },
  });

  // Handle API Errors
  if (err instanceof APIError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
        errors: err.errors,
      },
    });
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        errors: err.errors,
      },
    });
  }

  // Handle Prisma errors
  if (err instanceof PrismaClientKnownRequestError) {
    // Handle unique constraint violations
    if (err.code === 'P2002') {
      return res.status(409).json({
        error: {
          message: 'A record with this value already exists',
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          field: err.meta?.target,
        },
      });
    }

    // Handle record not found
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: {
          message: 'Record not found',
          code: 'NOT_FOUND',
        },
      });
    }

    // Handle foreign key constraint violations
    if (err.code === 'P2003') {
      return res.status(400).json({
        error: {
          message: 'Invalid reference to related record',
          code: 'FOREIGN_KEY_VIOLATION',
          field: err.meta?.field_name,
        },
      });
    }
  }

  // Handle Redis errors
  if (err instanceof Error && err.name === 'RedisError') {
    return res.status(503).json({
      error: {
        message: 'Cache service unavailable',
        code: 'CACHE_ERROR',
      },
    });
  }

  // Handle Stripe errors
  if (err instanceof Error && err.name === 'StripeError') {
    return res.status(400).json({
      error: {
        message: err.message,
        code: 'STRIPE_ERROR',
      },
    });
  }

  // Handle JWT errors
  if (err instanceof Error && err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: {
        message: 'Invalid token',
        code: 'INVALID_TOKEN',
      },
    });
  }

  if (err instanceof Error && err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: {
        message: 'Token expired',
        code: 'TOKEN_EXPIRED',
      },
    });
  }

  // Handle unknown errors
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    error: {
      message: env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message,
      code: 'INTERNAL_SERVER_ERROR',
    },
  });
}

// Not found middleware
export function notFound(req: Request, res: Response, next: NextFunction) {
  const error = new APIError(404, `Route ${req.originalUrl} not found`);
  next(error);
}

// Async handler to catch promise rejections
export const asyncHandler = (fn: Function) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
}; 