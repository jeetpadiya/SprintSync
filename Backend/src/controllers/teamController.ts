import { Response } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/db.js";
import { teams, workspaceMembers } from "../db/schema.js";
import { AuthRequest } from "../middleware/authMiddleware.js";
import { createTeamSchema } from "../utils/issueSchemas.js";

/**
 * GET /api/teams
 * Retrieves all teams for the requesting user's active workspace.
 * Automatically initializes a default "Engineering" (ENG) team if none exist.
 */
export const getTeams = async (
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

    // Resolve workspace ID from query or user's first membership
    let workspaceId = req.query.workspaceId as string | undefined;

    if (!workspaceId) {
      const [membership] = await db
        .select({ workspaceId: workspaceMembers.workspaceId })
        .from(workspaceMembers)
        .where(eq(workspaceMembers.userId, req.user.id))
        .limit(1);

      if (!membership) {
        return res.status(200).json({
          success: true,
          teams: [],
        });
      }
      workspaceId = membership.workspaceId;
    }

    let teamList = await db
      .select()
      .from(teams)
      .where(eq(teams.workspaceId, workspaceId));

    // If no teams exist yet for this workspace, auto-seed default Engineering team
    if (teamList.length === 0) {
      const [defaultTeam] = await db
        .insert(teams)
        .values({
          workspaceId,
          name: "Engineering",
          key: "ENG",
          issueCounter: 0,
        })
        .returning();

      if (defaultTeam) {
        teamList = [defaultTeam];
      }
    }

    return res.status(200).json({
      success: true,
      teams: teamList,
    });
  } catch (error) {
    console.error("Get teams error:", error);
    return res.status(500).json({
      error: "Internal server error while fetching teams",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * POST /api/teams
 * Creates a new team in the user's workspace
 */
export const createTeam = async (
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

    const parseResult = createTeamSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    let { name, key, workspaceId } = parseResult.data;

    if (!workspaceId) {
      const [membership] = await db
        .select({ workspaceId: workspaceMembers.workspaceId })
        .from(workspaceMembers)
        .where(eq(workspaceMembers.userId, req.user.id))
        .limit(1);

      if (!membership) {
        return res.status(400).json({
          error: "No workspace found to create team in",
          code: "NO_WORKSPACE",
        });
      }
      workspaceId = membership.workspaceId;
    }

    // Check key uniqueness within the workspace
    const [existingKey] = await db
      .select({ id: teams.id })
      .from(teams)
      .where(and(eq(teams.workspaceId, workspaceId), eq(teams.key, key)))
      .limit(1);

    if (existingKey) {
      return res.status(409).json({
        error: `Team with identifier '${key}' already exists in this workspace`,
        code: "TEAM_KEY_EXISTS",
      });
    }

    const [newTeam] = await db
      .insert(teams)
      .values({
        workspaceId,
        name,
        key,
        issueCounter: 0,
      })
      .returning();

    return res.status(201).json({
      success: true,
      message: "Team created successfully",
      team: newTeam,
    });
  } catch (error) {
    console.error("Create team error:", error);
    return res.status(500).json({
      error: "Internal server error while creating team",
      code: "INTERNAL_ERROR",
    });
  }
};
