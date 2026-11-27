import { Response } from "express";
import { eq, and, asc, sql, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/db.js";
import { teams, teamMembers, workspaceMembers, users, Team } from "../db/schema.js";
import { AuthRequest } from "../middleware/authMiddleware.js";
import {
  createTeamSchema,
  addTeamMemberSchema,
  updateTeamMemberRoleSchema,
} from "../utils/issueSchemas.js";

const uuidParamSchema = z.string().uuid();

/**
 * Verifies that a team exists and the requesting user belongs to its workspace.
 */
async function resolveAuthorizedTeam(
  teamId: string,
  userId: string,
  res: Response
): Promise<Team | null> {
  if (!uuidParamSchema.safeParse(teamId).success) {
    res.status(400).json({
      error: "Invalid team ID",
      code: "INVALID_ID",
    });
    return null;
  }

  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  if (!team) {
    res.status(404).json({
      error: "Team not found",
      code: "TEAM_NOT_FOUND",
    });
    return null;
  }

  const [membership] = await db
    .select({ id: workspaceMembers.id })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, team.workspaceId),
        eq(workspaceMembers.userId, userId)
      )
    )
    .limit(1);

  if (!membership) {
    res.status(403).json({
      error: "You do not have access to this team's workspace",
      code: "FORBIDDEN",
    });
    return null;
  }

  return team;
}

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
        await db
          .insert(teamMembers)
          .values({
            teamId: defaultTeam.id,
            userId: req.user.id,
            role: "LEAD",
          })
          .onConflictDoNothing();
        teamList = [defaultTeam];
      }
    }

    const teamIds = teamList.map((t) => t.id);
    const countMap = new Map<string, number>();

    if (teamIds.length > 0) {
      const counts = await db
        .select({
          teamId: teamMembers.teamId,
          count: sql<number>`count(${teamMembers.id})::int`,
        })
        .from(teamMembers)
        .where(inArray(teamMembers.teamId, teamIds))
        .groupBy(teamMembers.teamId);

      for (const row of counts) {
        countMap.set(row.teamId, Number(row.count));
      }
    }

    return res.status(200).json({
      success: true,
      teams: teamList.map((t) => ({
        ...t,
        memberCount: countMap.get(t.id) ?? 0,
      })),
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
 * Creates a new team in the user's workspace and adds the creator as LEAD.
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

    if (newTeam) {
      await db
        .insert(teamMembers)
        .values({
          teamId: newTeam.id,
          userId: req.user.id,
          role: "LEAD",
        })
        .onConflictDoNothing();
    }

    return res.status(201).json({
      success: true,
      message: "Team created successfully",
      team: newTeam ? { ...newTeam, memberCount: 1 } : newTeam,
    });
  } catch (error) {
    console.error("Create team error:", error);
    return res.status(500).json({
      error: "Internal server error while creating team",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * GET /api/teams/:teamId/members
 * Retrieves all members assigned to a specific team.
 */
export const getTeamMembers = async (
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

    const team = await resolveAuthorizedTeam(
      String(req.params.teamId),
      req.user.id,
      res
    );
    if (!team) return;

    const members = await db
      .select({
        id: users.id,
        userId: teamMembers.userId,
        teamId: teamMembers.teamId,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
        role: teamMembers.role,
        joinedAt: teamMembers.joinedAt,
      })
      .from(teamMembers)
      .innerJoin(users, eq(users.id, teamMembers.userId))
      .where(eq(teamMembers.teamId, team.id))
      .orderBy(asc(teamMembers.joinedAt), asc(users.name));

    return res.status(200).json({
      success: true,
      members,
    });
  } catch (error) {
    console.error("Get team members error:", error);
    return res.status(500).json({
      error: "Internal server error while fetching team members",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * POST /api/teams/:teamId/members
 * Adds an existing workspace member to a team.
 */
export const addTeamMember = async (
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

    const team = await resolveAuthorizedTeam(
      String(req.params.teamId),
      req.user.id,
      res
    );
    if (!team) return;

    const parseResult = addTeamMemberSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const { userId, role } = parseResult.data;

    // Ensure the target user belongs to the team's workspace
    const [targetWorkspaceMember] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
      })
      .from(workspaceMembers)
      .innerJoin(users, eq(users.id, workspaceMembers.userId))
      .where(
        and(
          eq(workspaceMembers.workspaceId, team.workspaceId),
          eq(workspaceMembers.userId, userId)
        )
      )
      .limit(1);

    if (!targetWorkspaceMember) {
      return res.status(404).json({
        error: "User is not a member of this workspace",
        code: "WORKSPACE_MEMBER_NOT_FOUND",
      });
    }

    const [existingMember] = await db
      .select({ id: teamMembers.id })
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, userId)))
      .limit(1);

    if (existingMember) {
      return res.status(409).json({
        error: "User is already a member of this team",
        code: "TEAM_MEMBER_EXISTS",
      });
    }

    const [inserted] = await db
      .insert(teamMembers)
      .values({
        teamId: team.id,
        userId,
        role,
      })
      .returning();

    if (!inserted) {
      return res.status(500).json({
        error: "Failed to add team member",
        code: "INTERNAL_ERROR",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Team member added",
      member: {
        id: targetWorkspaceMember.id,
        userId: inserted.userId,
        teamId: inserted.teamId,
        name: targetWorkspaceMember.name,
        email: targetWorkspaceMember.email,
        avatarUrl: targetWorkspaceMember.avatarUrl,
        role: inserted.role,
        joinedAt: inserted.joinedAt,
      },
    });
  } catch (error) {
    console.error("Add team member error:", error);
    return res.status(500).json({
      error: "Internal server error while adding team member",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * PATCH /api/teams/:teamId/members/:userId
 * Updates a team member's role (LEAD or MEMBER).
 */
export const updateTeamMemberRole = async (
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

    const team = await resolveAuthorizedTeam(
      String(req.params.teamId),
      req.user.id,
      res
    );
    if (!team) return;

    const targetUserId = String(req.params.userId);
    if (!uuidParamSchema.safeParse(targetUserId).success) {
      return res.status(400).json({
        error: "Invalid user ID",
        code: "INVALID_ID",
      });
    }

    const parseResult = updateTeamMemberRoleSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const [updated] = await db
      .update(teamMembers)
      .set({ role: parseResult.data.role })
      .where(
        and(
          eq(teamMembers.teamId, team.id),
          eq(teamMembers.userId, targetUserId)
        )
      )
      .returning();

    if (!updated) {
      return res.status(404).json({
        error: "Team member not found",
        code: "TEAM_MEMBER_NOT_FOUND",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Team member role updated",
      member: updated,
    });
  } catch (error) {
    console.error("Update team member role error:", error);
    return res.status(500).json({
      error: "Internal server error while updating team member",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * DELETE /api/teams/:teamId/members/:userId
 * Removes a member from a team.
 */
export const removeTeamMember = async (
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

    const team = await resolveAuthorizedTeam(
      String(req.params.teamId),
      req.user.id,
      res
    );
    if (!team) return;

    const targetUserId = String(req.params.userId);
    if (!uuidParamSchema.safeParse(targetUserId).success) {
      return res.status(400).json({
        error: "Invalid user ID",
        code: "INVALID_ID",
      });
    }

    const deleted = await db
      .delete(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, team.id),
          eq(teamMembers.userId, targetUserId)
        )
      )
      .returning({ id: teamMembers.id });

    if (deleted.length === 0) {
      return res.status(404).json({
        error: "Team member not found",
        code: "TEAM_MEMBER_NOT_FOUND",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Team member removed",
    });
  } catch (error) {
    console.error("Remove team member error:", error);
    return res.status(500).json({
      error: "Internal server error while removing team member",
      code: "INTERNAL_ERROR",
    });
  }
};
