"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { issuesApi } from "@/features/issues/api/issues-api";
import { workspaceApi } from "@/features/workspaces/api/workspace-api";
import {
  CreateIssueInput,
  Issue,
  IssueRelationType,
  TeamMemberRole,
  UpdateIssueInput,
} from "@/types/issue.types";

export const issueKeys = {
  all: ["issues"] as const,
  lists: () => [...issueKeys.all, "list"] as const,
  list: (filters?: Record<string, string>) =>
    [...issueKeys.lists(), filters ?? {}] as const,
  details: () => [...issueKeys.all, "detail"] as const,
  detail: (id: string) => [...issueKeys.details(), id] as const,
  teams: (workspaceId?: string) => ["teams", workspaceId ?? "default"] as const,
  teamMembers: (teamId: string) => ["team-members", teamId] as const,
  labels: (workspaceId?: string) => ["labels", workspaceId ?? "default"] as const,
  members: (workspaceId?: string) =>
    ["workspace-members", workspaceId ?? "default"] as const,
};

export function useIssues(filters?: Record<string, string>, enabled = true) {
  return useQuery({
    queryKey: issueKeys.list(filters),
    queryFn: async () => {
      const res = await issuesApi.getIssues(filters);
      return res.issues ?? [];
    },
    enabled,
  });
}

export function useIssue(id: string | null, enabled = true) {
  return useQuery({
    queryKey: issueKeys.detail(id ?? ""),
    queryFn: async () => {
      const res = await issuesApi.getIssueById(id!);
      return res.issue;
    },
    enabled: Boolean(id) && enabled,
  });
}

export function useTeams(workspaceId?: string, enabled = true) {
  return useQuery({
    queryKey: issueKeys.teams(workspaceId),
    queryFn: async () => {
      const res = await issuesApi.getTeams(workspaceId);
      return res.teams ?? [];
    },
    enabled,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; key: string; workspaceId?: string }) =>
      issuesApi.createTeam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Team created");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create team");
    },
  });
}

export function useTeamMembers(teamId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: issueKeys.teamMembers(teamId ?? ""),
    queryFn: async () => {
      const res = await issuesApi.getTeamMembers(teamId!);
      return res.members ?? [];
    },
    enabled: Boolean(teamId) && enabled,
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      teamId,
      userId,
      role,
    }: {
      teamId: string;
      userId: string;
      role?: TeamMemberRole;
    }) => issuesApi.addTeamMember(teamId, { userId, role }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: issueKeys.teamMembers(variables.teamId),
      });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Member added to team");
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to add team member"
      );
    },
  });
}

export function useUpdateTeamMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      teamId,
      userId,
      role,
    }: {
      teamId: string;
      userId: string;
      role: TeamMemberRole;
    }) => issuesApi.updateTeamMemberRole(teamId, userId, role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: issueKeys.teamMembers(variables.teamId),
      });
      toast.success("Team role updated");
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to update team role"
      );
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      issuesApi.removeTeamMember(teamId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: issueKeys.teamMembers(variables.teamId),
      });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Member removed from team");
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove team member"
      );
    },
  });
}

export function useLabels(workspaceId?: string, enabled = true) {
  return useQuery({
    queryKey: issueKeys.labels(workspaceId),
    queryFn: async () => {
      const res = await issuesApi.getLabels(workspaceId);
      return res.labels ?? [];
    },
    enabled,
  });
}

export function useWorkspaceMembers(workspaceId?: string, enabled = true) {
  return useQuery({
    queryKey: issueKeys.members(workspaceId),
    queryFn: async () => {
      const res = await workspaceApi.getMembers(workspaceId);
      return res.members ?? [];
    },
    enabled,
  });
}

export function useCreateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateIssueInput) => issuesApi.createIssue(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["cycles"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create issue");
    },
  });
}

