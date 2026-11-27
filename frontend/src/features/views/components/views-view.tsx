"use client";

import { useMemo, useState } from "react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { IssueInspector } from "@/features/issues/components/issue-inspector";
import { useIssues } from "@/features/issues/hooks/use-issues";
import { useAuthStore } from "@/store/useAuthStore";
import { Issue, IssuePriority, IssueStatus } from "@/types/issue.types";
import {
  IssueStatusIcon,
  STATUS_LABELS,
} from "@/components/ui/issue-status-icon";
import {
  IssuePriorityIcon,
  PRIORITY_LABELS,
} from "@/components/ui/issue-priority-icon";
import {
  Layers,
  Plus,
  Search,
  UserCircle2,
  X,
  ArrowLeft,
  Trash2,
} from "lucide-react";

interface SavedView {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
  filters: {
    statuses?: IssueStatus[];
    priorities?: IssuePriority[];
    unassignedOnly?: boolean;
  };
}

const DEFAULT_VIEWS: SavedView[] = [
  {
    id: "all-issues",
    name: "All issues",
    description: "Every issue across your active workspace",
    isDefault: true,
    filters: {},
  },
  {
    id: "active-work",
    name: "Active issues",
    description: "Issues currently In Progress or In Review",
    isDefault: true,
    filters: { statuses: ["IN_PROGRESS", "IN_REVIEW"] },
  },
  {
    id: "high-priority",
    name: "Urgent & High priority",
    description: "Critical work requiring immediate attention",
    isDefault: true,
    filters: { priorities: ["URGENT", "HIGH"] },
  },
  {
    id: "backlog",
    name: "Backlog",
    description: "Unscheduled ideas and upcoming tasks",
    isDefault: true,
    filters: { statuses: ["BACKLOG"] },
  },
  {
    id: "unassigned",
    name: "Unassigned",
    description: "Issues waiting for an owner",
    isDefault: true,
    filters: { unassignedOnly: true },
  },
];

const STATUS_OPTIONS: IssueStatus[] = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
  "CANCELED",
];

const PRIORITY_OPTIONS: IssuePriority[] = [
  "URGENT",
  "HIGH",
  "MEDIUM",
  "LOW",
  "NO_PRIORITY",
];

function matchesView(issue: Issue, view: SavedView): boolean {
  const { statuses, priorities, unassignedOnly } = view.filters;
  if (statuses && statuses.length > 0 && !statuses.includes(issue.status)) {
    return false;
  }
  if (
    priorities &&
    priorities.length > 0 &&
    !priorities.includes(issue.priority)
  ) {
    return false;
  }
  if (unassignedOnly && issue.assigneeId) {
    return false;
  }
  return true;
}

