"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { CreateIssueModal } from "@/features/issues/components/create-issue-modal";
import { CommandMenu } from "@/features/command-menu/command-menu";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useAuthStore } from "@/store/useAuthStore";

interface WorkspaceShellProps {
  children: React.ReactNode;
}

/**
 * Authenticated Workspace Shell
 * Provides the persistent Sidebar, global keyboard shortcuts ('C', 'Esc'),
 * and CreateIssueModal across Inbox, My Issues, and Team views.
 */
export function WorkspaceShell({ children }: WorkspaceShellProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useKeyboardShortcuts();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--bg)] text-[var(--text-3)]">
        <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--bg)] text-[var(--text)] font-sans">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      <CreateIssueModal />
      <CommandMenu />
    </div>
  );
}
