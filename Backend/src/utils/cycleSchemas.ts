import { z } from "zod";

export const cycleStatusEnum = z.enum(["UPCOMING", "ACTIVE", "COMPLETED"]);

export const createCycleSchema = z.object({
  teamId: z.string().uuid("Valid team ID is required"),
  name: z.string().trim().min(1).max(120).optional(),
  status: cycleStatusEnum.optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
});

export const updateCycleSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  status: cycleStatusEnum.optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
});

export const closeCycleSchema = z.object({
  rolloverTarget: z.enum(["NEXT_CYCLE", "BACKLOG"]).default("NEXT_CYCLE"),
});
