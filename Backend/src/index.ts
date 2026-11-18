import dotenv from "dotenv";
import app from "./app.js";
import { db } from "./db/db.js";
import { sql } from "drizzle-orm";

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 SprintSync Backend running on http://localhost:${PORT}`);

  // Test connection to Neon PostgreSQL
  try {
    await db.execute(sql`SELECT 1;`);
    console.log("✅ Neon PostgreSQL connected successfully!");
  } catch (error) {
    console.error("❌ Database connection error:", error);
  }
});
