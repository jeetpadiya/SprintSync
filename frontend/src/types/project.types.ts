import { Issue } from "./issue.types";

export type ProjectStatus =
  | "PLANNED"
  | "IN_PROGRESS"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELED";

export interface ProjectProgress {
  totalIssues: number;
  completedIssues: number;
  inProgressIssues: number;
  progressPercentage: number;
}

export interface ProjectLead {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export interface Project {
  id: string;
  workspaceId: string;
  teamId?: string | null;
  name: string;
  summary?: string | null;
  description?: string | null;
  status: ProjectStatus;
  leadId?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  creatorId?: string | null;
  createdAt: string;
  updatedAt: string;
  team?: {
    id: string;
    name: string;
    key: string;
  } | null;
  lead?: ProjectLead | null;
  progress: ProjectProgress;
  issues?: Issue[];
}

export interface CreateProjectInput {
  name: string;
  summary?: string | null;
  description?: string | null;
  status?: ProjectStatus;
  teamId?: string | null;
  leadId?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
}

export interface UpdateProjectInput {
  name?: string;
  summary?: string | null;
  description?: string | null;
  status?: ProjectStatus;
  teamId?: string | null;
  leadId?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
}
