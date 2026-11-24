import { ApiErrorResponse } from "@/types/auth.types";

interface RequestOptions extends RequestInit {
  data?: unknown;
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

/**
 * Centralized HTTP Client
 * - Enforces credentials: "include" for HttpOnly cookies
 * - Automatically serializes JSON payloads
 * - Normalizes error messages and status codes
 */
export async function apiClient<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { data, headers, ...rest } = options;

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
