import { ApiErrorResponse } from "@/types/auth.types";
import { ENDPOINTS } from "@/lib/endpoints";
import { useAuthStore } from "@/store/useAuthStore";

interface RequestOptions extends RequestInit {
  data?: unknown;
  _retry?: boolean;
}

export class ApiError extends Error {
  code?: string;
  status: number;
  details?: Record<string, string[]>;

  constructor(status: number, message: string, code?: string, details?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Shared in-flight refresh promise so concurrent 401 responses trigger only one /refresh call
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(ENDPOINTS.AUTH.REFRESH, {
      method: "POST",
      credentials: "include",
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function shouldAttemptRefresh(url: string, status: number, hasRetried?: boolean): boolean {
  if (status !== 401 || hasRetried) return false;

  return (
    !url.includes("/auth/login") &&
    !url.includes("/auth/register") &&
    !url.includes("/auth/refresh") &&
    !url.includes("/auth/logout")
  );
}

/**
 * Centralized HTTP Client
 * - Enforces credentials: "include" for HttpOnly cookies
 * - Automatically serializes JSON payloads
 * - Silently rotates expired access tokens on 401 and retries once
 * - Normalizes error messages and status codes
 */
export async function apiClient<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { data, headers, _retry, ...rest } = options;

  const config: RequestInit = {
    ...rest,
    credentials: "include", // Ensures HttpOnly cookies are passed
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (data !== undefined) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(url, config);

  if (shouldAttemptRefresh(url, response.status, _retry)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiClient<T>(url, { ...options, _retry: true });
    }
    useAuthStore.getState().clearAuth();
  }

  let responseData: any = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    responseData = await response.json().catch(() => null);
  }

  if (!response.ok) {
    const errorBody: ApiErrorResponse = responseData || {};
    const errorMessage =
      errorBody.error || errorBody.message || `Request failed with status ${response.status}`;
    throw new ApiError(response.status, errorMessage, errorBody.code, errorBody.details);
  }

  return responseData as T;
}
