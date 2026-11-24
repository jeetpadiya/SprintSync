import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  title: z.string().trim().max(100).optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
