import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// 1. Immutable User Context Attached to Authenticated Requests
export interface UserContext {
  readonly id: string;
  readonly email: string;
  readonly role?: string;
}

export interface AuthRequest extends Request {
  user?: UserContext;
}

// 2. Secret Resolution (Fail-fast validation)
const getJwtSecret = (): string => {
  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "FATAL: JWT access secret is not configured in environment variables."
    );
  }
  return secret;
};

/**
 * Authentication Middleware (requireAuth)
 * - Verifies identity only (stateless JWT signature check)
 * - Enforces HttpOnly cookie extraction ('access_token' with fallback to 'token')
 * - Fail-closed: Returns 401 for any missing, expired, or invalid token
 * - Zero unhandled exceptions
 */
export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void | Response => {
  // Step 1: Extract token from HttpOnly cookie
  const token = req.cookies?.access_token || req.cookies?.token;

  // Step 2: Guard - Fail-closed if token is missing
  if (!token) {
    return res.status(401).json({
      error: "Authentication required",
      code: "NO_TOKEN",
    });
  }

  // Step 3: Verify cryptographic signature and claims
  try {
    const secret = getJwtSecret();

    // Explicitly enforce algorithm to prevent 'alg: none' and downgrade attacks
    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    }) as jwt.JwtPayload;

    const userId = (decoded.sub || decoded.id) as string;
    const userEmail = decoded.email as string;

    if (!userId) {
      return res.status(401).json({
        error: "Invalid token payload: missing subject identifier",
        code: "INVALID_TOKEN",
      });
    }

    // Step 4: Attach minimal, immutable user context to request
    req.user = Object.freeze({
      id: userId,
      email: userEmail,
      ...(decoded.role ? { role: decoded.role as string } : {}),
    });

    // Step 5: Proceed to next middleware or route handler
    return next();
  } catch (error) {
    // Differentiate TokenExpiredError for silent client-side refresh triggers
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: "Token expired",
        code: "TOKEN_EXPIRED",
      });
    }

    // Generic response for signature mismatches or malformed tokens (no leaked crypto internals)
    return res.status(401).json({
      error: "Invalid authentication token",
      code: "INVALID_TOKEN",
    });
  }
};

/**
 * Authorization Middleware (requireRole)
 * - Strictly separated from authentication (identity verification)
 * - Validates role-based access rights (RBAC)
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        code: "NO_TOKEN",
      });
    }

    if (!req.user.role || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Forbidden: Insufficient permissions",
        code: "INSUFFICIENT_PERMISSIONS",
      });
    }

    return next();
  };
};

// Alias for backwards compatibility
export const authenticate = requireAuth;
