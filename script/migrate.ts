import "dotenv/config";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "../server/storage";
import path from "path";

async function runMigrations() {
  try {
    console.log("Running migrations...");
    await migrate(db, {
      migrationsFolder: path.resolve(process.cwd(), "migrations"),
    });
    console.log("Migrations completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigrations();
