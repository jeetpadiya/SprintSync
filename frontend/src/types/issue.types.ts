export type IssueStatus =
  | "BACKLOG"
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "DONE"
  | "CANCELED";

export type IssuePriority =
  | "NO_PRIORITY"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";

export type IssueRelationType =
  | "BLOCKS"
  | "BLOCKED_BY"
  | "DUPLICATE"
  | "RELATED";

export interface IssueReference {
  id: string;
  identifier: string;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
}

export interface IssueRelation {
  id: string;
  type: IssueRelationType;
  issue: IssueReference;
}

export interface Team {
  id: string;
  workspaceId: string;
  name: string;
  key: string;
  issueCounter: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Label {
  id: string;
  workspaceId?: string;
  name: string;
  color: string;
}

export interface IssueAssignee {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: string;
}

export interface Issue {
  id: string;
  number: number;
  identifier: string; // e.g. "ENG-101"
  title: string;
  description?: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  estimate?: number | null;
  sortOrder: number;
  teamId: string;
  team?: {
    id: string;
    name?: string;
    key: string;
  };
  assigneeId?: string | null;
  assignee?: IssueAssignee | null;
  creatorId?: string | null;
  labels?: Label[];
  projectId?: string | null;
  cycleId?: string | null;
  parentId?: string | null;
  parent?: IssueReference | null;
  subIssues?: IssueReference[];
  relations?: IssueRelation[];
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIssueInput {
  teamId: string;
  workspaceId?: string;
  title: string;
  description?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  estimate?: number | null;
  assigneeId?: string | null;
  projectId?: string | null;
  cycleId?: string | null;
  parentId?: string | null;
  dueDate?: string | null;
  labelIds?: string[];
}

export interface UpdateIssueInput {
  title?: string;
  description?: string | null;
  status?: IssueStatus;
  priority?: IssuePriority;
  estimate?: number | null;
  sortOrder?: number;
  assigneeId?: string | null;
  projectId?: string | null;
  cycleId?: string | null;
  parentId?: string | null;
  dueDate?: string | null;
  labelIds?: string[];
}
