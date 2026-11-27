import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/endpoints";
import {
  CreateProjectInput,
  Project,
  UpdateProjectInput,
} from "@/types/project.types";

export const projectsApi = {
  getProjects: (
    workspaceId?: string
  ): Promise<{ success: boolean; projects: Project[] }> => {
    const url = workspaceId
      ? `${ENDPOINTS.PROJECTS}?workspaceId=${workspaceId}`
      : ENDPOINTS.PROJECTS;
    return apiClient<{ success: boolean; projects: Project[] }>(url, {
      method: "GET",
    });
  },

  getProjectById: (
    id: string
  ): Promise<{ success: boolean; project: Project }> => {
    return apiClient<{ success: boolean; project: Project }>(
      `${ENDPOINTS.PROJECTS}/${id}`,
      { method: "GET" }
    );
  },

  createProject: (
    data: CreateProjectInput
  ): Promise<{ success: boolean; project: Project }> => {
    return apiClient<{ success: boolean; project: Project }>(
      ENDPOINTS.PROJECTS,
      {
        method: "POST",
        data,
      }
    );
  },

  updateProject: (
    id: string,
    data: UpdateProjectInput
  ): Promise<{ success: boolean; project: Project }> => {
    return apiClient<{ success: boolean; project: Project }>(
      `${ENDPOINTS.PROJECTS}/${id}`,
      {
        method: "PATCH",
        data,
      }
    );
  },

  deleteProject: (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    return apiClient<{ success: boolean; message: string }>(
      `${ENDPOINTS.PROJECTS}/${id}`,
      { method: "DELETE" }
    );
  },
};
