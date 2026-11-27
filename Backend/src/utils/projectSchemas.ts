import { z } from "zod";

export const projectStatusEnum = z.enum([
  "PLANNED",
  "IN_PROGRESS",
  "PAUSED",
  "COMPLETED",
  "CANCELED",
]);

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Project name is required")
    .max(255, "Project name must not exceed 255 characters"),
  summary: z.string().trim().max(500).nullable().optional(),
  description: z.string().trim().nullable().optional(),
  status: projectStatusEnum.default("PLANNED"),
  workspaceId: z.string().uuid().optional(),
  teamId: z.string().uuid().nullable().optional(),
  leadId: z.string().uuid().nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  targetDate: z.string().datetime().nullable().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  summary: z.string().trim().max(500).nullable().optional(),
  description: z.string().trim().nullable().optional(),
  status: projectStatusEnum.optional(),
  teamId: z.string().uuid().nullable().optional(),
  leadId: z.string().uuid().nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  targetDate: z.string().datetime().nullable().optional(),
});
