import { Router } from "express";
import { getLabels } from "../controllers/labelController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// GET /api/labels (Protected)
router.get("/", requireAuth, getLabels);

export default router;
