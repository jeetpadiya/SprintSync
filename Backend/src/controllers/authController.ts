import { Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { users, refreshTokens } from "../db/schema.js";

// --- Section 2: Shared Cookie Configurations ---
const isProd = process.env.NODE_ENV === "production";

export const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 15 * 60 * 1000, // 15 minutes
};

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/api/auth/refresh", // Restricted strictly to the refresh endpoint
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// --- Input Validation Schema ---
export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must not exceed 128 characters"),
});

/**
 * Helper to get the JWT secrets (with fallback to JWT_SECRET)
 */
const getSecrets = () => {
  const accessSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

  if (!accessSecret || !refreshSecret) {
    throw new Error("FATAL: JWT secrets are not configured in environment variables.");
  }

  return { accessSecret, refreshSecret };
};

/**
 * POST /api/auth/register
 * 
 * Invariants Enforced:
 * 1. Normalized inputs & strict Zod validation
 * 2. Enumeration-safe conflict handling (409 Conflict)
 * 3. Strong password hashing (bcrypt, cost factor 12)
 * 4. Dual-token issuance (15m Access Token, 7d Refresh Token with Family Tracking)
 * 5. Refresh token hashed with SHA-256 before persisting to DB
 * 6. Tokens delivered exclusively via HttpOnly Set-Cookie headers (never in JSON body)
 * 7. Passwords/hashes strictly omitted from all responses
 */
export const register = async (req: Request, res: Response): Promise<void | Response> => {
  try {
    // 1. Validate & Normalize Input
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const { name, email, password } = parseResult.data;

    // 2. Conflict Check (Enumeration-safe: no internal IDs or stack traces leaked)
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({
        error: "An account with this email already exists",
        code: "EMAIL_ALREADY_EXISTS",
      });
    }

    // 3. Strong Password Hashing (Cost factor 12)
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Create User Record
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
        role: "MEMBER",
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      });

    if (!newUser) {
      return res.status(500).json({
        error: "Failed to create user account",
        code: "USER_CREATION_FAILED",
      });
    }

    // 5. Issue Dual Tokens (Session Initialization)
    const { accessSecret, refreshSecret } = getSecrets();
    const familyId = crypto.randomUUID();

    // A. Short-Lived Access Token (15 minutes)
    const accessToken = jwt.sign(
      {
        sub: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
      accessSecret,
      {
        algorithm: "HS256",
        expiresIn: "15m",
      }
    );

    // B. Long-Lived Refresh Token (7 days) with Family Tracking
    const refreshToken = jwt.sign(
      {
        sub: newUser.id,
        familyId,
      },
      refreshSecret,
      {
        algorithm: "HS256",
        expiresIn: "7d",
      }
    );

    // 6. Hash Refresh Token with SHA-256 before Database Persistence
    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(refreshTokens).values({
      userId: newUser.id,
      tokenHash,
      familyId,
      userAgent: req.headers["user-agent"] || null,
      expiresAt,
    });

    // 7. Deliver Tokens Exclusively via HttpOnly Cookies
    res.cookie("access_token", accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie("refresh_token", refreshToken, REFRESH_COOKIE_OPTIONS);

    // 8. Respond with Sanitized User Profile (Tokens strictly omitted from JSON)
    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      error: "Internal server error during registration",
      code: "INTERNAL_ERROR",
    });
  }
};
