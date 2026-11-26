import { Router } from "express";
import {
  createDocument,
  deleteDocument,
  getDocumentById,
  getDocuments,
  updateDocument,
} from "../controllers/documentController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", requireAuth, getDocuments);
router.post("/", requireAuth, createDocument);
router.get("/:id", requireAuth, getDocumentById);
router.patch("/:id", requireAuth, updateDocument);
router.delete("/:id", requireAuth, deleteDocument);

export default router;
