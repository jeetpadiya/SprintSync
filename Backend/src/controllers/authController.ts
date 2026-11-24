import { Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { users, refreshTokens, workspaces, workspaceMembers } from "../db/schema.js";
import { ACCESS_COOKIE_OPTIONS, REFRESH_COOKIE_OPTIONS } from "../utils/cookieOptions.js";
import { registerSchema, loginSchema, updateProfileSchema } from "../utils/authSchemas.js";
import { AuthRequest } from "../middleware/authMiddleware.js";

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
        title: null,
        workspaces: [],
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



// Cost-12 dummy hash for constant-time comparison when email is not found
const DUMMY_HASH = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfYp01l.qM6Gv1y";

/**
 * POST /api/auth/login
 * 
 * Invariants Enforced:
 * 1. Normalized inputs & strict Zod validation
 * 2. Constant-time timing-attack prevention (executes dummy hash compare if user doesn't exist)
 * 3. Safe enumeration prevention (generic 401 INVALID_CREDENTIALS)
 * 4. Dual-token issuance (15m Access Token, 7d Refresh Token with Family Tracking)
 * 5. Refresh token hashed with SHA-256 before persisting to DB
 * 6. Tokens delivered exclusively via HttpOnly Set-Cookie headers (never in JSON body)
 * 7. Passwords/hashes strictly omitted from all responses
 */
export const login = async (req: Request, res: Response): Promise<void | Response> => {
  try {
    // 1. Validate & Normalize Input
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const { email, password } = parseResult.data;

    // 2. Lookup User
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // 3. Constant-time password verification (prevents timing attacks)
    const hashToCompare = user ? user.passwordHash : DUMMY_HASH;
    const isPasswordValid = await bcrypt.compare(password, hashToCompare);

    if (!user || !isPasswordValid) {
      return res.status(401).json({
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS",
      });
    }

    // 4. Issue Dual Tokens (Session Initialization)
    const { accessSecret, refreshSecret } = getSecrets();
    const familyId = crypto.randomUUID();

    // A. Short-Lived Access Token (15 minutes)
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
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
        sub: user.id,
        familyId,
      },
      refreshSecret,
      {
        algorithm: "HS256",
        expiresIn: "7d",
      }
    );

    // 5. Hash Refresh Token with SHA-256 before Database Persistence
    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash,
      familyId,
      userAgent: req.headers["user-agent"] || null,
      expiresAt,
    });

    // 6. Deliver Tokens Exclusively via HttpOnly Cookies
    res.cookie("access_token", accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie("refresh_token", refreshToken, REFRESH_COOKIE_OPTIONS);

    // 7. Fetch user's workspaces
    const userWorkspaces = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        slug: workspaces.slug,
        role: workspaceMembers.role,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
      .where(eq(workspaceMembers.userId, user.id));

    // 8. Respond with Sanitized User Profile (Tokens strictly omitted from JSON)
    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
        avatarUrl: user.avatarUrl,
        workspaces: userWorkspaces,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      error: "Internal server error during login",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * GET /api/auth/me
 * Protected endpoint to return the current authenticated user profile
 */
export const getMe = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        error: "Authentication required",
        code: "UNAUTHORIZED",
      });
    }

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        title: users.title,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    const userWorkspaces = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        slug: workspaces.slug,
        role: workspaceMembers.role,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
      .where(eq(workspaceMembers.userId, user.id));

    return res.status(200).json({
      success: true,
      user: {
        ...user,
        workspaces: userWorkspaces,
      },
    });
  } catch (error) {
    console.error("Get me error:", error);
    return res.status(500).json({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * PATCH /api/auth/profile
 * Updates user display name and title
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        error: "Authentication required",
        code: "UNAUTHORIZED",
      });
    }

    const parseResult = updateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const { name, title } = parseResult.data;

    const [updatedUser] = await db
      .update(users)
      .set({
        ...(name ? { name } : {}),
        ...(title !== undefined ? { title } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.user.id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        title: users.title,
        avatarUrl: users.avatarUrl,
      });

    const userWorkspaces = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        slug: workspaces.slug,
        role: workspaceMembers.role,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
      .where(eq(workspaceMembers.userId, req.user.id));

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        ...updatedUser,
        workspaces: userWorkspaces,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
};