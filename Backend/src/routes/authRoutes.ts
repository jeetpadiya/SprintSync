import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  getMe,
  updateProfile,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/refresh
router.post("/refresh", refresh);

// POST /api/auth/logout
router.post("/logout", logout);

// POST /api/auth/logout-all (Protected)
router.post("/logout-all", requireAuth, logoutAll);

// GET /api/auth/me (Protected)
router.get("/me", requireAuth, getMe);

// PATCH /api/auth/profile (Protected)
router.patch("/profile", requireAuth, updateProfile);

export default router;
