import { Router } from "express";
import { getTeams, createTeam } from "../controllers/teamController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// GET /api/teams (Protected)
router.get("/", requireAuth, getTeams);

// POST /api/teams (Protected)
router.post("/", requireAuth, createTeam);

export default router;
