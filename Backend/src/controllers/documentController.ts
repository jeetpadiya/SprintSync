import { Response } from "express";
import { and, desc, eq, ilike } from "drizzle-orm";
import { db } from "../db/db.js";
import { documents, users, workspaceMembers } from "../db/schema.js";
import { AuthRequest } from "../middleware/authMiddleware.js";
import {
  createDocumentSchema,
  updateDocumentSchema,
} from "../utils/documentSchemas.js";

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

/**
 * GET /api/documents
 * Lists workspace documents ordered by most recently updated.
 */
export const getDocuments = async (
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

    const { search, creatorId, workspaceId: queryWorkspaceId } = req.query;
    const workspaceId = await resolveWorkspaceId(
      req.user.id,
      typeof queryWorkspaceId === "string" ? queryWorkspaceId : undefined
    );

    if (!workspaceId) {
      return res.status(200).json({ success: true, documents: [] });
    }

    const conditions = [eq(documents.workspaceId, workspaceId)];

    if (creatorId && typeof creatorId === "string") {
      conditions.push(eq(documents.creatorId, creatorId));
    }
    if (search && typeof search === "string" && search.trim()) {
      conditions.push(ilike(documents.title, `%${search.trim()}%`));
    }

    const rows = await db
      .select({
        id: documents.id,
        workspaceId: documents.workspaceId,
        teamId: documents.teamId,
        title: documents.title,
        icon: documents.icon,
        creatorId: documents.creatorId,
        updatedBy: documents.updatedBy,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
        creatorName: users.name,
        creatorEmail: users.email,
      })
      .from(documents)
      .leftJoin(users, eq(documents.creatorId, users.id))
      .where(and(...conditions))
      .orderBy(desc(documents.updatedAt));

    const formatted = rows.map((row) => ({
      id: row.id,
      workspaceId: row.workspaceId,
      teamId: row.teamId,
      title: row.title,
      icon: row.icon,
      creatorId: row.creatorId,
      updatedBy: row.updatedBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      creator: row.creatorId
        ? {
            id: row.creatorId,
            name: row.creatorName ?? "Unknown",
            email: row.creatorEmail ?? "",
          }
        : null,
    }));

    return res.status(200).json({
      success: true,
      documents: formatted,
    });
  } catch (error) {
    console.error("Get documents error:", error);
    return res.status(500).json({
      error: "Internal server error while fetching documents",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * GET /api/documents/:id
 */
export const getDocumentById = async (
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
    const [doc] = await db
      .select({
        id: documents.id,
        workspaceId: documents.workspaceId,
        teamId: documents.teamId,
        title: documents.title,
        icon: documents.icon,
        content: documents.content,
        creatorId: documents.creatorId,
        updatedBy: documents.updatedBy,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
        creatorName: users.name,
        creatorEmail: users.email,
      })
      .from(documents)
      .leftJoin(users, eq(documents.creatorId, users.id))
      .where(eq(documents.id, id))
      .limit(1);

    if (!doc) {
      return res.status(404).json({
        error: "Document not found",
        code: "DOCUMENT_NOT_FOUND",
      });
    }

    return res.status(200).json({
      success: true,
      document: {
        ...doc,
        creator: doc.creatorId
          ? {
              id: doc.creatorId,
              name: doc.creatorName ?? "Unknown",
              email: doc.creatorEmail ?? "",
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Get document error:", error);
    return res.status(500).json({
      error: "Internal server error while fetching document",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * POST /api/documents
 */
export const createDocument = async (
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

    const parseResult = createDocumentSchema.safeParse(req.body ?? {});
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
      .insert(documents)
      .values({
        workspaceId,
        teamId: data.teamId ?? null,
        title: data.title,
        icon: data.icon ?? null,
        content: data.content ?? { type: "doc", content: [{ type: "paragraph" }] },
        creatorId: req.user.id,
        updatedBy: req.user.id,
      })
      .returning();

    const [creator] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    return res.status(201).json({
      success: true,
      document: {
        ...created,
        creator: creator ?? null,
      },
    });
  } catch (error) {
    console.error("Create document error:", error);
    return res.status(500).json({
      error: "Internal server error while creating document",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * PATCH /api/documents/:id
 */
export const updateDocument = async (
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
    const parseResult = updateDocumentSchema.safeParse(req.body);
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
      updatedBy: req.user.id,
    };

    if (data.title !== undefined) updateFields.title = data.title;
    if (data.teamId !== undefined) updateFields.teamId = data.teamId;
    if (data.icon !== undefined) updateFields.icon = data.icon;
    if (data.content !== undefined) updateFields.content = data.content;

    const [updated] = await db
      .update(documents)
      .set(updateFields)
      .where(eq(documents.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({
        error: "Document not found",
        code: "DOCUMENT_NOT_FOUND",
      });
    }

    return res.status(200).json({
      success: true,
      document: updated,
    });
  } catch (error) {
    console.error("Update document error:", error);
    return res.status(500).json({
      error: "Internal server error while updating document",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * DELETE /api/documents/:id
 */
export const deleteDocument = async (
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
      .delete(documents)
      .where(eq(documents.id, id))
      .returning({ id: documents.id });

    if (!deleted) {
      return res.status(404).json({
        error: "Document not found",
        code: "DOCUMENT_NOT_FOUND",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Document deleted",
    });
  } catch (error) {
    console.error("Delete document error:", error);
    return res.status(500).json({
      error: "Internal server error while deleting document",
      code: "INTERNAL_ERROR",
    });
  }
};
