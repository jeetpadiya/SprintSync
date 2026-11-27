"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { KanbanBoard } from "@/features/issues/components/board/kanban-board";
import { VirtualIssueList } from "@/features/issues/components/list/virtual-issue-list";
import { IssueInspector } from "@/features/issues/components/issue-inspector";
import {
  useIssues,
  useTeams,
  useUpdateIssue,
} from "@/features/issues/hooks/use-issues";
import { useAuthStore } from "@/store/useAuthStore";
import { useModalStore } from "@/store/useModalStore";
import { useUIStore } from "@/store/useUIStore";
import { IssueStatus } from "@/types/issue.types";
import {
  Columns3,
  List as ListIcon,
  Loader2,
  Plus,
  Search,
  Users2,
} from "lucide-react";

interface TeamIssuesViewProps {
  teamKey: string;
  scope?: "all" | "backlog";
}

export function TeamIssuesView({
  teamKey,
  scope = "all",
}: TeamIssuesViewProps) {
  const { isAuthenticated } = useAuthStore();
  const { openCreateIssue } = useModalStore();
  const issueViewMode = useUIStore((s) => s.issueViewMode);
  const setIssueViewMode = useUIStore((s) => s.setIssueViewMode);
  const setIssueNavigation = useUIStore((s) => s.setIssueNavigation);
  const clearIssueNavigation = useUIStore((s) => s.clearIssueNavigation);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  useEffect(() => {
    const issueParam = new URLSearchParams(window.location.search).get("issue");
    if (issueParam) {
      setSelectedIssueId(issueParam);
    }
  }, []);

  const { data: teams = [], isLoading: teamsLoading } = useTeams(
    undefined,
    isAuthenticated
  );

  const activeTeam =
    teams.find((t) => t.key.toLowerCase() === teamKey.toLowerCase()) ?? null;

  const { data: teamIssues = [], isLoading: issuesLoading } = useIssues(
    activeTeam ? { teamId: activeTeam.id } : undefined,
    Boolean(activeTeam) && isAuthenticated
  );

  const updateIssue = useUpdateIssue();

  const filteredIssues = useMemo(() => {
    let list = teamIssues;
    if (scope === "backlog") {
      list = list.filter((i) => i.status === "BACKLOG");
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.identifier.toLowerCase().includes(q)
      );
    }
    return list;
  }, [teamIssues, scope, searchQuery]);

  const orderedIds = useMemo(
    () => filteredIssues.map((i) => i.id),
    [filteredIssues]
  );
  const orderedIdsKey = orderedIds.join(",");

  const handleSelectIssueFromHotkey = useCallback(
    (id: string | null) => setSelectedIssueId(id),
    []
  );

  useEffect(() => {
    setIssueNavigation?.({
      activeIssueId: selectedIssueId,
      orderedIssueIds: orderedIds,
      onSelect: handleSelectIssueFromHotkey,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIssueId, orderedIdsKey, handleSelectIssueFromHotkey, setIssueNavigation]);

  useEffect(() => {
    return () => clearIssueNavigation?.();
  }, [clearIssueNavigation]);

  const handleCreateIssue = (defaultStatus?: IssueStatus) => {
    openCreateIssue({
      defaultTeamId: activeTeam?.id ?? null,
      defaultStatus:
        defaultStatus ?? (scope === "backlog" ? "BACKLOG" : "TODO"),
    });
  };

  const handleMoveIssue = (
    id: string,
    status: IssueStatus,
    sortOrder: number
  ) => {
    updateIssue.mutate({
      id,
      data: { status, sortOrder },
    });
  };

  const isLoading = teamsLoading || (Boolean(activeTeam) && issuesLoading);

  return (
    <WorkspaceShell>
      {/* Top Header Bar */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] bg-[var(--bg-elev)] border border-[var(--border)] text-[var(--text-3)]">
            <Users2 className="h-3 w-3" strokeWidth={1.5} />
          </div>
          <span className="text-[13px] font-medium tracking-tight text-[var(--text)] truncate">
            {activeTeam ? activeTeam.name : teamKey.toUpperCase()}
          </span>
          <span className="text-[12px] text-[var(--text-4)]">&rsaquo;</span>
          <span className="text-[12px] text-[var(--text-3)]">
            {scope === "backlog" ? "Backlog" : "All issues"}
          </span>
          <span className="rounded border border-[var(--border)] bg-[var(--bg-elev)] px-1.5 py-0.5 text-[11px] text-[var(--text-4)]">
            {filteredIssues.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="hidden sm:flex h-7 w-44 items-center gap-1.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] px-2">
            <Search
              className="h-3 w-3 text-[var(--text-4)] shrink-0"
              strokeWidth={1.5}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter issues..."
              className="w-full bg-transparent text-[12px] text-[var(--text)] placeholder:text-[var(--text-4)] focus:outline-none"
            />
          </div>

          {/* Board / List View Toggle */}
          <div className="flex items-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] p-0.5">
            <button
              type="button"
              title="List view"
              onClick={() => setIssueViewMode("list")}
              className={`flex h-6 items-center gap-1 rounded-[4px] px-2 text-[11px] font-medium transition-colors cursor-pointer ${
                issueViewMode === "list"
                  ? "bg-[rgba(255,255,255,0.08)] text-[var(--text)]"
                  : "text-[var(--text-4)] hover:text-[var(--text-2)]"
              }`}
            >
              <ListIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>List</span>
            </button>
            <button
              type="button"
              title="Board view"
              onClick={() => setIssueViewMode("board")}
              className={`flex h-6 items-center gap-1 rounded-[4px] px-2 text-[11px] font-medium transition-colors cursor-pointer ${
                issueViewMode === "board"
                  ? "bg-[rgba(255,255,255,0.08)] text-[var(--text)]"
                  : "text-[var(--text-4)] hover:text-[var(--text-2)]"
              }`}
            >
              <Columns3 className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>Board</span>
            </button>
          </div>

          {/* Create Issue */}
          <button
            type="button"
            onClick={() => handleCreateIssue()}
            className="flex h-7 items-center gap-1.5 rounded-[var(--radius)] bg-[var(--accent)] px-2.5 text-[12px] font-medium text-[var(--text)] hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            <span>New issue</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center text-[var(--text-3)]">
            <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.5} />
          </div>
        ) : !activeTeam ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center px-4">
            <p className="text-[13px] text-[var(--text-3)]">
              Team &ldquo;{teamKey.toUpperCase()}&rdquo; was not found in this
              workspace.
            </p>
          </div>
        ) : filteredIssues.length === 0 && issueViewMode === "list" ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center px-4 select-none">
            <p className="text-[13px] text-[var(--text-3)]">
              {scope === "backlog"
                ? `No backlog issues in ${activeTeam.name}`
                : `No issues in ${activeTeam.name} yet`}
            </p>
            <button
              type="button"
              onClick={() => handleCreateIssue()}
              className="mt-4 flex h-8 items-center gap-1.5 rounded-[var(--radius)] bg-[var(--accent)] px-3.5 text-[12px] font-medium text-[var(--text)] hover:bg-[var(--accent-hover)] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create issue</span>
            </button>
          </div>
        ) : issueViewMode === "board" ? (
          <KanbanBoard
            issues={filteredIssues}
            selectedIssueId={selectedIssueId}
            onSelectIssue={(id) => setSelectedIssueId(id)}
            onMoveIssue={handleMoveIssue}
            onCreateInStatus={(status) => handleCreateIssue(status)}
            statuses={
              scope === "backlog"
                ? ["BACKLOG", "TODO"]
                : ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]
            }
          />
        ) : (
          <VirtualIssueList
            issues={filteredIssues}
            selectedIssueId={selectedIssueId}
            onSelectIssue={(id) => setSelectedIssueId(id)}
            onCreateInStatus={(status) => handleCreateIssue(status)}
          />
        )}

        {selectedIssueId && (
          <IssueInspector
            issueId={selectedIssueId}
            onSelectIssue={(id) => setSelectedIssueId(id)}
            onClose={() => setSelectedIssueId(null)}
            onDeleted={() => setSelectedIssueId(null)}
          />
        )}
      </div>
    </WorkspaceShell>
  );
}
