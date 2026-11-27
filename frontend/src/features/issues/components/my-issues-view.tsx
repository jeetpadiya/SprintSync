"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { IssueInspector } from "@/features/issues/components/issue-inspector";
import { useAuthStore } from "@/store/useAuthStore";
import { useModalStore } from "@/store/useModalStore";
import { useUIStore } from "@/store/useUIStore";
import { useIssues } from "@/features/issues/hooks/use-issues";
import { Issue, IssueStatus } from "@/types/issue.types";
import {
  IssueStatusIcon,
  STATUS_LABELS,
} from "@/components/ui/issue-status-icon";
import {
  IssuePriorityIcon,
  PRIORITY_LABELS,
} from "@/components/ui/issue-priority-icon";
import {
  Plus,
  ListFilter,
  SlidersHorizontal,
  PanelRight,
  UserCircle2,
  Check,
  Loader2,
  CornerDownRight,
} from "lucide-react";

type MyIssuesTab = "assigned" | "created" | "subscribed" | "activity";

const TABS: { id: MyIssuesTab; label: string }[] = [
  { id: "assigned", label: "Assigned" },
  { id: "created", label: "Created" },
  { id: "subscribed", label: "Subscribed" },
  { id: "activity", label: "Activity" },
];

const STATUS_OPTIONS: IssueStatus[] = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
  "CANCELED",
];

