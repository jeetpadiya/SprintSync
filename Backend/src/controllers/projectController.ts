import { Response } from "express";
import { desc, eq, inArray, asc } from "drizzle-orm";
import { db } from "../db/db.js";
import {
  issues,
  projects,
  teams,
  users,
  workspaceMembers,
} from "../db/schema.js";
import { AuthRequest } from "../middleware/authMiddleware.js";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../utils/projectSchemas.js";

async function resolveWorkspaceId(
  userId: string,
  requestedWorkspaceId?: string
): Promise<string | null> {
  if (requestedWorkspaceId) return requestedWorkspaceId;

  const [membership] = await db
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId))
    .limit(1);

  return membership?.workspaceId ?? null;
}

interface ProgressSummary {
  totalIssues: number;
  completedIssues: number;
  inProgressIssues: number;
  progressPercentage: number;
}

function buildProgressMap(
  rows: { projectId: string | null; status: string }[]
): Map<string, ProgressSummary> {
  const map = new Map<string, ProgressSummary>();

  for (const row of rows) {
    if (!row.projectId) continue;
    const current = map.get(row.projectId) ?? {
      totalIssues: 0,
      completedIssues: 0,
      inProgressIssues: 0,
      progressPercentage: 0,
    };
    current.totalIssues += 1;
    if (row.status === "DONE" || row.status === "CANCELED") {
      current.completedIssues += 1;
    } else if (row.status === "IN_PROGRESS" || row.status === "IN_REVIEW") {
      current.inProgressIssues += 1;
    }
    current.progressPercentage =
      current.totalIssues === 0
        ? 0
        : Math.round((current.completedIssues / current.totalIssues) * 100);
    map.set(row.projectId, current);
  }

  return map;
}

/**
 * GET /api/projects
 * Lists all projects in the workspace with lead info, team info, and aggregated issue progress.
 */
