import { z } from "zod";

export const issueStatusEnum = z.enum([
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
  "CANCELED",
]);

export const issuePriorityEnum = z.enum([
  "NO_PRIORITY",
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
]);

export const issueRelationTypeEnum = z.enum([
  "BLOCKS",
  "BLOCKED_BY",
  "DUPLICATE",
  "RELATED",
]);

export const createIssueRelationSchema = z.object({
  targetIssueId: z.string().uuid("Valid target issue ID is required"),
  type: issueRelationTypeEnum,
});

export const createTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Team name must be at least 2 characters")
    .max(100, "Team name must not exceed 100 characters"),
  key: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, "Team identifier must be at least 2 characters")
    .max(10, "Team identifier must not exceed 10 characters")
    .regex(/^[A-Z0-9]+$/, "Team identifier must only contain uppercase letters and numbers"),
  workspaceId: z.string().uuid().optional(),
});

export const createIssueSchema = z.object({
  teamId: z.string().uuid("Valid team ID is required"),
  workspaceId: z.string().uuid().optional(),
  title: z
    .string()
    .trim()
    .min(1, "Issue title is required")
    .max(255, "Issue title must not exceed 255 characters"),
  description: z.string().trim().optional(),
  status: issueStatusEnum.default("TODO"),
  priority: issuePriorityEnum.default("NO_PRIORITY"),
  estimate: z.number().int().min(0).max(100).nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  labelIds: z.array(z.string().uuid()).optional(),
});

export const updateIssueSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().nullable().optional(),
  status: issueStatusEnum.optional(),
  priority: issuePriorityEnum.optional(),
  estimate: z.number().int().min(0).max(100).nullable().optional(),
  sortOrder: z.number().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  labelIds: z.array(z.string().uuid()).optional(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type CreateIssueInput = z.infer<typeof createIssueSchema>;
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;
export type CreateIssueRelationInput = z.infer<typeof createIssueRelationSchema>;
