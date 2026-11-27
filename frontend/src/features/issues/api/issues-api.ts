import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/endpoints";
import {
  Issue,
  CreateIssueInput,
  UpdateIssueInput,
  Team,
  TeamMember,
  TeamMemberRole,
  Label,
  IssueRelation,
  IssueRelationType,
} from "@/types/issue.types";

export const issuesApi = {
  getIssues: (filters?: Record<string, string>): Promise<{ success: boolean; issues: Issue[] }> => {
    let url: string = ENDPOINTS.ISSUES;
    if (filters && Object.keys(filters).length > 0) {
      const searchParams = new URLSearchParams(filters);
      url = `${url}?${searchParams.toString()}`;
    }
    return apiClient<{ success: boolean; issues: Issue[] }>(url, {
      method: "GET",
    });
  },

  getIssueById: (id: string): Promise<{ success: boolean; issue: Issue }> => {
    return apiClient<{ success: boolean; issue: Issue }>(`${ENDPOINTS.ISSUES}/${id}`, {
      method: "GET",
    });
  },

  createIssue: (data: CreateIssueInput): Promise<{ success: boolean; issue: Issue }> => {
    return apiClient<{ success: boolean; issue: Issue }>(ENDPOINTS.ISSUES, {
      method: "POST",
      data,
    });
  },

  updateIssue: (id: string, data: UpdateIssueInput): Promise<{ success: boolean; issue: Issue }> => {
    return apiClient<{ success: boolean; issue: Issue }>(`${ENDPOINTS.ISSUES}/${id}`, {
      method: "PATCH",
      data,
    });
  },

  deleteIssue: (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient<{ success: boolean; message: string }>(`${ENDPOINTS.ISSUES}/${id}`, {
      method: "DELETE",
    });
  },

  addRelation: (
    issueId: string,
    data: { targetIssueId: string; type: IssueRelationType }
  ): Promise<{ success: boolean; relation: IssueRelation }> => {
    return apiClient<{ success: boolean; relation: IssueRelation }>(
      `${ENDPOINTS.ISSUES}/${issueId}/relations`,
      {
        method: "POST",
        data,
      }
    );
  },

  deleteRelation: (
    issueId: string,
    relationId: string
  ): Promise<{ success: boolean; message: string }> => {
    return apiClient<{ success: boolean; message: string }>(
      `${ENDPOINTS.ISSUES}/${issueId}/relations/${relationId}`,
      {
        method: "DELETE",
      }
    );
  },

  getTeams: (workspaceId?: string): Promise<{ success: boolean; teams: Team[] }> => {
    const url = workspaceId
      ? `${ENDPOINTS.TEAMS}?workspaceId=${workspaceId}`
      : ENDPOINTS.TEAMS;
    return apiClient<{ success: boolean; teams: Team[] }>(url, {
      method: "GET",
    });
  },

  createTeam: (data: {
    name: string;
    key: string;
    workspaceId?: string;
  }): Promise<{ success: boolean; team: Team }> => {
    return apiClient<{ success: boolean; team: Team }>(ENDPOINTS.TEAMS, {
      method: "POST",
      data,
    });
  },

  getTeamMembers: (
    teamId: string
  ): Promise<{ success: boolean; members: TeamMember[] }> => {
    return apiClient<{ success: boolean; members: TeamMember[] }>(
      `${ENDPOINTS.TEAMS}/${teamId}/members`,
      {
        method: "GET",
      }
    );
  },

  addTeamMember: (
    teamId: string,
    data: { userId: string; role?: TeamMemberRole }
  ): Promise<{ success: boolean; member: TeamMember }> => {
    return apiClient<{ success: boolean; member: TeamMember }>(
      `${ENDPOINTS.TEAMS}/${teamId}/members`,
      {
        method: "POST",
        data,
      }
    );
  },

  updateTeamMemberRole: (
    teamId: string,
    userId: string,
    role: TeamMemberRole
  ): Promise<{ success: boolean; member: TeamMember }> => {
    return apiClient<{ success: boolean; member: TeamMember }>(
      `${ENDPOINTS.TEAMS}/${teamId}/members/${userId}`,
      {
        method: "PATCH",
        data: { role },
      }
    );
  },

  removeTeamMember: (
    teamId: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> => {
    return apiClient<{ success: boolean; message: string }>(
      `${ENDPOINTS.TEAMS}/${teamId}/members/${userId}`,
      {
        method: "DELETE",
      }
    );
  },

  getLabels: (workspaceId?: string): Promise<{ success: boolean; labels: Label[] }> => {
    const url = workspaceId
      ? `${ENDPOINTS.LABELS}?workspaceId=${workspaceId}`
      : ENDPOINTS.LABELS;
    return apiClient<{ success: boolean; labels: Label[] }>(url, {
      method: "GET",
    });
  },
};
