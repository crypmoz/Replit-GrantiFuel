import { db } from "./db";
import { pool } from "./db";
import { sql } from "drizzle-orm";
import {
  planTierEnum,
  subscriptionPlans
} from "@shared/schema";

async function migrateDatabase() {
  try {
    console.log("Starting database migration...");

    // Add stripeCustomerId column to users table
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT
    `);
    console.log("✅ Added stripe_customer_id to users table");

    // Create plan_tier enum if it doesn't exist
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_tier') THEN
          CREATE TYPE plan_tier AS ENUM ('free', 'basic', 'premium');
        END IF;
      END
      $$;
    `);
    console.log("✅ Created plan_tier enum");

    // Create subscription_plans table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        tier plan_tier NOT NULL,
        price INTEGER NOT NULL,
        description TEXT NOT NULL,
        max_applications INTEGER NOT NULL,
        max_artists INTEGER NOT NULL,
        features TEXT[],
        stripe_price_id TEXT,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✅ Created subscription_plans table");

    // Create subscriptions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        current_period_start TIMESTAMP NOT NULL,
        current_period_end TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        canceled_at TIMESTAMP
      )
    `);
    console.log("✅ Created subscriptions table");

    // Insert default subscription plans
    // Check if plans already exist
    const existingPlans = await db.select().from(subscriptionPlans);
    
    if (existingPlans.length === 0) {
      await pool.query(`
        INSERT INTO subscription_plans 
          (name, tier, price, description, max_applications, max_artists, features, active)
        VALUES 
          ('Free', 'free', 0, 'Basic plan for individual musicians', 1, 1, 
            ARRAY['1 grant application', '1 artist profile', 'AI assistance', 'Basic templates'], 
            TRUE),
          ('Basic', 'basic', 2500, 'Great for small ensembles and emerging artists', 5, 2, 
            ARRAY['5 grant applications', '2 artist profiles', 'Priority AI assistance', 'All templates', 'Email support'], 
            TRUE),
          ('Premium', 'premium', 6000, 'Professional package for established musicians and organizations', 20, 10, 
            ARRAY['20 grant applications', '10 artist profiles', 'Priority AI assistance', 'All templates', 'Priority support', 'Grant deadline alerts', 'Application analytics'], 
            TRUE)
      `);
      console.log("✅ Inserted default subscription plans");
    } else {
      console.log("✅ Subscription plans already exist, skipping insertion");
    }

    // Give free plan to existing users
    await pool.query(`
      DO $$
      DECLARE
        free_plan_id INTEGER;
      BEGIN
        SELECT id INTO free_plan_id FROM subscription_plans WHERE tier = 'free' LIMIT 1;
        
        IF free_plan_id IS NOT NULL THEN
          INSERT INTO subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
          SELECT 
            u.id, 
            free_plan_id, 
            'active',
            NOW(),
            NOW() + INTERVAL '100 years'
          FROM 
            users u
          WHERE 
            NOT EXISTS (
              SELECT 1 FROM subscriptions s WHERE s.user_id = u.id
            );
        END IF;
      END
      $$;
    `);
    console.log("✅ Added free plan to existing users without subscriptions");

    console.log("Database migration completed successfully!");
  } catch (error) {
    console.error("Error in database migration:", error);
    throw error;
  } finally {
    // Make sure we close the pool
    await pool.end();
  }
}

migrateDatabase().catch(error => {
  console.error("Migration failed:", error);
  process.exit(1);
});