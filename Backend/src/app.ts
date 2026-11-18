import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import { db } from "./db/db.js";
import { users } from "./db/schema.js";

const app: Express = express();

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// --- Global Middlewares ---
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true, // Required for HttpOnly cookies
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---
app.use("/api/auth", authRoutes);

// Health Check
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", message: "SprintSync API is running" });
});

// Users test endpoint
app.get("/api/users", async (_req: Request, res: Response) => {
  try {
    const allUsers = await db.select().from(users);
    res.status(200).json({ success: true, data: allUsers });
  } catch (error) {
    console.error("Database query failed:", error);
    res.status(500).json({ success: false, message: "Database query failed", error });
  }
});

// 404 Not Found Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found", code: "NOT_FOUND" });
});

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  });
});

export default app;
