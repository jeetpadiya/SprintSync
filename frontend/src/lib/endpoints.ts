/**
 * Centralized API endpoints registry.
 * All API routes across domains are registered here.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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
    INVITE: `${API_BASE_URL}/workspaces/invite`,
  },
  HEALTH: `${API_BASE_URL}/health`,
  USERS: `${API_BASE_URL}/users`,
} as const;
