/**
 * Centralized API endpoints registry.
 * Uses same-origin `/api` (proxied via next.config.ts rewrites) by default so HttpOnly cookies
 * attach consistently across localhost, 127.0.0.1, and Next.js proxy.ts.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "/api";

export const ENDPOINTS = {
  AUTH: {
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGIN: `${API_BASE_URL}/auth/login`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
    ME: `${API_BASE_URL}/auth/me`,
    PROFILE: `${API_BASE_URL}/auth/profile`,
  },
  WORKSPACES: {
    CREATE: `${API_BASE_URL}/workspaces`,
    MEMBERS: `${API_BASE_URL}/workspaces/members`,
    INVITE: `${API_BASE_URL}/workspaces/invite`,
  },
  TEAMS: `${API_BASE_URL}/teams`,
  ISSUES: `${API_BASE_URL}/issues`,
  LABELS: `${API_BASE_URL}/labels`,
  DOCUMENTS: `${API_BASE_URL}/documents`,
  HEALTH: `${API_BASE_URL}/health`,
  USERS: `${API_BASE_URL}/users`,
} as const;
