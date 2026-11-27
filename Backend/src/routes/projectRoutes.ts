import { Router } from "express";
import {
  createProject,
  deleteProject,
  getProjectById,
  getProjects,
  updateProject,
} from "../controllers/projectController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", requireAuth, getProjects);
router.post("/", requireAuth, createProject);
router.get("/:id", requireAuth, getProjectById);
router.patch("/:id", requireAuth, updateProject);
router.delete("/:id", requireAuth, deleteProject);

export default router;
