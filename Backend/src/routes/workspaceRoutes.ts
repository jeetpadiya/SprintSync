import { Router } from "express";
import {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceMembers,
  inviteTeammates,
} from "../controllers/workspaceController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// GET /api/workspaces (Protected)
router.get("/", requireAuth, getUserWorkspaces);

// GET /api/workspaces/members (Protected)
router.get("/members", requireAuth, getWorkspaceMembers);

// POST /api/workspaces (Protected)
router.post("/", requireAuth, createWorkspace);

// POST /api/workspaces/invite (Protected)
router.post("/invite", requireAuth, inviteTeammates);

export default router;
