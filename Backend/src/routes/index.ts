import { Router, Request, Response } from "express";
import authRoutes from "./authRoutes.js";
import workspaceRoutes from "./workspaceRoutes.js";
import teamRoutes from "./teamRoutes.js";
import issueRoutes from "./issueRoutes.js";
import labelRoutes from "./labelRoutes.js";
import { db } from "../db/db.js";
import { users } from "../db/schema.js";

const router = Router();

// Health Check: GET /api/health
router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", message: "SprintSync API is running" });
});

// Auth Routes: /api/auth/*
router.use("/auth", authRoutes);

// Workspace Routes: /api/workspaces/*
router.use("/workspaces", workspaceRoutes);

// Teams Routes: /api/teams/*
router.use("/teams", teamRoutes);

// Issue Routes: /api/issues/*
router.use("/issues", issueRoutes);

// Label Routes: /api/labels/*
router.use("/labels", labelRoutes);

// Users test endpoint: GET /api/users
router.get("/users", async (_req: Request, res: Response) => {
  try {
    const allUsers = await db.select().from(users);
    res.status(200).json({ success: true, data: allUsers });
  } catch (error) {
    console.error("Database query failed:", error);
    res.status(500).json({ success: false, message: "Database query failed", error });
  }
});

export default router;
