import { z } from "zod";

export const createDocumentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Document title is required")
    .max(255, "Document title must not exceed 255 characters")
    .default("Untitled"),
  workspaceId: z.string().uuid().optional(),
  teamId: z.string().uuid().nullable().optional(),
  icon: z.string().max(30).nullable().optional(),
  content: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  teamId: z.string().uuid().nullable().optional(),
  icon: z.string().max(30).nullable().optional(),
  content: z.record(z.string(), z.unknown()).nullable().optional(),
});
