import { Router } from "express";
import {
  getIssues,
  getIssueById,
  createIssue,
  updateIssue,
  deleteIssue,
  addIssueRelation,
  deleteIssueRelation,
} from "../controllers/issueController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// GET /api/issues (Protected)
router.get("/", requireAuth, getIssues);

// POST /api/issues (Protected)
router.post("/", requireAuth, createIssue);

// GET /api/issues/:id (Protected)
router.get("/:id", requireAuth, getIssueById);

// PATCH /api/issues/:id (Protected)
router.patch("/:id", requireAuth, updateIssue);

// DELETE /api/issues/:id (Protected)
router.delete("/:id", requireAuth, deleteIssue);

// POST /api/issues/:id/relations (Protected)
router.post("/:id/relations", requireAuth, addIssueRelation);

// DELETE /api/issues/:id/relations/:relationId (Protected)
router.delete("/:id/relations/:relationId", requireAuth, deleteIssueRelation);

export default router;
