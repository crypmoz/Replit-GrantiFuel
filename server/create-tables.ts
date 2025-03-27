import { db } from "./db";
import { sql } from "drizzle-orm";
import { 
  users, grants, artists, applications, activities, templates,
  documents, documentTypeEnum, subscriptionPlans, planTierEnum, subscriptions
} from "@shared/schema";

async function createTables() {
  console.log("Creating database tables...");
  
  try {
    // Drop tables if they exist (in reverse order of dependencies)
    await db.execute(sql`DROP TABLE IF EXISTS activities`);
    await db.execute(sql`DROP TABLE IF EXISTS applications`);
    await db.execute(sql`DROP TABLE IF EXISTS templates`);
    await db.execute(sql`DROP TABLE IF EXISTS knowledge_documents`);
    await db.execute(sql`DROP TABLE IF EXISTS subscriptions`);
    await db.execute(sql`DROP TABLE IF EXISTS subscription_plans`);
    await db.execute(sql`DROP TABLE IF EXISTS artists`);
    await db.execute(sql`DROP TABLE IF EXISTS grants`);
    await db.execute(sql`DROP TABLE IF EXISTS users`);
    await db.execute(sql`DROP TABLE IF EXISTS session`);
    
    // Drop enum types if they exist
    await db.execute(sql`DROP TYPE IF EXISTS document_type`);
    await db.execute(sql`DROP TYPE IF EXISTS plan_tier`);

    // Users table
    await db.execute(sql`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        avatar TEXT,
        bio TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        verified BOOLEAN NOT NULL DEFAULT false,
        verification_token TEXT,
        reset_password_token TEXT,
        reset_password_expires TIMESTAMP,
        last_login TIMESTAMP,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Grants table
    await db.execute(sql`
      CREATE TABLE grants (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        organization TEXT NOT NULL,
        amount TEXT,
        deadline TIMESTAMP NOT NULL,
        description TEXT,
        requirements TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Artists table
    await db.execute(sql`
      CREATE TABLE artists (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        bio TEXT,
        genres TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Applications table
    await db.execute(sql`
      CREATE TABLE applications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        grant_id INTEGER NOT NULL REFERENCES grants(id),
        artist_id INTEGER NOT NULL REFERENCES artists(id),
        status TEXT NOT NULL DEFAULT 'draft',
        progress INTEGER NOT NULL DEFAULT 0,
        answers JSONB,
        submitted_at TIMESTAMP,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Templates table
    await db.execute(sql`
      CREATE TABLE templates (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        type TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Activities table
    await db.execute(sql`
      CREATE TABLE activities (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id INTEGER,
        details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Session table for connect-pg-simple
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      )
    `);
    
    // Create enums
    await db.execute(sql`CREATE TYPE document_type AS ENUM ('grant_info', 'artist_guide', 'application_tips', 'admin_knowledge', 'user_upload')`);
    await db.execute(sql`CREATE TYPE plan_tier AS ENUM ('free', 'basic', 'premium')`);
    
    // Subscription plans table
    await db.execute(sql`
      CREATE TABLE subscription_plans (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        tier plan_tier NOT NULL,
        price INTEGER NOT NULL,
        description TEXT NOT NULL,
        max_applications INTEGER NOT NULL,
        max_artists INTEGER NOT NULL,
        features TEXT[],
        stripe_price_id TEXT,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Subscriptions table
    await db.execute(sql`
      CREATE TABLE subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        current_period_start TIMESTAMP NOT NULL,
        current_period_end TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        canceled_at TIMESTAMP
      )
    `);
    
    // Knowledge documents table
    await db.execute(sql`
      CREATE TABLE knowledge_documents (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        type document_type NOT NULL,
        tags TEXT[],
        is_public BOOLEAN NOT NULL DEFAULT false,
        is_approved BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("All tables created successfully");
  } catch (error) {
    console.error("Error creating tables:", error);
    throw error;
  }
}

// Run the table creation
createTables()
  .then(() => {
    console.log("Database setup complete");
    process.exit(0);
  })
  .catch(err => {
    console.error("Database setup failed:", err);
    process.exit(1);
  });