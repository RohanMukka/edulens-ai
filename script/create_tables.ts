import "dotenv/config";
import { db } from "../server/storage";
import { sql } from "drizzle-orm";

async function createTablesIfNotExist() {
  try {
    console.log("Creating missing tables...");

    // Create forum_threads table if it doesn't exist
    await db.execute(
      sql`CREATE TABLE IF NOT EXISTS forum_threads (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL,
        is_ai_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT now() NOT NULL
      )`
    );
    console.log("✓ forum_threads table created/verified");

    // Create forum_posts table if it doesn't exist
    await db.execute(
      sql`CREATE TABLE IF NOT EXISTS forum_posts (
        id SERIAL PRIMARY KEY,
        thread_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        is_ai_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT now() NOT NULL
      )`
    );
    console.log("✓ forum_posts table created/verified");

    // Create study_tasks table if it doesn't exist
    await db.execute(
      sql`CREATE TABLE IF NOT EXISTS study_tasks (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        type TEXT NOT NULL,
        priority TEXT NOT NULL,
        completed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT now() NOT NULL
      )`
    );
    console.log("✓ study_tasks table created/verified");

    console.log("All tables created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Table creation failed:", error);
    process.exit(1);
  }
}

createTablesIfNotExist();