export const getProjects = async (
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

    const queryWorkspaceId = req.query.workspaceId as string | undefined;
    const workspaceId = await resolveWorkspaceId(req.user.id, queryWorkspaceId);

    if (!workspaceId) {
      return res.status(200).json({ success: true, projects: [] });
    }

    const projectRows = await db
      .select({
        id: projects.id,
        workspaceId: projects.workspaceId,
        teamId: projects.teamId,
        name: projects.name,
        summary: projects.summary,
        description: projects.description,
        status: projects.status,
        leadId: projects.leadId,
        startDate: projects.startDate,
        targetDate: projects.targetDate,
        creatorId: projects.creatorId,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        teamName: teams.name,
        teamKey: teams.key,
        leadName: users.name,
        leadEmail: users.email,
        leadAvatarUrl: users.avatarUrl,
      })
      .from(projects)
      .leftJoin(teams, eq(projects.teamId, teams.id))
      .leftJoin(users, eq(projects.leadId, users.id))
      .where(eq(projects.workspaceId, workspaceId))
      .orderBy(desc(projects.updatedAt));

    const projectIds = projectRows.map((p) => p.id);
    let progressMap = new Map<string, ProgressSummary>();

    if (projectIds.length > 0) {
      const childIssues = await db
        .select({
          projectId: issues.projectId,
          status: issues.status,
        })
        .from(issues)
        .where(inArray(issues.projectId, projectIds));

      progressMap = buildProgressMap(childIssues);
    }

    const formatted = projectRows.map((row) => ({
      id: row.id,
      workspaceId: row.workspaceId,
      teamId: row.teamId,
      name: row.name,
      summary: row.summary,
      description: row.description,
      status: row.status,
      leadId: row.leadId,
      startDate: row.startDate,
      targetDate: row.targetDate,
      creatorId: row.creatorId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      team: row.teamId
        ? { id: row.teamId, name: row.teamName ?? "", key: row.teamKey ?? "" }
        : null,
      lead: row.leadId
        ? {
            id: row.leadId,
            name: row.leadName ?? "Unknown",
            email: row.leadEmail ?? "",
            avatarUrl: row.leadAvatarUrl,
          }
        : null,
      progress: progressMap.get(row.id) ?? {
        totalIssues: 0,
        completedIssues: 0,
        inProgressIssues: 0,
        progressPercentage: 0,
      },
    }));

    return res.status(200).json({
      success: true,
      projects: formatted,
    });
  } catch (error) {
    console.error("Get projects error:", error);
    return res.status(500).json({
      error: "Internal server error while fetching projects",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * GET /api/projects/:id
 * Retrieves a single project with progress summary and its child issues.
 */
export const getProjectById = async (
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

    const [row] = await db
      .select({
        id: projects.id,
        workspaceId: projects.workspaceId,
        teamId: projects.teamId,
        name: projects.name,
        summary: projects.summary,
        description: projects.description,
        status: projects.status,
        leadId: projects.leadId,
        startDate: projects.startDate,
        targetDate: projects.targetDate,
        creatorId: projects.creatorId,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        teamName: teams.name,
        teamKey: teams.key,
        leadName: users.name,
        leadEmail: users.email,
        leadAvatarUrl: users.avatarUrl,
      })
      .from(projects)
      .leftJoin(teams, eq(projects.teamId, teams.id))
      .leftJoin(users, eq(projects.leadId, users.id))
      .where(eq(projects.id, id))
      .limit(1);

    if (!row) {
      return res.status(404).json({
        error: "Project not found",
        code: "PROJECT_NOT_FOUND",
      });
    }

    const projectIssues = await db
      .select({
        id: issues.id,
        number: issues.number,
        identifier: issues.identifier,
        title: issues.title,
        description: issues.description,
        status: issues.status,
        priority: issues.priority,
        estimate: issues.estimate,
        sortOrder: issues.sortOrder,
        projectId: issues.projectId,
        parentId: issues.parentId,
        dueDate: issues.dueDate,
        creatorId: issues.creatorId,
        createdAt: issues.createdAt,
        updatedAt: issues.updatedAt,
        teamId: issues.teamId,
        teamName: teams.name,
        teamKey: teams.key,
        assigneeId: issues.assigneeId,
        assigneeName: users.name,
        assigneeEmail: users.email,
        assigneeAvatarUrl: users.avatarUrl,
      })
      .from(issues)
      .innerJoin(teams, eq(issues.teamId, teams.id))
      .leftJoin(users, eq(issues.assigneeId, users.id))
      .where(eq(issues.projectId, id))
      .orderBy(asc(issues.sortOrder), desc(issues.createdAt));

    const progressMap = buildProgressMap(
      projectIssues.map((i) => ({ projectId: i.projectId, status: i.status }))
    );

    const formattedIssues = projectIssues.map((i) => ({
      ...i,
      team: { id: i.teamId, name: i.teamName, key: i.teamKey },
      assignee: i.assigneeId
        ? {
            id: i.assigneeId,
            name: i.assigneeName ?? "Unknown",
            email: i.assigneeEmail ?? "",
            avatarUrl: i.assigneeAvatarUrl,
          }
        : null,
      labels: [],
    }));

    return res.status(200).json({
      success: true,
      project: {
        id: row.id,
        workspaceId: row.workspaceId,
        teamId: row.teamId,
        name: row.name,
        summary: row.summary,
        description: row.description,
        status: row.status,
        leadId: row.leadId,
        startDate: row.startDate,
        targetDate: row.targetDate,
        creatorId: row.creatorId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        team: row.teamId
          ? { id: row.teamId, name: row.teamName ?? "", key: row.teamKey ?? "" }
          : null,
        lead: row.leadId
          ? {
              id: row.leadId,
              name: row.leadName ?? "Unknown",
              email: row.leadEmail ?? "",
              avatarUrl: row.leadAvatarUrl,
            }
          : null,
        progress: progressMap.get(row.id) ?? {
          totalIssues: 0,
          completedIssues: 0,
          inProgressIssues: 0,
          progressPercentage: 0,
        },
        issues: formattedIssues,
      },
    });
  } catch (error) {
    console.error("Get project by id error:", error);
    return res.status(500).json({
      error: "Internal server error while fetching project",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * POST /api/projects
 */
export const createProject = async (
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

    const parseResult = createProjectSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const data = parseResult.data;
    const workspaceId = await resolveWorkspaceId(req.user.id, data.workspaceId);

    if (!workspaceId) {
      return res.status(400).json({
        error: "No workspace found for this user",
        code: "NO_WORKSPACE",
      });
    }

    const [created] = await db
      .insert(projects)
      .values({
        workspaceId,
        teamId: data.teamId ?? null,
        name: data.name,
        summary: data.summary || null,
        description: data.description || null,
        status: data.status,
        leadId: data.leadId ?? null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        creatorId: req.user.id,
      })
      .returning();

    return res.status(201).json({
      success: true,
      project: {
        ...created,
        progress: {
          totalIssues: 0,
          completedIssues: 0,
          inProgressIssues: 0,
          progressPercentage: 0,
        },
      },
    });
  } catch (error) {
    console.error("Create project error:", error);
    return res.status(500).json({
      error: "Internal server error while creating project",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * PATCH /api/projects/:id
 */
export const updateProject = async (
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
    const parseResult = updateProjectSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const data = parseResult.data;
    const updateFields: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateFields.name = data.name;
    if (data.summary !== undefined) updateFields.summary = data.summary;
    if (data.description !== undefined) updateFields.description = data.description;
    if (data.status !== undefined) updateFields.status = data.status;
    if (data.teamId !== undefined) updateFields.teamId = data.teamId;
    if (data.leadId !== undefined) updateFields.leadId = data.leadId;
    if (data.startDate !== undefined) {
      updateFields.startDate = data.startDate ? new Date(data.startDate) : null;
    }
    if (data.targetDate !== undefined) {
      updateFields.targetDate = data.targetDate ? new Date(data.targetDate) : null;
    }

    const [updated] = await db
      .update(projects)
      .set(updateFields)
      .where(eq(projects.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({
        error: "Project not found",
        code: "PROJECT_NOT_FOUND",
      });
    }

    return res.status(200).json({
      success: true,
      project: updated,
    });
  } catch (error) {
    console.error("Update project error:", error);
    return res.status(500).json({
      error: "Internal server error while updating project",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * DELETE /api/projects/:id
 */
export const deleteProject = async (
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
    const [deleted] = await db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning({ id: projects.id });

    if (!deleted) {
      return res.status(404).json({
        error: "Project not found",
        code: "PROJECT_NOT_FOUND",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project deleted",
    });
  } catch (error) {
    console.error("Delete project error:", error);
    return res.status(500).json({
      error: "Internal server error while deleting project",
      code: "INTERNAL_ERROR",
    });
  }
};