export function useUpdateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIssueInput }) =>
      issuesApi.updateIssue(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: issueKeys.all });
      const previousLists = queryClient.getQueriesData<Issue[]>({
        queryKey: issueKeys.lists(),
      });
      const previousDetail = queryClient.getQueryData<Issue>(
        issueKeys.detail(id)
      );

      queryClient.setQueriesData<Issue[]>(
        { queryKey: issueKeys.lists() },
        (old) =>
          old?.map((issue) =>
            issue.id === id
              ? {
                  ...issue,
                  ...(data.title !== undefined ? { title: data.title } : {}),
                  ...(data.description !== undefined
                    ? { description: data.description }
                    : {}),
                  ...(data.status !== undefined ? { status: data.status } : {}),
                  ...(data.priority !== undefined
                    ? { priority: data.priority }
                    : {}),
                  ...(data.estimate !== undefined
                    ? { estimate: data.estimate }
                    : {}),
                  ...(data.sortOrder !== undefined
                    ? { sortOrder: data.sortOrder }
                    : {}),
                  ...(data.assigneeId !== undefined
                    ? { assigneeId: data.assigneeId }
                    : {}),
                  ...(data.projectId !== undefined
                    ? { projectId: data.projectId }
                    : {}),
                  ...(data.cycleId !== undefined
                    ? { cycleId: data.cycleId }
                    : {}),
                  ...(data.parentId !== undefined
                    ? { parentId: data.parentId }
                    : {}),
                  ...(data.dueDate !== undefined
                    ? { dueDate: data.dueDate }
                    : {}),
                }
              : issue
          ) ?? old
      );

      if (previousDetail) {
        queryClient.setQueryData<Issue>(issueKeys.detail(id), {
          ...previousDetail,
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.description !== undefined
            ? { description: data.description }
            : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.priority !== undefined ? { priority: data.priority } : {}),
          ...(data.estimate !== undefined ? { estimate: data.estimate } : {}),
          ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
          ...(data.assigneeId !== undefined
            ? { assigneeId: data.assigneeId }
            : {}),
          ...(data.projectId !== undefined
            ? { projectId: data.projectId }
            : {}),
          ...(data.cycleId !== undefined
            ? { cycleId: data.cycleId }
            : {}),
          ...(data.parentId !== undefined ? { parentId: data.parentId } : {}),
          ...(data.dueDate !== undefined ? { dueDate: data.dueDate } : {}),
        });
      }

      return { previousLists, previousDetail };
    },
    onError: (_err, { id }, context) => {
      context?.previousLists.forEach(([key, snapshot]) => {
        queryClient.setQueryData(key, snapshot);
      });
      if (context?.previousDetail) {
        queryClient.setQueryData(issueKeys.detail(id), context.previousDetail);
      }
      toast.error("Failed to update issue");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["cycles"] });
    },
  });
}

export function useDeleteIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => issuesApi.deleteIssue(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: issueKeys.lists() });
      const previous = queryClient.getQueriesData<Issue[]>({
        queryKey: issueKeys.lists(),
      });

      queryClient.setQueriesData<Issue[]>(
        { queryKey: issueKeys.lists() },
        (old) => old?.filter((issue) => issue.id !== id) ?? old
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      context?.previous.forEach(([key, snapshot]) => {
        queryClient.setQueryData(key, snapshot);
      });
      toast.error("Failed to delete issue");
    },
    onSuccess: () => {
      toast.success("Issue deleted");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["cycles"] });
    },
  });
}

export function useAddIssueRelation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      issueId,
      targetIssueId,
      type,
    }: {
      issueId: string;
      targetIssueId: string;
      type: IssueRelationType;
    }) => issuesApi.addRelation(issueId, { targetIssueId, type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
      toast.success("Relation linked");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to link relation");
    },
  });
}

export function useDeleteIssueRelation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      issueId,
      relationId,
    }: {
      issueId: string;
      relationId: string;
    }) => issuesApi.deleteRelation(issueId, relationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
      toast.success("Relation removed");
    },
    onError: () => {
      toast.error("Failed to remove relation");
    },
  });
}
