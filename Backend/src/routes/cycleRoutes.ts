import { Router } from "express";
import {
  closeCycle,
  createCycle,
  getCycles,
  updateCycle,
} from "../controllers/cycleController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", requireAuth, getCycles);
router.post("/", requireAuth, createCycle);
router.patch("/:id", requireAuth, updateCycle);
router.post("/:id/close", requireAuth, closeCycle);

export default router;
