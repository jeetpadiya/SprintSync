import { Response } from "express";

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

// Lightweight non-secret marker on '/' so Next.js proxy knows a 7-day session exists
// even when the 15-minute access_token cookie has expired.
export const SESSION_HINT_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * Clears all authentication cookies using the exact path/security flags they were set with.
 */
export function clearAuthCookies(res: Response): void {
  const { maxAge: _a, ...accessClearOpts } = ACCESS_COOKIE_OPTIONS;
  const { maxAge: _r, ...refreshClearOpts } = REFRESH_COOKIE_OPTIONS;
  const { maxAge: _s, ...hintClearOpts } = SESSION_HINT_COOKIE_OPTIONS;

  res.clearCookie("access_token", accessClearOpts);
  res.clearCookie("refresh_token", refreshClearOpts);
  res.clearCookie("has_session", hintClearOpts);
}
