import { Router } from "express";
import {
  getTeams,
  createTeam,
  getTeamMembers,
  addTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
} from "../controllers/teamController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// GET /api/teams (Protected)
router.get("/", requireAuth, getTeams);

// POST /api/teams (Protected)
router.post("/", requireAuth, createTeam);

// Team member management routes (Protected)
router.get("/:teamId/members", requireAuth, getTeamMembers);
router.post("/:teamId/members", requireAuth, addTeamMember);
router.patch("/:teamId/members/:userId", requireAuth, updateTeamMemberRole);
router.delete("/:teamId/members/:userId", requireAuth, removeTeamMember);

export default router;
