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
    message: "Region must be either europe or asia",
  }),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export const inviteTeammatesSchema = z.object({
  emails: z
    .array(z.string().trim().email("Invalid email address"))
    .min(1, "At least one email is required"),
  workspaceId: z.string().uuid().optional(),
});

export type InviteTeammatesInput = z.infer<typeof inviteTeammatesSchema>;
