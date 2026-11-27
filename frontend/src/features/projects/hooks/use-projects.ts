"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { projectsApi } from "../api/projects-api";
import { CreateProjectInput, UpdateProjectInput } from "@/types/project.types";
import { issueKeys } from "@/features/issues/hooks/use-issues";

export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  detail: (id: string) => [...projectKeys.all, "detail", id] as const,
};

export function useProjects(workspaceId?: string, enabled = true) {
  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: async () => {
      const res = await projectsApi.getProjects(workspaceId);
      return res.projects ?? [];
    },
    enabled,
  });
}

export function useProject(id: string | null, enabled = true) {
  return useQuery({
    queryKey: projectKeys.detail(id ?? ""),
    queryFn: async () => {
      const res = await projectsApi.getProjectById(id!);
      return res.project;
    },
    enabled: Boolean(id) && enabled,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectInput) => projectsApi.createProject(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      toast.success("Project created");
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to create project"
      );
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectInput }) =>
      projectsApi.updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to update project"
      );
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectsApi.deleteProject(id),
    onSuccess: (_res, id) => {
      queryClient.removeQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
      toast.success("Project deleted");
    },
    onError: () => {
      toast.error("Failed to delete project");
    },
  });
}
