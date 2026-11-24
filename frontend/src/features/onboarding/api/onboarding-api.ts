import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/endpoints";
import { User } from "@/types/auth.types";

export interface SendInvitesResponse {
  success: boolean;
  message?: string;
  count: number;
}

export const onboardingApi = {
  updateProfile: (data: { name: string; title?: string }): Promise<{ success: boolean; user: User }> => {
    return apiClient<{ success: boolean; user: User }>(ENDPOINTS.AUTH.PROFILE, {
      method: "PATCH",
      data,
    });
  },

  sendInvites: (data: { emails: string[]; workspaceId?: string }): Promise<SendInvitesResponse> => {
    return apiClient<SendInvitesResponse>(ENDPOINTS.WORKSPACES.INVITE, {
      method: "POST",
      data,
    });
  },
};
