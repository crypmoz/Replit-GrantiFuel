import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from "@shared/schema";
import { logger } from './middleware/logger';
import env from './config/env';

// Database connection configuration
const dbConfig = {
  connectionString: env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
};

// Create connection pool with error handling
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Handle pool connection
pool.on('connect', (client) => {
  logger.info('New client connected to the pool');
});

// Handle pool removal
pool.on('remove', (client) => {
  logger.info('Client removed from pool');
});

// Initialize drizzle with the pool
export const db = drizzle(pool, { schema });

// Health check function
export async function checkDatabaseConnection() {
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      logger.info('Database connection successful');
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    logger.error('Database connection failed:', err);
    return false;
  }
}

// Graceful shutdown function
export async function closeDatabaseConnection() {
  try {
    await pool.end();
    logger.info('Database connection pool closed');
  } catch (err) {
    logger.error('Error closing database connection pool:', err);
    throw err;
  }
}

// Export pool for direct use if needed
export { pool };
