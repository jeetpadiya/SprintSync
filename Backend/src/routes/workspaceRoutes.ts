import { Router } from "express";
import {
  createWorkspace,
  getUserWorkspaces,
  inviteTeammates,
} from "../controllers/workspaceController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// GET /api/workspaces (Protected)
router.get("/", requireAuth, getUserWorkspaces);

// POST /api/workspaces (Protected)
router.post("/", requireAuth, createWorkspace);

// POST /api/workspaces/invite (Protected)
router.post("/invite", requireAuth, inviteTeammates);

export default router;
