import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes/index.js";

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

// --- Mount All API Routes ---
app.use("/api", routes);

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
