import { Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/db.js";
import {
  workspaces,
  workspaceMembers,
  workspaceInvitations,
  users,
} from "../db/schema.js";
import { AuthRequest } from "../middleware/authMiddleware.js";
import { createWorkspaceSchema, inviteTeammatesSchema } from "../utils/workspaceSchemas.js";

/**
 * GET /api/workspaces
 * Retrieves all workspaces the requesting user is a member of
 */
export const getUserWorkspaces = async (
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

    const userWorkspaces = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        slug: workspaces.slug,
        region: workspaces.region,
        logoUrl: workspaces.logoUrl,
        role: workspaceMembers.role,
        joinedAt: workspaceMembers.joinedAt,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
      .where(eq(workspaceMembers.userId, req.user.id));

    return res.status(200).json({
      success: true,
      workspaces: userWorkspaces,
    });
  } catch (error) {
    console.error("Get user workspaces error:", error);
    return res.status(500).json({
      error: "Internal server error while fetching workspaces",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * POST /api/workspaces
 * Creates a new workspace and sets the requesting user as ADMIN
 */
export const createWorkspace = async (
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

    const parseResult = createWorkspaceSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const { name, slug, region } = parseResult.data;

    // Check slug uniqueness
    const existing = await db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      return res.status(409).json({
        error: "This workspace URL is already taken. Please choose another.",
        code: "SLUG_TAKEN",
      });
    }

    // Insert workspace
    const [newWorkspace] = await db
      .insert(workspaces)
      .values({
        name,
        slug,
        region,
      })
      .returning();

    if (!newWorkspace) {
      return res.status(500).json({
        error: "Failed to create workspace",
        code: "CREATION_FAILED",
      });
    }

    // Add user as admin member
    await db.insert(workspaceMembers).values({
      workspaceId: newWorkspace.id,
      userId: req.user.id,
      role: "ADMIN",
    });

    return res.status(201).json({
      success: true,
      message: "Workspace created successfully",
      workspace: newWorkspace,
    });
  } catch (error) {
    console.error("Workspace creation error:", error);
    return res.status(500).json({
      error: "Internal server error while creating workspace",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * POST /api/workspaces/invite
 * Invites teammates to a workspace
 */
export const inviteTeammates = async (
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

    const parseResult = inviteTeammatesSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    let { emails, workspaceId } = parseResult.data;

    // If workspaceId was not supplied, resolve user's primary/first workspace
    if (!workspaceId) {
      const [membership] = await db
        .select({ workspaceId: workspaceMembers.workspaceId })
        .from(workspaceMembers)
        .where(eq(workspaceMembers.userId, req.user.id))
        .limit(1);

      if (!membership) {
        return res.status(400).json({
          error: "No workspace found to invite members into",
          code: "NO_WORKSPACE",
        });
      }
      workspaceId = membership.workspaceId;
    }

    // Persist invitations
    const invitationRows = emails.map((email) => ({
      workspaceId: workspaceId!,
      email: email.toLowerCase(),
      role: "MEMBER",
      invitedBy: req.user!.id,
    }));

    await db.insert(workspaceInvitations).values(invitationRows);

    return res.status(200).json({
      success: true,
      message: `Successfully invited ${emails.length} teammate${emails.length > 1 ? "s" : ""}`,
      count: emails.length,
    });
  } catch (error) {
    console.error("Invite teammates error:", error);
    return res.status(500).json({
      error: "Internal server error while sending invitations",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * GET /api/workspaces/members
 * Retrieves all members of the active workspace for issue assignment pickers.
 */
export const getWorkspaceMembers = async (
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

    let workspaceId = req.query.workspaceId as string | undefined;

    if (!workspaceId) {
      const [membership] = await db
        .select({ workspaceId: workspaceMembers.workspaceId })
        .from(workspaceMembers)
        .where(eq(workspaceMembers.userId, req.user.id))
        .limit(1);

      if (!membership) {
        return res.status(200).json({ success: true, members: [] });
      }
      workspaceId = membership.workspaceId;
    }

    const members = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
        role: workspaceMembers.role,
      })
      .from(workspaceMembers)
      .innerJoin(users, eq(users.id, workspaceMembers.userId))
      .where(eq(workspaceMembers.workspaceId, workspaceId));

    return res.status(200).json({
      success: true,
      members,
    });
  } catch (error) {
    console.error("Get workspace members error:", error);
    return res.status(500).json({
      error: "Internal server error while fetching workspace members",
      code: "INTERNAL_ERROR",
    });
  }
};
