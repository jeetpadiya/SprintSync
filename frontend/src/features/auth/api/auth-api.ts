import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/endpoints";
import {
  AuthResponse,
  LoginInput,
  RegisterInput,
  User,
} from "@/types/auth.types";

/**
 * Domain-specific Auth API methods
 */
export const authApi = {
  register: (input: RegisterInput): Promise<AuthResponse> => {
    return apiClient<AuthResponse>(ENDPOINTS.AUTH.REGISTER, {
      method: "POST",
      data: input,
    });
  },

  login: (input: LoginInput): Promise<AuthResponse> => {
    return apiClient<AuthResponse>(ENDPOINTS.AUTH.LOGIN, {
      method: "POST",
      data: input,
    });
  },

  logout: (): Promise<{ success: boolean; message: string }> => {
    return apiClient<{ success: boolean; message: string }>(ENDPOINTS.AUTH.LOGOUT, {
      method: "POST",
    });
  },

  logoutAll: (): Promise<{ success: boolean; message: string }> => {
    return apiClient<{ success: boolean; message: string }>(
      `${ENDPOINTS.AUTH.LOGOUT}-all`,
      {
        method: "POST",
      }
    );
  },

  getMe: (): Promise<{ success: boolean; user: User }> => {
    return apiClient<{ success: boolean; user: User }>(ENDPOINTS.AUTH.ME, {
      method: "GET",
    });
  },
};
