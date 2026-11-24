import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Workspace name must be at least 2 characters")
    .max(100, "Workspace name must not exceed 100 characters"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "URL slug must be at least 2 characters")
    .max(50, "URL slug must not exceed 50 characters")
    .regex(/^[a-z0-9-]+$/, "URL slug can only contain lowercase letters, numbers, and hyphens"),
  region: z.enum(["europe", "asia"], {
    message: "Please select a valid region",
  }),
});

export type CreateWorkspaceFormData = z.infer<typeof createWorkspaceSchema>;