export function MyIssuesView() {
  const { user, isAuthenticated } = useAuthStore();
  const { openCreateIssue } = useModalStore();
  const setIssueNavigation = useUIStore((s) => s.setIssueNavigation);
  const clearIssueNavigation = useUIStore((s) => s.clearIssueNavigation);

  const [activeTab, setActiveTab] = useState<MyIssuesTab>("assigned");
  const [statusFilter, setStatusFilter] = useState<IssueStatus | "ALL">("ALL");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showInspector, setShowInspector] = useState(true);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const { data: issues = [], isLoading } = useIssues(undefined, isAuthenticated);

  const tabFilteredIssues = useMemo(() => {
    if (!user?.id) return [];

    let list: Issue[];
    switch (activeTab) {
      case "assigned":
        list = issues.filter((issue) => issue.assigneeId === user.id);
        break;
      case "created":
        list = issues.filter((issue) => issue.creatorId === user.id);
        break;
      case "subscribed":
        list = issues.filter(
          (issue) =>
            issue.assigneeId === user.id || issue.creatorId === user.id
        );
        break;
      case "activity":
        list = [...issues].sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        break;
      default:
        list = [];
    }

    if (statusFilter !== "ALL") {
      list = list.filter((issue) => issue.status === statusFilter);
    }

    return list;
  }, [issues, activeTab, statusFilter, user?.id]);

  // If inspector is visible and user hasn't picked a row yet, show the first visible issue automatically
  const effectiveSelectedId =
    selectedIssueId ?? tabFilteredIssues[0]?.id ?? null;

  const orderedIds = useMemo(
    () => tabFilteredIssues.map((i) => i.id),
    [tabFilteredIssues]
  );
  const orderedIdsKey = orderedIds.join(",");

  const handleSelectIssueFromHotkey = useCallback((id: string | null) => {
    setSelectedIssueId(id);
    if (id) setShowInspector(true);
  }, []);

  useEffect(() => {
    setIssueNavigation?.({
      activeIssueId: effectiveSelectedId,
      orderedIssueIds: orderedIds,
      onSelect: handleSelectIssueFromHotkey,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveSelectedId, orderedIdsKey, handleSelectIssueFromHotkey, setIssueNavigation]);

  useEffect(() => {
    return () => clearIssueNavigation?.();
  }, [clearIssueNavigation]);

  const handleOpenNewIssue = () => {
    openCreateIssue({
      defaultStatus: "BACKLOG",
      defaultAssigneeId:
        activeTab === "assigned" && user?.id ? user.id : null,
    });
  };

  const emptyStateCopy: Record<MyIssuesTab, string> = {
    assigned: "No issues assigned to you",
    created: "No issues created by you",
    subscribed: "No subscribed issues",
    activity: "No recent issue activity",
  };

  return (
    <WorkspaceShell>
      {/* Top Header Bar */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
        <span className="text-[13px] font-medium tracking-tight text-[var(--text)]">
          My Issues
        </span>

        <button
          type="button"
          onClick={handleOpenNewIssue}
          className="flex h-7 items-center gap-1.5 rounded-[var(--radius)] px-2 text-[12px] font-medium text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)] transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
          <span>New issue</span>
        </button>
      </header>

      {/* Sub-header Bar */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
        <div className="flex items-center gap-1.5">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedIssueId(null);
                }}
                className={`h-6 rounded-full border px-2.5 text-[12px] transition-colors cursor-pointer ${
                  isActive
                    ? "border-[var(--border-strong)] bg-[rgba(255,255,255,0.08)] font-medium text-[var(--text)]"
                    : "border-[var(--border)] bg-transparent text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <div className="relative">
            <button
              type="button"
              title="Filter issues"
              onClick={() => setIsFilterOpen((v) => !v)}
              className={`flex h-6 w-6 items-center justify-center rounded border transition-colors cursor-pointer ${
                statusFilter !== "ALL"
                  ? "border-[var(--accent)] bg-[rgba(94,106,210,0.15)] text-[var(--text)]"
                  : "border-[var(--border)] text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
              }`}
            >
              <ListFilter className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 top-full mt-1 z-40 w-40 rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--bg-panel)] p-1 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("ALL");
                    setIsFilterOpen(false);
                  }}
                  className={`flex h-7 w-full items-center justify-between rounded px-2 text-[12px] cursor-pointer ${
                    statusFilter === "ALL"
                      ? "bg-[rgba(255,255,255,0.06)] text-[var(--text)] font-medium"
                      : "text-[var(--text-3)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  <span>All statuses</span>
                  {statusFilter === "ALL" && (
                    <Check className="h-3 w-3 text-[var(--accent)]" />
                  )}
                </button>
                {STATUS_OPTIONS.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setStatusFilter(st);
                      setIsFilterOpen(false);
                    }}
                    className={`flex h-7 w-full items-center justify-between rounded px-2 text-[12px] cursor-pointer ${
                      statusFilter === st
                        ? "bg-[rgba(255,255,255,0.06)] text-[var(--text)] font-medium"
                        : "text-[var(--text-3)] hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <IssueStatusIcon status={st} className="h-3.5 w-3.5" />
                      <span>{STATUS_LABELS[st]}</span>
                    </span>
                    {statusFilter === st && (
                      <Check className="h-3 w-3 text-[var(--accent)]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            title="Display options"
            className="flex h-6 w-6 items-center justify-center rounded border border-[var(--border)] text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)] transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>

          <button
            type="button"
            title="Toggle detail inspector"
            onClick={() => setShowInspector((v) => !v)}
            className={`flex h-6 w-6 items-center justify-center rounded border transition-colors cursor-pointer ${
              showInspector && effectiveSelectedId
                ? "border-[var(--border-strong)] bg-[rgba(255,255,255,0.06)] text-[var(--text)]"
                : "border-[var(--border)] text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
            }`}
          >
            <PanelRight className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center text-[var(--text-3)]">
            <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.5} />
          </div>
        ) : tabFilteredIssues.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 text-center select-none">
            <div className="mb-4 text-[var(--text-4)]">
              <svg
                className="h-20 w-20"
                viewBox="0 0 80 80"
                fill="none"
                stroke="currentColor"
              >
                <circle
                  cx="40"
                  cy="40"
                  r="12"
                  strokeWidth="1.5"
                  className="text-[var(--text-2)]"
                />
                <ellipse
                  cx="40"
                  cy="40"
                  rx="24"
                  ry="10"
                  strokeWidth="1.25"
                  strokeDasharray="3 3"
                  className="text-[var(--text-4)] opacity-60"
                />
                <path
                  d="M16 32c-4 2.5-6 5.2-6 8s2 5.5 6 8M64 32c4 2.5 6 5.2 6 8s-2 5.5-6 8"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="text-[var(--text-4)] opacity-70"
                />
                <path
                  d="M32 16c2.5-4 5.2-6 8-6s5.5 2 8 6M32 64c2.5 4 5.2 6 8 6s5.5-2 8-6"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="text-[var(--text-4)] opacity-70"
                />
              </svg>
            </div>
            <p className="text-[13px] font-normal text-[var(--text-3)]">
              {statusFilter !== "ALL"
                ? `No ${STATUS_LABELS[statusFilter].toLowerCase()} issues found`
                : emptyStateCopy[activeTab]}
            </p>
            <button
              type="button"
              onClick={handleOpenNewIssue}
              className="mt-4 flex h-8 items-center rounded-[var(--radius)] bg-[var(--accent)] px-3.5 text-[12px] font-medium text-[var(--text)] hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
            >
              Create new issue
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)]">
            {tabFilteredIssues.map((issue) => {
              const isSelected = effectiveSelectedId === issue.id;
              return (
                <div
                  key={issue.id}
                  onClick={() => {
                    setSelectedIssueId(issue.id);
                    setShowInspector(true);
                  }}
                  className={`group flex h-10 items-center gap-3 px-4 transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[rgba(255,255,255,0.06)]"
                      : "hover:bg-[rgba(255,255,255,0.025)]"
                  }`}
                >
                  <span className="shrink-0" title={PRIORITY_LABELS[issue.priority]}>
                    <IssuePriorityIcon
                      priority={issue.priority}
                      className="h-3.5 w-3.5"
                    />
                  </span>

                  <span className="w-16 shrink-0 text-[12px] font-medium text-[var(--text-4)]">
                    {issue.identifier}
                  </span>

                  <span className="shrink-0" title={STATUS_LABELS[issue.status]}>
                    <IssueStatusIcon
                      status={issue.status}
                      className="h-3.5 w-3.5"
                    />
                  </span>

                  <span className="flex flex-1 items-center gap-2 min-w-0">
                    {issue.parentId && (
                      <CornerDownRight
                        className="h-3 w-3 shrink-0 text-[var(--text-4)]"
                        strokeWidth={1.5}
                      />
                    )}
                    <span className="truncate text-[13px] font-medium text-[var(--text)]">
                      {issue.title}
                    </span>
                  </span>

                  <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                    {issue.labels?.slice(0, 3).map((lbl) => (
                      <span
                        key={lbl.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-elev)] px-2 py-0.5 text-[11px] text-[var(--text-3)]"
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: lbl.color }}
                        />
                        <span>{lbl.name}</span>
                      </span>
                    ))}
                  </div>

                  {issue.estimate !== null && issue.estimate !== undefined && (
                    <span className="hidden md:inline-flex items-center gap-0.5 rounded border border-[var(--border)] bg-[var(--bg-elev)] px-1.5 py-0.5 text-[11px] text-[var(--text-4)] shrink-0">
                      {issue.estimate}pt
                    </span>
                  )}

                  <div className="shrink-0">
                    {issue.assignee ? (
                      <span
                        title={issue.assignee.name}
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f59e0b] text-[10px] font-medium text-[#08090a]"
                      >
                        {issue.assignee.name.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <UserCircle2
                        className="h-4 w-4 text-[var(--text-4)]"
                        strokeWidth={1.5}
                      />
                    )}
                  </div>

                  <span className="w-16 text-right text-[11px] text-[var(--text-4)] shrink-0">
                    {new Date(issue.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {showInspector && effectiveSelectedId && (
          <IssueInspector
            issueId={effectiveSelectedId}
            onSelectIssue={(id) => {
              setSelectedIssueId(id);
              setShowInspector(true);
            }}
            onClose={() => setShowInspector(false)}
            onDeleted={() => setSelectedIssueId(null)}
          />
        )}
      </div>
    </WorkspaceShell>
  );
}
