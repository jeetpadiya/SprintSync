import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/endpoints";
import { User } from "@/types/auth.types";

export const profileApi = {
  update: (data: { name: string; title?: string }): Promise<{ success: boolean; user: User }> => {
    return apiClient<{ success: boolean; user: User }>(ENDPOINTS.AUTH.PROFILE, {
      method: "PATCH",
      data,
    });
  },
};
