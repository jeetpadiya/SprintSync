import { Response } from "express";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db/db.js";
import { cycles, issues, teams, workspaceMembers } from "../db/schema.js";
import { AuthRequest } from "../middleware/authMiddleware.js";
import {
  closeCycleSchema,
  createCycleSchema,
  updateCycleSchema,
} from "../utils/cycleSchemas.js";

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

interface CycleMetrics {
  totalIssues: number;
  completedIssues: number;
  inProgressIssues: number;
  totalPoints: number;
  completedPoints: number;
  progressPercentage: number;
  pointsPercentage: number;
}

function buildMetrics(
  cycleRows: typeof cycles.$inferSelect[],
  childIssues: { cycleId: string | null; status: string; estimate: number | null }[]
): Map<string, CycleMetrics> {
  const map = new Map<string, CycleMetrics>();

  for (const c of cycleRows) {
    if (c.status === "COMPLETED") {
      const totalIssues = c.totalIssuesCount;
      const completedIssues = c.completedIssuesCount;
      const totalPoints = c.totalPoints;
      const completedPoints = c.completedPoints;
      map.set(c.id, {
        totalIssues,
        completedIssues,
        inProgressIssues: Math.max(0, totalIssues - completedIssues),
        totalPoints,
        completedPoints,
        progressPercentage:
          totalIssues === 0
            ? 0
            : Math.round((completedIssues / totalIssues) * 100),
        pointsPercentage:
          totalPoints === 0
            ? 0
            : Math.round((completedPoints / totalPoints) * 100),
      });
    } else {
      map.set(c.id, {
        totalIssues: 0,
        completedIssues: 0,
        inProgressIssues: 0,
        totalPoints: 0,
        completedPoints: 0,
        progressPercentage: 0,
        pointsPercentage: 0,
      });
    }
  }

  for (const iss of childIssues) {
    if (!iss.cycleId) continue;
    const m = map.get(iss.cycleId);
    if (!m) continue;
    const pts = iss.estimate ?? 0;
    m.totalIssues += 1;
    m.totalPoints += pts;
    if (iss.status === "DONE" || iss.status === "CANCELED") {
      m.completedIssues += 1;
      m.completedPoints += pts;
    } else if (iss.status === "IN_PROGRESS" || iss.status === "IN_REVIEW") {
      m.inProgressIssues += 1;
    }
    m.progressPercentage =
      m.totalIssues === 0
        ? 0
        : Math.round((m.completedIssues / m.totalIssues) * 100);
    m.pointsPercentage =
      m.totalPoints === 0
        ? 0
        : Math.round((m.completedPoints / m.totalPoints) * 100);
  }

  return map;
}

/**
 * GET /api/cycles
 * Lists cycles for a team (auto-seeding Cycle 1 if none exist for the team) or all workspace teams.
 */
