import { Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { and, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import {
  users,
  refreshTokens,
  workspaces,
  workspaceMembers,
  workspaceInvitations,
} from "../db/schema.js";
import {
  ACCESS_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
  SESSION_HINT_COOKIE_OPTIONS,
  clearAuthCookies,
} from "../utils/cookieOptions.js";
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

interface IssueTokensParams {
  res: Response;
  user: { id: string; email: string; role: string };
  familyId?: string;
  userAgent: string | null;
}

/**
 * Issues an access + refresh JWT pair, persists the SHA-256 refresh token hash,
 * and attaches HttpOnly cookies to the response.
 */
const issueSessionTokens = async ({
  res,
  user,
  familyId = crypto.randomUUID(),
  userAgent,
}: IssueTokensParams): Promise<void> => {
  const { accessSecret, refreshSecret } = getSecrets();

  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti: crypto.randomUUID(),
    },
    accessSecret,
    {
      algorithm: "HS256",
      expiresIn: "15m",
    }
  );

  const refreshToken = jwt.sign(
    {
      sub: user.id,
      familyId,
      jti: crypto.randomUUID(),
    },
    refreshSecret,
    {
      algorithm: "HS256",
      expiresIn: "7d",
    }
  );

  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash,
    familyId,
    userAgent,
    expiresAt,
  });

  res.cookie("access_token", accessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie("refresh_token", refreshToken, REFRESH_COOKIE_OPTIONS);
  res.cookie("has_session", "1", SESSION_HINT_COOKIE_OPTIONS);
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

    // 4b. Auto-accept any pending workspace invitations for this email
    const pendingInvites = await db
      .select({
        id: workspaceInvitations.id,
        workspaceId: workspaceInvitations.workspaceId,
        role: workspaceInvitations.role,
      })
      .from(workspaceInvitations)
      .where(eq(workspaceInvitations.email, email));

    if (pendingInvites.length > 0) {
      const seenWorkspaceIds = new Set<string>();
      const memberRows = pendingInvites
        .filter((inv) => {
          if (seenWorkspaceIds.has(inv.workspaceId)) return false;
          seenWorkspaceIds.add(inv.workspaceId);
          return true;
        })
        .map((inv) => ({
          workspaceId: inv.workspaceId,
          userId: newUser.id,
          role: inv.role || "MEMBER",
        }));

      await db.insert(workspaceMembers).values(memberRows);
      await db
        .delete(workspaceInvitations)
        .where(eq(workspaceInvitations.email, email));
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
      .where(eq(workspaceMembers.userId, newUser.id));

    // 5. Issue Dual Tokens (Session Initialization) & Set HttpOnly Cookies
    await issueSessionTokens({
      res,
      user: { id: newUser.id, email: newUser.email, role: newUser.role },
      userAgent: req.headers["user-agent"] || null,
    });

    // 6. Respond with Sanitized User Profile (Tokens strictly omitted from JSON)
    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        title: null,
        workspaces: userWorkspaces,
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

    // 4. Issue Dual Tokens (Session Initialization) & Set HttpOnly Cookies
    await issueSessionTokens({
      res,
      user: { id: user.id, email: user.email, role: user.role },
      userAgent: req.headers["user-agent"] || null,
    });

    // 5. Fetch user's workspaces
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
 * POST /api/auth/refresh
 * Rotates the refresh token with reuse detection and issues a fresh access_token + refresh_token pair.
 */
export const refresh = async (req: Request, res: Response): Promise<void | Response> => {
  try {
    const incomingToken = req.cookies?.refresh_token as string | undefined;

    if (!incomingToken) {
      clearAuthCookies(res);
      return res.status(401).json({
        error: "Refresh token required",
        code: "NO_REFRESH_TOKEN",
      });
    }

    const { refreshSecret } = getSecrets();
    let decoded: jwt.JwtPayload;

    try {
      decoded = jwt.verify(incomingToken, refreshSecret, {
        algorithms: ["HS256"],
      }) as jwt.JwtPayload;
    } catch (err) {
      clearAuthCookies(res);
      if (err instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          error: "Refresh token expired",
          code: "REFRESH_TOKEN_EXPIRED",
        });
      }
      return res.status(401).json({
        error: "Invalid refresh token",
        code: "INVALID_REFRESH_TOKEN",
      });
    }

    const userId = decoded.sub as string | undefined;
    const familyId = decoded.familyId as string | undefined;

    if (!userId || !familyId) {
      clearAuthCookies(res);
      return res.status(401).json({
        error: "Invalid refresh token payload",
        code: "INVALID_REFRESH_TOKEN",
      });
    }

    const tokenHash = crypto.createHash("sha256").update(incomingToken).digest("hex");

    const [existingToken] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .limit(1);

    // Reuse detection: missing record or already revoked token -> revoke entire token family
    if (!existingToken || existingToken.revoked) {
      await db
        .update(refreshTokens)
        .set({ revoked: true })
        .where(eq(refreshTokens.familyId, existingToken?.familyId || familyId));

      clearAuthCookies(res);
      return res.status(401).json({
        error: "Refresh token reuse detected",
        code: "TOKEN_REUSE_DETECTED",
      });
    }

    if (existingToken.expiresAt <= new Date()) {
      await db
        .update(refreshTokens)
        .set({ revoked: true })
        .where(eq(refreshTokens.id, existingToken.id));

      clearAuthCookies(res);
      return res.status(401).json({
        error: "Refresh token expired",
        code: "REFRESH_TOKEN_EXPIRED",
      });
    }

    // Atomically claim the current refresh token so concurrent requests cannot double-rotate
    const [claimedToken] = await db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(and(eq(refreshTokens.id, existingToken.id), eq(refreshTokens.revoked, false)))
      .returning({ id: refreshTokens.id });

    if (!claimedToken) {
      await db
        .update(refreshTokens)
        .set({ revoked: true })
        .where(eq(refreshTokens.familyId, existingToken.familyId));

      clearAuthCookies(res);
      return res.status(401).json({
        error: "Refresh token reuse detected",
        code: "TOKEN_REUSE_DETECTED",
      });
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, existingToken.userId))
      .limit(1);

    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({
        error: "User account not found",
        code: "USER_NOT_FOUND",
      });
    }

    await issueSessionTokens({
      res,
      user,
      familyId: existingToken.familyId,
      userAgent: req.headers["user-agent"] || null,
    });

    return res.status(200).json({
      success: true,
      authenticated: true,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return res.status(500).json({
      error: "Internal server error during token refresh",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * POST /api/auth/logout
 * Revokes the current refresh token and clears all auth cookies.
 */
export const logout = async (req: Request, res: Response): Promise<void | Response> => {
  try {
    const incomingToken = req.cookies?.refresh_token as string | undefined;

    if (incomingToken) {
      const tokenHash = crypto.createHash("sha256").update(incomingToken).digest("hex");
      await db
        .update(refreshTokens)
        .set({ revoked: true })
        .where(eq(refreshTokens.tokenHash, tokenHash));
    }

    clearAuthCookies(res);
    return res.status(200).json({
      success: true,
      message: "Logged out",
    });
  } catch (error) {
    console.error("Logout error:", error);
    clearAuthCookies(res);
    return res.status(200).json({
      success: true,
      message: "Logged out",
    });
  }
};

/**
 * POST /api/auth/logout-all
 * Revokes every refresh token belonging to the authenticated user.
 */
export const logoutAll = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        error: "Authentication required",
        code: "UNAUTHORIZED",
      });
    }

    await db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.userId, req.user.id));

    clearAuthCookies(res);
    return res.status(200).json({
      success: true,
      message: "Logged out from all sessions",
    });
  } catch (error) {
    console.error("Logout all error:", error);
    return res.status(500).json({
      error: "Internal server error during logout",
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