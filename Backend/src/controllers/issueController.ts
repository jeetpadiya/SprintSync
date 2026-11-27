import { Response } from "express";
import { eq, and, or, sql, desc, asc, inArray, ilike } from "drizzle-orm";
import { db } from "../db/db.js";
import {
  issues,
  teams,
  users,
  labels,
  issueLabels,
  issueRelations,
  workspaceMembers,
} from "../db/schema.js";
import { AuthRequest } from "../middleware/authMiddleware.js";
import {
  createIssueSchema,
  updateIssueSchema,
  createIssueRelationSchema,
} from "../utils/issueSchemas.js";

const invertRelationType = (type: string): string => {
  if (type === "BLOCKS") return "BLOCKED_BY";
  if (type === "BLOCKED_BY") return "BLOCKS";
  return type;
};

/**
 * GET /api/issues
 * List issues with filters (teamId, status, priority, assigneeId, search)
 */
export const getIssues = async (
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

    const {
      teamId,
      status,
      priority,
      assigneeId,
      creatorId,
      projectId,
      cycleId,
      search,
      workspaceId: queryWorkspaceId,
    } = req.query;

    // Resolve workspace ID
    let workspaceId = queryWorkspaceId as string | undefined;
    if (!workspaceId) {
      const [membership] = await db
        .select({ workspaceId: workspaceMembers.workspaceId })
        .from(workspaceMembers)
        .where(eq(workspaceMembers.userId, req.user.id))
        .limit(1);

      if (!membership) {
        return res.status(200).json({ success: true, issues: [] });
      }
      workspaceId = membership.workspaceId;
    }

    const conditions = [eq(issues.workspaceId, workspaceId)];

    if (teamId && typeof teamId === "string") {
      conditions.push(eq(issues.teamId, teamId));
    }
    if (status && typeof status === "string") {
      conditions.push(eq(issues.status, status));
    }
    if (priority && typeof priority === "string") {
      conditions.push(eq(issues.priority, priority));
    }
    if (assigneeId && typeof assigneeId === "string") {
      conditions.push(eq(issues.assigneeId, assigneeId));
    }
    if (creatorId && typeof creatorId === "string") {
      conditions.push(eq(issues.creatorId, creatorId));
    }
    if (projectId && typeof projectId === "string") {
      conditions.push(eq(issues.projectId, projectId));
    }
    if (cycleId && typeof cycleId === "string") {
      conditions.push(eq(issues.cycleId, cycleId));
    }
    if (search && typeof search === "string") {
      conditions.push(ilike(issues.title, `%${search.trim()}%`));
    }

    const issueRows = await db
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
        cycleId: issues.cycleId,
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
      .where(and(...conditions))
      .orderBy(asc(issues.sortOrder), desc(issues.createdAt));

    // Fetch labels for all retrieved issues
    const issueIds = issueRows.map((i) => i.id);
    let issueLabelsMap: Record<string, { id: string; name: string; color: string }[]> = {};

    if (issueIds.length > 0) {
      const labelsData = await db
        .select({
          issueId: issueLabels.issueId,
          id: labels.id,
          name: labels.name,
          color: labels.color,
        })
        .from(issueLabels)
        .innerJoin(labels, eq(issueLabels.labelId, labels.id))
        .where(inArray(issueLabels.issueId, issueIds));

      for (const row of labelsData) {
        if (!issueLabelsMap[row.issueId]) {
          issueLabelsMap[row.issueId] = [];
        }
        issueLabelsMap[row.issueId]!.push({
          id: row.id,
          name: row.name,
          color: row.color,
        });
      }
    }

    const populatedIssues = issueRows.map((issue) => ({
      ...issue,
      team: {
        id: issue.teamId,
        name: issue.teamName,
        key: issue.teamKey,
      },
      assignee: issue.assigneeId
        ? {
            id: issue.assigneeId,
            name: issue.assigneeName,
            email: issue.assigneeEmail,
            avatarUrl: issue.assigneeAvatarUrl,
          }
        : null,
      labels: issueLabelsMap[issue.id] || [],
    }));

    return res.status(200).json({
      success: true,
      issues: populatedIssues,
    });
  } catch (error) {
    console.error("Get issues error:", error);
    return res.status(500).json({
      error: "Internal server error while fetching issues",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * GET /api/issues/:id
 * Retrieve single issue by ID with full details
 */
export const getIssueById = async (
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

    const { id } = req.params;
    if (!id || typeof id !== "string") {
      return res.status(400).json({
        error: "Issue ID is required",
        code: "INVALID_ID",
      });
    }

    const [issue] = await db
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
        cycleId: issues.cycleId,
        parentId: issues.parentId,
        dueDate: issues.dueDate,
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
      .where(eq(issues.id, id))
      .limit(1);

    if (!issue) {
      return res.status(404).json({
        error: "Issue not found",
        code: "ISSUE_NOT_FOUND",
      });
    }

    const labelsData = await db
      .select({
        id: labels.id,
        name: labels.name,
        color: labels.color,
      })
      .from(issueLabels)
      .innerJoin(labels, eq(issueLabels.labelId, labels.id))
      .where(eq(issueLabels.issueId, issue.id));

    // Parent issue (if sub-issue)
    let parentIssue: {
      id: string;
      identifier: string;
      title: string;
      status: string;
      priority: string;
    } | null = null;
    if (issue.parentId) {
      const [parentRow] = await db
        .select({
          id: issues.id,
          identifier: issues.identifier,
          title: issues.title,
          status: issues.status,
          priority: issues.priority,
        })
        .from(issues)
        .where(eq(issues.id, issue.parentId))
        .limit(1);
      parentIssue = parentRow ?? null;
    }

    // Sub-issues (children)
    const subIssues = await db
      .select({
        id: issues.id,
        identifier: issues.identifier,
        title: issues.title,
        status: issues.status,
        priority: issues.priority,
      })
      .from(issues)
      .where(eq(issues.parentId, issue.id))
      .orderBy(asc(issues.sortOrder), asc(issues.createdAt));

    // Relations (bidirectional)
    const relationRows = await db
      .select()
      .from(issueRelations)
      .where(
        or(
          eq(issueRelations.sourceIssueId, issue.id),
          eq(issueRelations.targetIssueId, issue.id)
        )
      );

    const relatedIds = relationRows.map((r) =>
      r.sourceIssueId === issue.id ? r.targetIssueId : r.sourceIssueId
    );
    const relatedIssuesMap = new Map<
      string,
      { id: string; identifier: string; title: string; status: string; priority: string }
    >();

    if (relatedIds.length > 0) {
      const relatedIssueRows = await db
        .select({
          id: issues.id,
          identifier: issues.identifier,
          title: issues.title,
          status: issues.status,
          priority: issues.priority,
        })
        .from(issues)
        .where(inArray(issues.id, relatedIds));

      for (const row of relatedIssueRows) {
        relatedIssuesMap.set(row.id, row);
      }
    }

    const populatedRelations = relationRows
      .map((r) => {
        const isSource = r.sourceIssueId === issue.id;
        const otherId = isSource ? r.targetIssueId : r.sourceIssueId;
        const otherIssue = relatedIssuesMap.get(otherId);
        if (!otherIssue) return null;
        return {
          id: r.id,
          type: isSource ? r.type : invertRelationType(r.type),
          issue: otherIssue,
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      issue: {
        ...issue,
        team: {
          id: issue.teamId,
          name: issue.teamName,
          key: issue.teamKey,
        },
        assignee: issue.assigneeId
          ? {
              id: issue.assigneeId,
              name: issue.assigneeName,
              email: issue.assigneeEmail,
              avatarUrl: issue.assigneeAvatarUrl,
            }
          : null,
        labels: labelsData,
        parent: parentIssue,
        subIssues,
        relations: populatedRelations,
      },
    });
  } catch (error) {
    console.error("Get issue by id error:", error);
    return res.status(500).json({
      error: "Internal server error while fetching issue",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * POST /api/issues
 * Creates a new issue with atomic team counter incrementation (e.g. ENG-101)
 */
export const createIssue = async (
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

    const parseResult = createIssueSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const {
      teamId,
      title,
      description,
      status,
      priority,
      estimate,
      assigneeId,
      projectId,
      cycleId,
      parentId,
      dueDate,
      labelIds,
    } = parseResult.data;

    // 1. Atomically increment team issue counter
    const [updatedTeam] = await db
      .update(teams)
      .set({
        issueCounter: sql`${teams.issueCounter} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(teams.id, teamId))
      .returning({
        id: teams.id,
        key: teams.key,
        workspaceId: teams.workspaceId,
        issueCounter: teams.issueCounter,
      });

    if (!updatedTeam) {
      return res.status(404).json({
        error: "Team not found",
        code: "TEAM_NOT_FOUND",
      });
    }

    const issueNumber = updatedTeam.issueCounter;
    const identifier = `${updatedTeam.key}-${issueNumber}`;

    // 2. Insert Issue record
    const [newIssue] = await db
      .insert(issues)
      .values({
        workspaceId: updatedTeam.workspaceId,
        teamId: updatedTeam.id,
        number: issueNumber,
        identifier,
        title,
        description: description || null,
        status,
        priority,
        estimate: estimate ?? null,
        sortOrder: issueNumber * 1000,
        assigneeId: assigneeId || null,
        creatorId: req.user.id,
        projectId: projectId || null,
        cycleId: cycleId || null,
        parentId: parentId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
      })
      .returning();

    if (!newIssue) {
      return res.status(500).json({
        error: "Failed to create issue record",
        code: "CREATION_FAILED",
      });
    }

    // 3. Map any selected labels
    let assignedLabels: { id: string; name: string; color: string }[] = [];
    if (labelIds && labelIds.length > 0) {
      await db.insert(issueLabels).values(
        labelIds.map((labelId) => ({
          issueId: newIssue.id,
          labelId,
        }))
      );
      assignedLabels = await db
        .select({
          id: labels.id,
          name: labels.name,
          color: labels.color,
        })
        .from(labels)
        .where(inArray(labels.id, labelIds));
    }

    let assigneeObj: { id: string; name: string; email: string; avatarUrl: string | null } | null =
      null;
    if (newIssue.assigneeId) {
      const [member] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(eq(users.id, newIssue.assigneeId))
        .limit(1);
      if (member) assigneeObj = member;
    }

    return res.status(201).json({
      success: true,
      message: "Issue created successfully",
      issue: {
        ...newIssue,
        team: {
          id: updatedTeam.id,
          key: updatedTeam.key,
        },
        assignee: assigneeObj,
        labels: assignedLabels,
      },
    });
  } catch (error) {
    console.error("Create issue error:", error);
    return res.status(500).json({
      error: "Internal server error while creating issue",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * PATCH /api/issues/:id
 * Updates issue properties (status, priority, assignee, sortOrder, etc.)
 */
export const updateIssue = async (
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
    if (!id || typeof id !== "string") {
      return res.status(400).json({
        error: "Issue ID is required",
        code: "INVALID_ID",
      });
    }

    const parseResult = updateIssueSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const data = parseResult.data;

    if (data.parentId === id) {
      return res.status(400).json({
        error: "An issue cannot be its own parent",
        code: "INVALID_PARENT",
      });
    }

    const updateFields: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) updateFields.title = data.title;
    if (data.description !== undefined) updateFields.description = data.description;
    if (data.status !== undefined) updateFields.status = data.status;
    if (data.priority !== undefined) updateFields.priority = data.priority;
    if (data.estimate !== undefined) updateFields.estimate = data.estimate;
    if (data.sortOrder !== undefined) updateFields.sortOrder = data.sortOrder;
    if (data.assigneeId !== undefined) updateFields.assigneeId = data.assigneeId;
    if (data.projectId !== undefined) updateFields.projectId = data.projectId;
    if (data.cycleId !== undefined) updateFields.cycleId = data.cycleId;
    if (data.parentId !== undefined) updateFields.parentId = data.parentId;
    if (data.dueDate !== undefined) {
      updateFields.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    const [updatedIssue] = await db
      .update(issues)
      .set(updateFields)
      .where(eq(issues.id, id))
      .returning();

    if (!updatedIssue) {
      return res.status(404).json({
        error: "Issue not found",
        code: "ISSUE_NOT_FOUND",
      });
    }

    // Update labels if provided
    if (data.labelIds !== undefined) {
      await db.delete(issueLabels).where(eq(issueLabels.issueId, id));
      if (data.labelIds.length > 0) {
        const issueId = id;
        await db.insert(issueLabels).values(
          data.labelIds.map((labelId) => ({
            issueId,
            labelId,
          }))
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      issue: updatedIssue,
    });
  } catch (error) {
    console.error("Update issue error:", error);
    return res.status(500).json({
      error: "Internal server error while updating issue",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * DELETE /api/issues/:id
 * Deletes an issue
 */
export const deleteIssue = async (
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
    if (!id || typeof id !== "string") {
      return res.status(400).json({
        error: "Issue ID is required",
        code: "INVALID_ID",
      });
    }

    const [deleted] = await db
      .delete(issues)
      .where(eq(issues.id, id))
      .returning({ id: issues.id });

    if (!deleted) {
      return res.status(404).json({
        error: "Issue not found",
        code: "ISSUE_NOT_FOUND",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Issue deleted successfully",
    });
  } catch (error) {
    console.error("Delete issue error:", error);
    return res.status(500).json({
      error: "Internal server error while deleting issue",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * POST /api/issues/:id/relations
 * Links two issues with a directional or symmetric relation (BLOCKS, BLOCKED_BY, DUPLICATE, RELATED).
 */
export const addIssueRelation = async (
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

    const sourceId = req.params.id as string;
    const parseResult = createIssueRelationSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const { targetIssueId, type } = parseResult.data;

    if (sourceId === targetIssueId) {
      return res.status(400).json({
        error: "Cannot link an issue to itself",
        code: "CANNOT_SELF_RELATE",
      });
    }

    const existingIssues = await db
      .select({
        id: issues.id,
        workspaceId: issues.workspaceId,
        identifier: issues.identifier,
        title: issues.title,
        status: issues.status,
        priority: issues.priority,
      })
      .from(issues)
      .where(inArray(issues.id, [sourceId, targetIssueId]));

    const sourceIssue = existingIssues.find((i) => i.id === sourceId);
    const targetIssue = existingIssues.find((i) => i.id === targetIssueId);

    if (!sourceIssue || !targetIssue) {
      return res.status(404).json({
        error: "Issue not found",
        code: "ISSUE_NOT_FOUND",
      });
    }

    if (sourceIssue.workspaceId !== targetIssue.workspaceId) {
      return res.status(400).json({
        error: "Cannot link issues from different workspaces",
        code: "WORKSPACE_MISMATCH",
      });
    }

    const inverted = invertRelationType(type);
    const [duplicateRelation] = await db
      .select({ id: issueRelations.id })
      .from(issueRelations)
      .where(
        or(
          and(
            eq(issueRelations.sourceIssueId, sourceId),
            eq(issueRelations.targetIssueId, targetIssueId),
            eq(issueRelations.type, type)
          ),
          and(
            eq(issueRelations.sourceIssueId, targetIssueId),
            eq(issueRelations.targetIssueId, sourceId),
            eq(issueRelations.type, inverted)
          )
        )
      )
      .limit(1);

    if (duplicateRelation) {
      return res.status(409).json({
        error: "This relation already exists",
        code: "RELATION_EXISTS",
      });
    }

    const [created] = await db
      .insert(issueRelations)
      .values({
        sourceIssueId: sourceId,
        targetIssueId,
        type,
        createdBy: req.user.id,
      })
      .returning();

    return res.status(201).json({
      success: true,
      relation: {
        id: created!.id,
        type: created!.type,
        issue: {
          id: targetIssue.id,
          identifier: targetIssue.identifier,
          title: targetIssue.title,
          status: targetIssue.status,
          priority: targetIssue.priority,
        },
      },
    });
  } catch (error) {
    console.error("Add issue relation error:", error);
    return res.status(500).json({
      error: "Internal server error while adding relation",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * DELETE /api/issues/:id/relations/:relationId
 * Removes a relation link between two issues.
 */
export const deleteIssueRelation = async (
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

    const issueId = req.params.id as string;
    const relationId = req.params.relationId as string;

    const [deleted] = await db
      .delete(issueRelations)
      .where(
        and(
          eq(issueRelations.id, relationId),
          or(
            eq(issueRelations.sourceIssueId, issueId),
            eq(issueRelations.targetIssueId, issueId)
          )
        )
      )
      .returning({ id: issueRelations.id });

    if (!deleted) {
      return res.status(404).json({
        error: "Relation not found",
        code: "RELATION_NOT_FOUND",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Relation removed",
    });
  } catch (error) {
    console.error("Delete issue relation error:", error);
    return res.status(500).json({
      error: "Internal server error while removing relation",
      code: "INTERNAL_ERROR",
    });
  }
};
