import { db } from "./db";
import { sql } from "drizzle-orm";

async function migrateDocuments() {
  console.log("Migrating knowledge documents table...");
  
  try {
    // Create the document type enum if it doesn't exist
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type') THEN
          CREATE TYPE document_type AS ENUM ('grant_info', 'artist_guide', 'application_tips', 'admin_knowledge', 'user_upload');
        END IF;
      END
      $$;
    `);

    // Create the knowledge_documents table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS knowledge_documents (
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

    console.log("Knowledge documents table migration completed successfully");
  } catch (error) {
    console.error("Error migrating knowledge documents table:", error);
    throw error;
  }
}

// Run the migration
migrateDocuments()
  .then(() => {
    console.log("Knowledge documents migration complete");
    process.exit(0);
  })
  .catch(err => {
    console.error("Knowledge documents migration failed:", err);
    process.exit(1);
  });