export function ViewsView() {
  const { isAuthenticated } = useAuthStore();
  const { data: issues = [] } = useIssues(undefined, isAuthenticated);

  const [customViews, setCustomViews] = useState<SavedView[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "custom">("all");
  const [search, setSearch] = useState("");
  const [openedViewId, setOpenedViewId] = useState<string | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const [isCreatingView, setIsCreatingView] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [newViewDesc, setNewViewDesc] = useState("");
  const [newViewStatus, setNewViewStatus] = useState<IssueStatus | "ALL">(
    "ALL"
  );
  const [newViewPriority, setNewViewPriority] = useState<IssuePriority | "ALL">(
    "ALL"
  );

  const allViews = useMemo(
    () => [...customViews, ...DEFAULT_VIEWS],
    [customViews]
  );

  const visibleViews = useMemo(() => {
    const base = activeTab === "custom" ? customViews : allViews;
    if (!search.trim()) return base;
    const q = search.trim().toLowerCase();
    return base.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q)
    );
  }, [activeTab, allViews, customViews, search]);

  const openedView = allViews.find((v) => v.id === openedViewId) ?? null;

  const viewIssues = useMemo(() => {
    if (!openedView) return [];
    return issues.filter((issue) => matchesView(issue, openedView));
  }, [issues, openedView]);

  const handleCreateView = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newViewName.trim()) return;

    const created: SavedView = {
      id: `custom-${Date.now()}`,
      name: newViewName.trim(),
      description:
        newViewDesc.trim() ||
        [
          newViewStatus !== "ALL" ? STATUS_LABELS[newViewStatus] : null,
          newViewPriority !== "ALL" ? PRIORITY_LABELS[newViewPriority] : null,
        ]
          .filter(Boolean)
          .join(" · ") ||
        "Custom filtered view",
      filters: {
        ...(newViewStatus !== "ALL" ? { statuses: [newViewStatus] } : {}),
        ...(newViewPriority !== "ALL"
          ? { priorities: [newViewPriority] }
          : {}),
      },
    };

    setCustomViews((prev) => [created, ...prev]);
    setNewViewName("");
    setNewViewDesc("");
    setNewViewStatus("ALL");
    setNewViewPriority("ALL");
    setIsCreatingView(false);
    setOpenedViewId(created.id);
    setSelectedIssueId(null);
  };

  return (
    <WorkspaceShell>
      {/* Top Header Bar */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
        <div className="flex items-center gap-2.5">
          {openedView ? (
            <button
              type="button"
              onClick={() => {
                setOpenedViewId(null);
                setSelectedIssueId(null);
              }}
              className="flex items-center gap-1.5 text-[13px] text-[var(--text-3)] hover:text-[var(--text)] transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>Views</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Layers
                className="h-3.5 w-3.5 text-[var(--text-3)]"
                strokeWidth={1.5}
              />
              <span className="text-[13px] font-medium tracking-tight text-[var(--text)]">
                Views
              </span>
            </div>
          )}

          {openedView && (
            <>
              <span className="text-[12px] text-[var(--text-4)]">&rsaquo;</span>
              <span className="text-[13px] font-medium text-[var(--text)]">
                {openedView.name}
              </span>
              <span className="rounded bg-[var(--bg-elev)] border border-[var(--border)] px-1.5 py-0.5 text-[11px] text-[var(--text-4)]">
                {viewIssues.length}
              </span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsCreatingView(true)}
          className="flex h-7 items-center gap-1.5 rounded-[var(--radius)] bg-[var(--accent)] px-2.5 text-[12px] font-medium text-[var(--text)] hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          <span>New view</span>
        </button>
      </header>

      {/* Create View Modal */}
      {isCreatingView && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-24"
          onClick={() => setIsCreatingView(false)}
        >
          <form
            onSubmit={handleCreateView}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[440px] rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-medium text-[var(--text)]">
                Create custom view
              </h2>
              <button
                type="button"
                onClick={() => setIsCreatingView(false)}
                className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-4)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)] cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[12px] text-[var(--text-3)] mb-1">
                  Name
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  placeholder="e.g., Urgent Bugs"
                  className="h-8 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-2.5 text-[13px] text-[var(--text)] placeholder:text-[var(--text-4)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-[12px] text-[var(--text-3)] mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newViewDesc}
                  onChange={(e) => setNewViewDesc(e.target.value)}
                  placeholder="Optional summary..."
                  className="h-8 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-2.5 text-[13px] text-[var(--text)] placeholder:text-[var(--text-4)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] text-[var(--text-3)] mb-1">
                    Status filter
                  </label>
                  <select
                    value={newViewStatus}
                    onChange={(e) =>
                      setNewViewStatus(e.target.value as IssueStatus | "ALL")
                    }
                    className="h-8 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-2 text-[12px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="ALL">Any status</option>
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {STATUS_LABELS[st]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] text-[var(--text-3)] mb-1">
                    Priority filter
                  </label>
                  <select
                    value={newViewPriority}
                    onChange={(e) =>
                      setNewViewPriority(
                        e.target.value as IssuePriority | "ALL"
                      )
                    }
                    className="h-8 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-2 text-[12px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="ALL">Any priority</option>
                    {PRIORITY_OPTIONS.map((pr) => (
                      <option key={pr} value={pr}>
                        {PRIORITY_LABELS[pr]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreatingView(false)}
                className="h-7 px-3 text-[12px] text-[var(--text-3)] hover:text-[var(--text)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newViewName.trim()}
                className="h-7 rounded-[var(--radius)] bg-[var(--accent)] px-3 text-[12px] font-medium text-[var(--text)] hover:bg-[var(--accent-hover)] disabled:opacity-40 cursor-pointer"
              >
                Create view
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Body */}
      {!openedView ? (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Sub-header Tabs & Search */}
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: "all", label: "All views" },
                  { id: "custom", label: "Your views" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`h-6 rounded-full border px-2.5 text-[12px] transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? "border-[var(--border-strong)] bg-[rgba(255,255,255,0.08)] font-medium text-[var(--text)]"
                      : "border-[var(--border)] text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex h-7 w-56 items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] px-2">
              <Search
                className="h-3.5 w-3.5 text-[var(--text-4)] shrink-0"
                strokeWidth={1.5}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter views..."
                className="w-full bg-transparent text-[12px] text-[var(--text)] placeholder:text-[var(--text-4)] focus:outline-none"
              />
            </div>
          </div>

          {/* Views List */}
          <div className="flex-1 overflow-y-auto">
            {visibleViews.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-4 text-center select-none">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-panel)] text-[var(--text-3)]">
                  <Layers className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <p className="text-[13px] font-medium text-[var(--text)]">
                  No custom views yet
                </p>
                <p className="mt-1 max-w-xs text-[12px] text-[var(--text-3)]">
                  Save filtered issue lists as reusable views for quick access.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreatingView(true)}
                  className="mt-4 flex h-8 items-center gap-1.5 rounded-[var(--radius)] bg-[var(--accent)] px-3.5 text-[12px] font-medium text-[var(--text)] hover:bg-[var(--accent-hover)] cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create view</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {visibleViews.map((view) => {
                  const count = issues.filter((i) =>
                    matchesView(i, view)
                  ).length;
                  return (
                    <div
                      key={view.id}
                      onClick={() => {
                        setOpenedViewId(view.id);
                        setSelectedIssueId(null);
                      }}
                      className="group flex h-12 items-center justify-between px-4 hover:bg-[rgba(255,255,255,0.03)] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] text-[var(--text-3)]">
                          <Layers className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-medium text-[var(--text)] truncate">
                              {view.name}
                            </span>
                            {!view.isDefault && (
                              <span className="rounded border border-[var(--border)] bg-[var(--bg-elev)] px-1.5 py-0.2 text-[10px] text-[var(--text-4)]">
                                Custom
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[var(--text-4)] truncate">
                            {view.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[12px] text-[var(--text-4)]">
                          {count} {count === 1 ? "issue" : "issues"}
                        </span>
                        {!view.isDefault && (
                          <button
                            type="button"
                            title="Delete view"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCustomViews((prev) =>
                                prev.filter((v) => v.id !== view.id)
                              );
                            }}
                            className="opacity-0 group-hover:opacity-100 flex h-6 w-6 items-center justify-center rounded text-[var(--text-4)] hover:bg-[var(--bg-hover)] hover:text-[var(--danger)] transition-all cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Opened View Issue List + Inspector */
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)]">
            {viewIssues.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center px-4">
                <p className="text-[13px] text-[var(--text-3)]">
                  No issues match &ldquo;{openedView.name}&rdquo;
                </p>
              </div>
            ) : (
              viewIssues.map((issue) => (
                <div
                  key={issue.id}
                  onClick={() => setSelectedIssueId(issue.id)}
                  className={`flex h-10 items-center gap-3 px-4 transition-colors cursor-pointer ${
                    selectedIssueId === issue.id
                      ? "bg-[rgba(255,255,255,0.06)]"
                      : "hover:bg-[rgba(255,255,255,0.025)]"
                  }`}
                >
                  <IssuePriorityIcon
                    priority={issue.priority}
                    className="h-3.5 w-3.5 shrink-0"
                  />
                  <span className="w-16 shrink-0 text-[12px] font-medium text-[var(--text-4)]">
                    {issue.identifier}
                  </span>
                  <IssueStatusIcon
                    status={issue.status}
                    className="h-3.5 w-3.5 shrink-0"
                  />
                  <span className="flex-1 truncate text-[13px] font-medium text-[var(--text)]">
                    {issue.title}
                  </span>
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
                </div>
              ))
            )}
          </div>

          {selectedIssueId && (
            <IssueInspector
              issueId={selectedIssueId}
              onSelectIssue={(id) => setSelectedIssueId(id)}
              onClose={() => setSelectedIssueId(null)}
              onDeleted={() => setSelectedIssueId(null)}
            />
          )}
        </div>
      )}
    </WorkspaceShell>
  );
}
