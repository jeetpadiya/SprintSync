export type CycleStatus = "UPCOMING" | "ACTIVE" | "COMPLETED";

export interface CycleMetrics {
  totalIssues: number;
  completedIssues: number;
  inProgressIssues: number;
  totalPoints: number;
  completedPoints: number;
  progressPercentage: number;
  pointsPercentage: number;
}

export interface Cycle {
  id: string;
  workspaceId: string;
  teamId: string;
  number: number;
  name: string;
  status: CycleStatus;
  startsAt: string;
  endsAt: string;
  completedPoints: number;
  totalPoints: number;
  completedIssuesCount: number;
  totalIssuesCount: number;
  createdAt: string;
  updatedAt: string;
  metrics?: CycleMetrics;
}

export interface CreateCycleInput {
  teamId: string;
  name?: string;
  status?: CycleStatus;
  startsAt?: string;
  endsAt?: string;
}

export interface CloseCycleResponse {
  success: boolean;
  closedCycle: Cycle;
  nextCycle: Cycle | null;
  rolledOverCount: number;
}
