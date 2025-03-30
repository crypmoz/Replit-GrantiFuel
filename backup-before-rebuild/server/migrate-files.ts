import { db } from "./db";
import { pool } from "./db";
import { sql } from "drizzle-orm";
import { fileTypeEnum } from "@shared/schema";

async function migrateFiles() {
  try {
    console.log("Starting file upload migration...");

    // Create the file_type enum if it doesn't exist
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'file_type') THEN
          CREATE TYPE file_type AS ENUM ('none', 'pdf', 'docx', 'txt');
        END IF;
      END
      $$;
    `);
    console.log("✅ Created file_type enum if it did not exist");

    // Add file-related columns to the knowledge_documents table if they don't exist
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'knowledge_documents' AND column_name = 'file_name') THEN
          ALTER TABLE knowledge_documents ADD COLUMN file_name TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'knowledge_documents' AND column_name = 'file_type') THEN
          ALTER TABLE knowledge_documents ADD COLUMN file_type file_type DEFAULT 'none';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'knowledge_documents' AND column_name = 'file_url') THEN
          ALTER TABLE knowledge_documents ADD COLUMN file_url TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'knowledge_documents' AND column_name = 'file_size') THEN
          ALTER TABLE knowledge_documents ADD COLUMN file_size INTEGER;
        END IF;
      END
      $$;
    `);
    console.log("✅ Added file columns to knowledge_documents table if they did not exist");

    // Set defaults for existing rows
    await pool.query(`
      UPDATE knowledge_documents 
      SET file_type = 'none' 
      WHERE file_type IS NULL;
    `);
    console.log("✅ Set default file_type for existing rows");

    console.log("File upload migration completed successfully!");
  } catch (error) {
    console.error("Error in file upload migration:", error);
    throw error;
  } finally {
    // Make sure we close the pool
    await pool.end();
  }
}

migrateFiles().catch(error => {
  console.error("Migration failed:", error);
  process.exit(1);
});