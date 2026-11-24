import { User } from "@/types/auth.types";

/**
 * Determines the next destination for an authenticated user based on their setup state:
 * 1. No workspaces -> /create-workspace
 * 2. Has workspace but title is null/undefined (onboarding profile step pending) -> /onboarding
 * 3. Has workspace & profile complete/skipped -> /
 */
export function getPostAuthPath(user: User | null): string {
  if (!user) return "/login";

  const hasWorkspaces = (user.workspaces?.length ?? 0) > 0;

  if (!hasWorkspaces) {
    return "/create-workspace";
  }

  if (user.title === null || user.title === undefined) {
    return "/onboarding";
  }

  return "/";
}
