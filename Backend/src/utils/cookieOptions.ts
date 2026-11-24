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
