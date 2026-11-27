import { Issue } from "@/types/issue.types";

/**
 * Computes the new numeric sortOrder for a single-row fractional update
 * without touching any sibling rows in the database.
 */
export function computeDropSortOrder(
  targetColumnIssues: Issue[],
  targetIndex: number
): number {
  if (targetColumnIssues.length === 0) {
    return 1000;
  }

  const clampedIndex = Math.max(
    0,
    Math.min(targetIndex, targetColumnIssues.length)
  );

  if (clampedIndex === 0) {
    return targetColumnIssues[0]!.sortOrder - 1000;
  }

  if (clampedIndex >= targetColumnIssues.length) {
    return targetColumnIssues[targetColumnIssues.length - 1]!.sortOrder + 1000;
  }

  const prev = targetColumnIssues[clampedIndex - 1]!.sortOrder;
  const next = targetColumnIssues[clampedIndex]!.sortOrder;

  if (prev === next) {
    return prev + 0.5;
  }

  return (prev + next) / 2;
}
