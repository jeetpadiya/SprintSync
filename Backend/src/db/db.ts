import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema.js";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("⚠️ DATABASE_URL is not set in environment variables!");
}

// Neon HTTP Serverless connection
const sql = neon(connectionString || "");

// Export Drizzle database instance configured with our schema
export const db = drizzle(sql, { schema });

// Re-export schema tables and types for convenience
export * from "./schema.js";
