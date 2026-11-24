import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/endpoints";

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
};