export const getCycles = async (
  req: AuthRequest,
  res: Response
): Promise<void | Response> => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        error: "Authentication required",
        code: "UNAUTHORIZED",
      });
    }

    const teamId = req.query.teamId as string | undefined;
    let workspaceId = req.query.workspaceId as string | undefined;

    if (!workspaceId) {
      const [membership] = await db
        .select({ workspaceId: workspaceMembers.workspaceId })
        .from(workspaceMembers)
        .where(eq(workspaceMembers.userId, req.user.id))
        .limit(1);

      if (!membership) {
        return res.status(200).json({ success: true, cycles: [] });
      }
      workspaceId = membership.workspaceId;
    }

    const conditions = [eq(cycles.workspaceId, workspaceId)];
    if (teamId) {
      conditions.push(eq(cycles.teamId, teamId));
    }

    let cycleRows = await db
      .select()
      .from(cycles)
      .where(and(...conditions))
      .orderBy(desc(cycles.number));

    // Auto-seed an initial 2-week Active Cycle 1 if querying a specific team with no cycles yet
    if (teamId && cycleRows.length === 0) {
      const [team] = await db
        .select()
        .from(teams)
        .where(eq(teams.id, teamId))
        .limit(1);

      if (team) {
        const startsAt = new Date();
        const endsAt = new Date(startsAt.getTime() + TWO_WEEKS_MS);
        const [initialCycle] = await db
          .insert(cycles)
          .values({
            workspaceId: team.workspaceId,
            teamId: team.id,
            number: 1,
            name: "Cycle 1",
            status: "ACTIVE",
            startsAt,
            endsAt,
          })
          .returning();

        if (initialCycle) {
          cycleRows = [initialCycle];
        }
      }
    }

    const activeIds = cycleRows
      .filter((c) => c.status !== "COMPLETED")
      .map((c) => c.id);

    let childIssues: {
      cycleId: string | null;
      status: string;
      estimate: number | null;
    }[] = [];

    if (activeIds.length > 0) {
      childIssues = await db
        .select({
          cycleId: issues.cycleId,
          status: issues.status,
          estimate: issues.estimate,
        })
        .from(issues)
        .where(inArray(issues.cycleId, activeIds));
    }

    const metricsMap = buildMetrics(cycleRows, childIssues);

    const formatted = cycleRows.map((c) => ({
      ...c,
      metrics: metricsMap.get(c.id),
    }));

    return res.status(200).json({
      success: true,
      cycles: formatted,
    });
  } catch (error) {
    console.error("Get cycles error:", error);
    return res.status(500).json({
      error: "Internal server error while fetching cycles",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * POST /api/cycles
 * Creates a new 2-week cycle for a team.
 */
export const createCycle = async (
  req: AuthRequest,
  res: Response
): Promise<void | Response> => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        error: "Authentication required",
        code: "UNAUTHORIZED",
      });
    }

    const parseResult = createCycleSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const { teamId, name, status, startsAt, endsAt } = parseResult.data;

    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (!team) {
      return res.status(404).json({
        error: "Team not found",
        code: "TEAM_NOT_FOUND",
      });
    }

    const existingCycles = await db
      .select()
      .from(cycles)
      .where(eq(cycles.teamId, teamId))
      .orderBy(desc(cycles.number));

    const latest = existingCycles[0];
    const nextNumber = (latest?.number ?? 0) + 1;
    const hasActive = existingCycles.some((c) => c.status === "ACTIVE");

    const start = startsAt
      ? new Date(startsAt)
      : latest && hasActive
        ? new Date(latest.endsAt)
        : new Date();
    const end = endsAt
      ? new Date(endsAt)
      : new Date(start.getTime() + TWO_WEEKS_MS);

    const [created] = await db
      .insert(cycles)
      .values({
        workspaceId: team.workspaceId,
        teamId: team.id,
        number: nextNumber,
        name: name || `Cycle ${nextNumber}`,
        status: status ?? (hasActive ? "UPCOMING" : "ACTIVE"),
        startsAt: start,
        endsAt: end,
      })
      .returning();

    return res.status(201).json({
      success: true,
      cycle: {
        ...created,
        metrics: {
          totalIssues: 0,
          completedIssues: 0,
          inProgressIssues: 0,
          totalPoints: 0,
          completedPoints: 0,
          progressPercentage: 0,
          pointsPercentage: 0,
        },
      },
    });
  } catch (error) {
    console.error("Create cycle error:", error);
    return res.status(500).json({
      error: "Internal server error while creating cycle",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * PATCH /api/cycles/:id
 */
export const updateCycle = async (
  req: AuthRequest,
  res: Response
): Promise<void | Response> => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        error: "Authentication required",
        code: "UNAUTHORIZED",
      });
    }

    const id = req.params.id as string;
    const parseResult = updateCycleSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const data = parseResult.data;
    const updateFields: Record<string, unknown> = { updatedAt: new Date() };

    if (data.name !== undefined) updateFields.name = data.name;
    if (data.status !== undefined) updateFields.status = data.status;
    if (data.startsAt !== undefined) updateFields.startsAt = new Date(data.startsAt);
    if (data.endsAt !== undefined) updateFields.endsAt = new Date(data.endsAt);

    const [updated] = await db
      .update(cycles)
      .set(updateFields)
      .where(eq(cycles.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({
        error: "Cycle not found",
        code: "CYCLE_NOT_FOUND",
      });
    }

    return res.status(200).json({
      success: true,
      cycle: updated,
    });
  } catch (error) {
    console.error("Update cycle error:", error);
    return res.status(500).json({
      error: "Internal server error while updating cycle",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * POST /api/cycles/:id/close
 * Closes an active cycle, snapshots velocity metrics, and automatically rolls over
 * unfinished issues to the next active cycle (creating one if needed) or back to Backlog.
 */
export const closeCycle = async (
  req: AuthRequest,
  res: Response
): Promise<void | Response> => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        error: "Authentication required",
        code: "UNAUTHORIZED",
      });
    }

    const id = req.params.id as string;
    const parseResult = closeCycleSchema.safeParse(req.body ?? {});
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
      });
    }

    const { rolloverTarget } = parseResult.data;

    const [targetCycle] = await db
      .select()
      .from(cycles)
      .where(eq(cycles.id, id))
      .limit(1);

    if (!targetCycle) {
      return res.status(404).json({
        error: "Cycle not found",
        code: "CYCLE_NOT_FOUND",
      });
    }

    if (targetCycle.status === "COMPLETED") {
      return res.status(400).json({
        error: "Cycle is already completed",
        code: "CYCLE_ALREADY_COMPLETED",
      });
    }

    const cycleIssues = await db
      .select({
        id: issues.id,
        status: issues.status,
        estimate: issues.estimate,
      })
      .from(issues)
      .where(eq(issues.cycleId, targetCycle.id));

    const totalIssuesCount = cycleIssues.length;
    const completedList = cycleIssues.filter(
      (i) => i.status === "DONE" || i.status === "CANCELED"
    );
    const unfinishedList = cycleIssues.filter(
      (i) => i.status !== "DONE" && i.status !== "CANCELED"
    );

    const totalPoints = cycleIssues.reduce(
      (acc, i) => acc + (i.estimate ?? 0),
      0
    );
    const completedPoints = completedList.reduce(
      (acc, i) => acc + (i.estimate ?? 0),
      0
    );

    const [closedCycle] = await db
      .update(cycles)
      .set({
        status: "COMPLETED",
        totalIssuesCount,
        completedIssuesCount: completedList.length,
        totalPoints,
        completedPoints,
        updatedAt: new Date(),
      })
      .where(eq(cycles.id, targetCycle.id))
      .returning();

    let nextCycle: typeof cycles.$inferSelect | null = null;

    if (rolloverTarget === "NEXT_CYCLE") {
      const [existingUpcoming] = await db
        .select()
        .from(cycles)
        .where(
          and(
            eq(cycles.teamId, targetCycle.teamId),
            eq(cycles.status, "UPCOMING")
          )
        )
        .orderBy(asc(cycles.number))
        .limit(1);

      if (existingUpcoming) {
        const [activated] = await db
          .update(cycles)
          .set({ status: "ACTIVE", updatedAt: new Date() })
          .where(eq(cycles.id, existingUpcoming.id))
          .returning();
        nextCycle = activated ?? existingUpcoming;
      } else {
        const allTeamCycles = await db
          .select({ number: cycles.number })
          .from(cycles)
          .where(eq(cycles.teamId, targetCycle.teamId))
          .orderBy(desc(cycles.number))
          .limit(1);

        const nextNum = (allTeamCycles[0]?.number ?? targetCycle.number) + 1;
        const startsAt = new Date();
        const endsAt = new Date(startsAt.getTime() + TWO_WEEKS_MS);

        const [createdNext] = await db
          .insert(cycles)
          .values({
            workspaceId: targetCycle.workspaceId,
            teamId: targetCycle.teamId,
            number: nextNum,
            name: `Cycle ${nextNum}`,
            status: "ACTIVE",
            startsAt,
            endsAt,
          })
          .returning();

        nextCycle = createdNext ?? null;
      }

      if (unfinishedList.length > 0 && nextCycle) {
        await db
          .update(issues)
          .set({ cycleId: nextCycle.id, updatedAt: new Date() })
          .where(
            inArray(
              issues.id,
              unfinishedList.map((i) => i.id)
            )
          );
      }
    } else if (unfinishedList.length > 0) {
      await db
        .update(issues)
        .set({ cycleId: null, status: "BACKLOG", updatedAt: new Date() })
        .where(
          inArray(
            issues.id,
            unfinishedList.map((i) => i.id)
          )
        );
    }

    return res.status(200).json({
      success: true,
      closedCycle,
      nextCycle,
      rolledOverCount: unfinishedList.length,
    });
  } catch (error) {
    console.error("Close cycle error:", error);
    return res.status(500).json({
      error: "Internal server error while closing cycle",
      code: "INTERNAL_ERROR",
    });
  }
};
