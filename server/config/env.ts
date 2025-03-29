import { z } from 'zod';

// Environment schema
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().positive()).default('5000'),

  // Database
  DATABASE_URL: z.string().url(),
  POSTGRES_USER: z.string().min(1).optional(),
  POSTGRES_PASSWORD: z.string().min(1).optional(),
  POSTGRES_DB: z.string().min(1).optional(),
  POSTGRES_HOST: z.string().min(1).optional(),

  // Redis
  REDIS_URL: z.string().url().optional(),

  // Session
  SESSION_SECRET: z.string().default('super-secret-key-that-should-be-changed-in-production'),
  SESSION_COOKIE_SECURE: z.string().transform(val => val === 'true').default('false'),
  SESSION_COOKIE_HTTPONLY: z.string().transform(val => val === 'true').default('true'),
  SESSION_COOKIE_SAMESITE: z.enum(['strict', 'lax', 'none']).default('lax'),

  // Stripe
  STRIPE_PUBLIC_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Security
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().nonnegative()).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().nonnegative()).default('100'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['simple', 'json']).default('json'),

  // Cache
  CACHE_TTL: z.string().transform(Number).pipe(z.number().nonnegative()).default('300'),

  // File Upload
  MAX_FILE_SIZE: z.string().transform(Number).pipe(z.number().positive()).default('5242880'),
  ALLOWED_FILE_TYPES: z.string().default('pdf,docx,txt').transform(val => val.split(',')).pipe(z.array(z.string())),

  // API
  API_VERSION: z.string().regex(/^v\d+$/).default('v1'),
  API_PREFIX: z.string().startsWith('/').default('/api/v1'),
});

// Add runtime type information
type Env = z.infer<typeof envSchema>;

// Parse and validate environment variables
function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .filter(err => err.code === 'invalid_type' && err.received === 'undefined')
        .map(err => err.path.join('.'));

      const invalidVars = error.errors
        .filter(err => err.code !== 'invalid_type' || err.received !== 'undefined')
        .map(err => `${err.path.join('.')}: ${err.message}`);

      if (missingVars.length > 0) {
        console.error('Missing required environment variables:', missingVars.join(', '));
      }

      if (invalidVars.length > 0) {
        console.error('Invalid environment variables:', invalidVars.join(', '));
      }

      throw new Error('Environment validation failed. Check the logs for details.');
    }
    throw error;
  }
}

// Export validated environment variables
const env = validateEnv();

export default env; 