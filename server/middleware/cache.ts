import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { logger } from './logger';
import env from '../config/env';

// Create a mock Redis client if REDIS_URL is not defined
class MockRedis {
  status: string = 'ready';
  
  async get() { return null; }
  async setex() { return 'OK'; }
  async keys() { return []; }
  async del() { return 0; }
  async ping() { return 'PONG'; }
  async quit() { return 'OK'; }
  on() { return this; }
}

let redis: Redis | MockRedis;

// Initialize Redis only if URL is available
if (env.REDIS_URL) {
  try {
    // Redis connection configuration
    const redisConfig = {
      host: new URL(env.REDIS_URL).hostname,
      port: parseInt(new URL(env.REDIS_URL).port),
      password: new URL(env.REDIS_URL).password,
      retryStrategy: (times: number): number => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
      keepAlive: 30000,
      family: 4,
      db: 0,
    };

    // Initialize Redis client with error handling
    redis = new Redis(redisConfig);

    // Handle Redis connection events
    redis.on('connect', () => {
      logger.info('Redis client connected');
    });

    redis.on('ready', () => {
      logger.info('Redis client ready');
    });

    redis.on('error', (err) => {
      logger.error('Redis client error:', err);
    });

    redis.on('close', () => {
      logger.warn('Redis client closed');
    });

    redis.on('reconnecting', (times: number) => {
      logger.warn(`Redis client reconnecting (attempt ${times})`);
    });
  } catch (error) {
    logger.error('Failed to initialize Redis client:', error);
    redis = new MockRedis();
  }
} else {
  logger.warn('REDIS_URL not provided, using mock Redis client');
  redis = new MockRedis();
}

// Default cache duration (5 minutes)
const DEFAULT_CACHE_DURATION = 300;

interface CachedResponse {
  statusCode: number;
  data: unknown;
  headers: Record<string, string | string[]>;
}

// Cache middleware creator
export function cacheMiddleware(duration: number = DEFAULT_CACHE_DURATION) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl}`;

    try {
      // Check Redis connection
      if (!redis.status || redis.status !== 'ready') {
        logger.warn('Redis not ready, skipping cache');
        return next();
      }

      // Try to get cached response
      const cachedResponse = await redis.get(key);

      if (cachedResponse) {
        const parsedResponse = JSON.parse(cachedResponse) as CachedResponse;
        
        // Set headers from cached response
        Object.entries(parsedResponse.headers).forEach(([name, value]) => {
          res.setHeader(name, value);
        });

        // Send cached response
        return res.status(parsedResponse.statusCode).json(parsedResponse.data);
      }

      // If no cache, store the response
      const originalJson = res.json.bind(res);
      res.json = (data: unknown) => {
        // Convert headers to a plain object with string or string[] values
        const headers = Object.entries(res.getHeaders()).reduce((acc, [key, value]) => {
          if (value !== undefined) {
            // Convert header value to string or string[]
            if (Array.isArray(value)) {
              acc[key] = value.map(String);
            } else {
              acc[key] = String(value);
            }
          }
          return acc;
        }, {} as Record<string, string | string[]>);

        const responseData: CachedResponse = {
          statusCode: res.statusCode,
          data,
          headers,
        };

        // Only cache successful responses
        if (res.statusCode === 200) {
          redis.setex(key, duration, JSON.stringify(responseData))
            .catch((err: Error) => logger.error('Redis Cache Error:', err));
        }

        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache Middleware Error:', error);
      next();
    }
  };
}

// Cache invalidation helper
export async function invalidateCache(pattern: string) {
  try {
    if (!redis.status || redis.status !== 'ready') {
      logger.warn('Redis not ready, skipping cache invalidation');
      return;
    }

    const keys = await redis.keys(`cache:${pattern}`);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info(`Invalidated cache for pattern: ${pattern}`);
    }
  } catch (error) {
    logger.error('Cache Invalidation Error:', error);
  }
}

// Cache prefix helpers
export const cacheKeys = {
  grants: 'grants:*',
  artists: 'artists:*',
  applications: 'applications:*',
  documents: 'documents:*',
  user: (id: string) => `user:${id}:*`,
};

// Health check function
export async function checkRedisConnection() {
  try {
    await redis.ping();
    logger.info('Redis connection successful');
    return true;
  } catch (err) {
    logger.error('Redis connection failed:', err);
    return false;
  }
}

// Graceful shutdown function
export async function closeRedisConnection() {
  try {
    await redis.quit();
    logger.info('Redis connection closed');
  } catch (err) {
    logger.error('Error closing Redis connection:', err);
    throw err;
  }
}

// Export Redis client for direct use
export { redis }; 