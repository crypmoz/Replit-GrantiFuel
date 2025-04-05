import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure the pool with explicit limits for better stability
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20,                // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 10000, // How long to wait for a connection to be established
  maxUses: 7500           // Close and replace a connection after it has been used this many times
});

// Track active connections for monitoring purposes
pool.on('connect', () => {
  console.log(`[Database] New connection established. Pool size: ${pool.totalCount}, Idle: ${pool.idleCount}, Waiting: ${pool.waitingCount}`);
});

pool.on('error', (err, client) => {
  console.error('[Database] Unexpected error on idle client', err);
});

export const db = drizzle({ client: pool, schema });
