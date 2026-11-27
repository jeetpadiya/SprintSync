import dns from "node:dns";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema.js";
import dotenv from "dotenv";

dotenv.config();

// Prefer IPv4 to avoid Happy Eyeballs / broken IPv6 AggregateError failures on Node
dns.setDefaultResultOrder("ipv4first");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("⚠️ DATABASE_URL is not set in environment variables!");
}

// Pooled PostgreSQL connection (avoids per-query HTTP fetch failures and supports transactions)
const client = postgres(connectionString || "", {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 15,
  prepare: false,
});

// Export Drizzle database instance configured with our schema
export const db = drizzle(client, { schema });

// Re-export schema tables and types for convenience
export * from "./schema.js";
