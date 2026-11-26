import { Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { labels, workspaceMembers } from "../db/schema.js";
import { AuthRequest } from "../middleware/authMiddleware.js";

const DEFAULT_LABELS = [
  { name: "Bug", color: "#eb5757" },
  { name: "Feature", color: "#5e6ad2" },
  { name: "Improvement", color: "#4cb782" },
  { name: "Documentation", color: "#f2c94c" },
];

/**
 * GET /api/labels
 * Retrieves all labels for the active workspace, initializing default labels if none exist.
 */
export const getLabels = async (
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
        return res.status(200).json({ success: true, labels: [] });
      }
      workspaceId = membership.workspaceId;
    }

    let labelList = await db
      .select()
      .from(labels)
      .where(eq(labels.workspaceId, workspaceId));

    if (labelList.length === 0) {
      const inserted = await db
        .insert(labels)
        .values(
          DEFAULT_LABELS.map((l) => ({
            workspaceId: workspaceId!,
            name: l.name,
            color: l.color,
          }))
        )
        .returning();
      labelList = inserted;
    }

    return res.status(200).json({
      success: true,
      labels: labelList,
    });
  } catch (error) {
    console.error("Get labels error:", error);
    return res.status(500).json({
      error: "Internal server error while fetching labels",
      code: "INTERNAL_ERROR",
    });
  }
};
