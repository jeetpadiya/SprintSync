"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { KanbanBoard } from "@/features/issues/components/board/kanban-board";
import { VirtualIssueList } from "@/features/issues/components/list/virtual-issue-list";
import { IssueInspector } from "@/features/issues/components/issue-inspector";
import {
  useCloseCycle,
  useCreateCycle,
  useCycles,
} from "@/features/cycles/hooks/use-cycles";
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
  CheckCircle2,
  Columns3,
  List as ListIcon,
  Loader2,
  Plus,
  Repeat,
  RotateCw,
  Users2,
} from "lucide-react";

interface TeamCyclesViewProps {
  teamKey?: string;
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const e = new Date(end).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return `${s} – ${e}`;
}

export function TeamCyclesView({ teamKey }: TeamCyclesViewProps) {
  const { isAuthenticated } = useAuthStore();
  const { openCreateIssue } = useModalStore();
  const issueViewMode = useUIStore((s) => s.issueViewMode);
  const setIssueViewMode = useUIStore((s) => s.setIssueViewMode);
  const setIssueNavigation = useUIStore((s) => s.setIssueNavigation);
  const clearIssueNavigation = useUIStore((s) => s.clearIssueNavigation);

  const { data: teams = [], isLoading: teamsLoading } = useTeams(
    undefined,
    isAuthenticated
  );

  const activeTeam =
    (teamKey
      ? teams.find((t) => t.key.toLowerCase() === teamKey.toLowerCase())
      : teams[0]) ?? null;

  const { data: cycles = [], isLoading: cyclesLoading } = useCycles(
    activeTeam?.id,
    Boolean(activeTeam) && isAuthenticated
  );
  const { data: teamIssues = [] } = useIssues(
    activeTeam ? { teamId: activeTeam.id } : undefined,
    Boolean(activeTeam) && isAuthenticated
  );

  const createCycle = useCreateCycle();
  const closeCycle = useCloseCycle();
  const updateIssue = useUpdateIssue();

  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [isLinkingIssue, setIsLinkingIssue] = useState(false);
  const [isCloseMenuOpen, setIsCloseMenuOpen] = useState(false);

  const activeCycle =
    cycles.find((c) => c.status === "ACTIVE") ?? cycles[0] ?? null;

  const inspectedCycle =
    cycles.find((c) => c.id === selectedCycleId) ?? activeCycle;

  const cycleIssues = useMemo(() => {
    if (!inspectedCycle) return [];
    return teamIssues.filter((i) => i.cycleId === inspectedCycle.id);
  }, [teamIssues, inspectedCycle]);

  const unscheduledIssues = useMemo(() => {
    if (!inspectedCycle) return [];
    return teamIssues.filter(
      (i) => i.cycleId !== inspectedCycle.id && i.status !== "DONE" && i.status !== "CANCELED"
    );
  }, [teamIssues, inspectedCycle]);

  const orderedIds = useMemo(
    () => cycleIssues.map((i) => i.id),
    [cycleIssues]
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

  const metrics = inspectedCycle?.metrics ?? {
    totalIssues: cycleIssues.length,
    completedIssues: cycleIssues.filter(
      (i) => i.status === "DONE" || i.status === "CANCELED"
    ).length,
    inProgressIssues: cycleIssues.filter(
      (i) => i.status === "IN_PROGRESS" || i.status === "IN_REVIEW"
    ).length,
    totalPoints: cycleIssues.reduce((acc, i) => acc + (i.estimate ?? 0), 0),
    completedPoints: cycleIssues
      .filter((i) => i.status === "DONE" || i.status === "CANCELED")
      .reduce((acc, i) => acc + (i.estimate ?? 0), 0),
    progressPercentage: 0,
    pointsPercentage: 0,
  };

  const handleCreateCycleIssue = (defaultStatus?: IssueStatus) => {
    openCreateIssue({
      defaultTeamId: activeTeam?.id ?? null,
      defaultCycleId: inspectedCycle?.id ?? null,
      defaultStatus: defaultStatus ?? "TODO",
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

  const isLoading = teamsLoading || (Boolean(activeTeam) && cyclesLoading);

  return (
    <WorkspaceShell>
      {/* Top Header */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border border-[var(--border)] bg-[var(--bg-elev)] text-[var(--text-3)]">
            <Users2 className="h-3 w-3" strokeWidth={1.5} />
          </div>
          <span className="truncate text-[13px] font-medium text-[var(--text)]">
            {activeTeam ? activeTeam.name : "Cycles"}
          </span>
          <span className="text-[12px] text-[var(--text-4)]">&rsaquo;</span>
          <span className="text-[12px] text-[var(--text-3)]">Cycles</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Board / List Toggle */}
          <div className="flex items-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] p-0.5">
            <button
              type="button"
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

          {activeTeam && (
            <button
              type="button"
              disabled={createCycle.isPending}
              onClick={() => createCycle.mutate({ teamId: activeTeam.id })}
              className="flex h-7 items-center gap-1.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-2.5 text-[12px] font-medium text-[var(--text-2)] hover:border-[var(--border-strong)] hover:text-[var(--text)] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span>New cycle</span>
            </button>
          )}

          {inspectedCycle && (
            <button
              type="button"
              onClick={() => handleCreateCycleIssue()}
              className="flex h-7 items-center gap-1.5 rounded-[var(--radius)] bg-[var(--accent)] px-2.5 text-[12px] font-medium text-[var(--text)] hover:bg-[var(--accent-hover)] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              <span>Add issue</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center text-[var(--text-3)]">
            <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.5} />
          </div>
        ) : !activeTeam || !inspectedCycle ? (
          <div className="flex flex-1 items-center justify-center text-[13px] text-[var(--text-3)]">
            No cycles available for this team.
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Cycle Selector Strip + Active Dashboard Card */}
            <div className="shrink-0 border-b border-[var(--border)] bg-[var(--bg-panel)]/50 px-5 py-4 space-y-4">
              {/* Cycle Pills Strip */}
              <div className="flex flex-wrap items-center gap-1.5">
                {cycles.map((c) => {
                  const isSelected = c.id === inspectedCycle.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCycleId(c.id);
                        setSelectedIssueId(null);
                      }}
                      className={`flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-[11px] transition-colors cursor-pointer ${
                        isSelected
                          ? "border-[var(--border-strong)] bg-[rgba(255,255,255,0.08)] font-medium text-[var(--text)]"
                          : "border-[var(--border)] text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          c.status === "ACTIVE"
                            ? "bg-[var(--success)]"
                            : c.status === "UPCOMING"
                              ? "bg-[var(--accent)]"
                              : "bg-[var(--text-4)]"
                        }`}
                      />
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Cycle Scope & Progress Summary */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <Repeat
                      className="h-4 w-4 text-[var(--accent)]"
                      strokeWidth={1.75}
                    />
                    <h1 className="text-[16px] font-medium text-[var(--text)]">
                      {inspectedCycle.name}
                    </h1>
                    <span className="rounded-full border border-[var(--border)] bg-[var(--bg-elev)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-3)]">
                      {inspectedCycle.status}
                    </span>
                    <span className="text-[12px] text-[var(--text-4)]">
                      {formatDateRange(
                        inspectedCycle.startsAt,
                        inspectedCycle.endsAt
                      )}
                    </span>
                  </div>
                  <p className="text-[12px] text-[var(--text-3)]">
                    Scope:{" "}
                    <span className="text-[var(--text-2)] font-medium">
                      {metrics.completedIssues}/{metrics.totalIssues} issues
                    </span>{" "}
                    · Story points:{" "}
                    <span className="text-[var(--text-2)] font-medium">
                      {metrics.completedPoints}/{metrics.totalPoints} pts
                    </span>{" "}
                    ({metrics.progressPercentage}% completed)
                  </p>
                </div>

                {/* Cycle Actions: Link existing / Close & Rollover */}
                <div className="flex items-center gap-2">
                  {inspectedCycle.status !== "COMPLETED" && (
                    <button
                      type="button"
                      onClick={() => setIsLinkingIssue((v) => !v)}
                      className="flex h-7 items-center gap-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-2.5 text-[12px] text-[var(--text-2)] hover:border-[var(--border-strong)] cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add existing issue</span>
                    </button>
                  )}

                  {inspectedCycle.status === "ACTIVE" && (
                    <div className="relative">
                      <button
                        type="button"
                        disabled={closeCycle.isPending}
                        onClick={() => setIsCloseMenuOpen((v) => !v)}
                        className="flex h-7 items-center gap-1.5 rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--bg-elev)] px-2.5 text-[12px] font-medium text-[var(--text)] hover:bg-[var(--bg-hover)] cursor-pointer"
                      >
                        <RotateCw className="h-3 w-3 text-[var(--warning)]" />
                        <span>
                          {closeCycle.isPending
                            ? "Closing..."
                            : "Close & rollover"}
                        </span>
                      </button>

                      {isCloseMenuOpen && (
                        <div className="absolute right-0 top-full mt-1 z-40 w-64 rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--bg-panel)] p-1.5 shadow-xl space-y-1">
                          <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-[var(--text-4)]">
                            Automated rollover
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsCloseMenuOpen(false);
                              closeCycle.mutate({
                                id: inspectedCycle.id,
                                rolloverTarget: "NEXT_CYCLE",
                              });
                            }}
                            className="flex w-full flex-col rounded px-2 py-1.5 text-left hover:bg-[var(--bg-hover)] cursor-pointer"
                          >
                            <span className="text-[12px] font-medium text-[var(--text)]">
                              Roll over to next cycle
                            </span>
                            <span className="text-[11px] text-[var(--text-4)]">
                              Move unfinished issues into the next 2-week sprint
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsCloseMenuOpen(false);
                              closeCycle.mutate({
                                id: inspectedCycle.id,
                                rolloverTarget: "BACKLOG",
                              });
                            }}
                            className="flex w-full flex-col rounded px-2 py-1.5 text-left hover:bg-[var(--bg-hover)] cursor-pointer"
                          >
                            <span className="text-[12px] font-medium text-[var(--text)]">
                              Return to Backlog
                            </span>
                            <span className="text-[11px] text-[var(--text-4)]">
                              Move unfinished issues back to team Backlog
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Dual Progress Bars (Issues + Story Points) */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-[var(--text-4)]">
                    <span>Issue scope progress</span>
                    <span className="text-[var(--text-2)]">
                      {metrics.progressPercentage}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-elev)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                      style={{ width: `${metrics.progressPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-[var(--text-4)]">
                    <span>Story points burnup</span>
                    <span className="text-[var(--text-2)]">
                      {metrics.completedPoints} / {metrics.totalPoints} pts (
                      {metrics.pointsPercentage}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-elev)]">
                    <div
                      className="h-full rounded-full bg-[var(--success)] transition-all duration-300"
                      style={{ width: `${metrics.pointsPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {isLinkingIssue && (
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (!e.target.value) return;
                    updateIssue.mutate({
                      id: e.target.value,
                      data: { cycleId: inspectedCycle.id },
                    });
                    setIsLinkingIssue(false);
                  }}
                  className="h-7 w-full max-w-md rounded border border-[var(--border)] bg-[var(--bg)] px-2 text-[12px] text-[var(--text)]"
                >
                  <option value="">
                    Select an existing {activeTeam.key} issue to add to{" "}
                    {inspectedCycle.name}...
                  </option>
                  {unscheduledIssues.map((iss) => (
                    <option key={iss.id} value={iss.id}>
                      {iss.identifier} · {iss.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Cycle Issues View (Board or Virtualized List) */}
            {inspectedCycle.status === "COMPLETED" && cycleIssues.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center px-4">
                <CheckCircle2
                  className="mb-3 h-8 w-8 text-[var(--success)]"
                  strokeWidth={1.5}
                />
                <p className="text-[13px] font-medium text-[var(--text)]">
                  {inspectedCycle.name} completed
                </p>
                <p className="mt-1 text-[12px] text-[var(--text-4)]">
                  Completed {inspectedCycle.completedIssuesCount}/
                  {inspectedCycle.totalIssuesCount} issues (
                  {inspectedCycle.completedPoints}/{inspectedCycle.totalPoints}{" "}
                  pts).
                </p>
              </div>
            ) : cycleIssues.length === 0 && issueViewMode === "list" ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center px-4 select-none">
                <p className="text-[13px] text-[var(--text-3)]">
                  No issues assigned to {inspectedCycle.name} yet
                </p>
                <button
                  type="button"
                  onClick={() => handleCreateCycleIssue()}
                  className="mt-4 flex h-8 items-center gap-1.5 rounded-[var(--radius)] bg-[var(--accent)] px-3.5 text-[12px] font-medium text-[var(--text)] hover:bg-[var(--accent-hover)] cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add issue to cycle</span>
                </button>
              </div>
            ) : issueViewMode === "board" ? (
              <KanbanBoard
                issues={cycleIssues}
                selectedIssueId={selectedIssueId}
                onSelectIssue={(id) => setSelectedIssueId(id)}
                onMoveIssue={handleMoveIssue}
                onCreateInStatus={(status) => handleCreateCycleIssue(status)}
              />
            ) : (
              <VirtualIssueList
                issues={cycleIssues}
                selectedIssueId={selectedIssueId}
                onSelectIssue={(id) => setSelectedIssueId(id)}
                onCreateInStatus={(status) => handleCreateCycleIssue(status)}
              />
            )}
          </div>
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
