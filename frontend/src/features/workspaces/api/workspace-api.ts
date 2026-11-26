import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/endpoints";
import { WorkspaceMember } from "@/types/issue.types";

export interface CreateWorkspaceInput {
  name: string;
  slug: string;
  region: "europe" | "asia";
}

export interface WorkspaceResponse {
  success: boolean;
  message: string;
  workspace: {
    id: string;
    name: string;
    slug: string;
    region: string;
    createdAt: string;
  };
}

export const workspaceApi = {
  create: (input: CreateWorkspaceInput): Promise<WorkspaceResponse> => {
    return apiClient<WorkspaceResponse>(ENDPOINTS.WORKSPACES.CREATE, {
      method: "POST",
      data: input,
    });
  },

  getMembers: (
    workspaceId?: string
  ): Promise<{ success: boolean; members: WorkspaceMember[] }> => {
    const url = workspaceId
      ? `${ENDPOINTS.WORKSPACES.MEMBERS}?workspaceId=${workspaceId}`
      : ENDPOINTS.WORKSPACES.MEMBERS;
    return apiClient<{ success: boolean; members: WorkspaceMember[] }>(url, {
      method: "GET",
    });
  },
};
