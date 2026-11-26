"use client";

import { useState, useMemo } from "react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { useAuthStore } from "@/store/useAuthStore";
import { useModalStore } from "@/store/useModalStore";
import {
  useAddIssueRelation,
  useDeleteIssue,
  useDeleteIssueRelation,
  useIssue,
  useIssues,
  useLabels,
  useUpdateIssue,
  useWorkspaceMembers,
} from "@/features/issues/hooks/use-issues";
import {
  Issue,
  IssuePriority,
  IssueRelationType,
  IssueStatus,
} from "@/types/issue.types";
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
  Trash2,
  UserCircle2,
  Hash,
  Tag,
  Check,
  Loader2,
  X,
  GitBranch,
  Link2,
  Calendar,
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

const PRIORITY_OPTIONS: IssuePriority[] = [
  "NO_PRIORITY",
  "URGENT",
  "HIGH",
  "MEDIUM",
  "LOW",
];

const ESTIMATE_OPTIONS: (number | null)[] = [null, 1, 2, 3, 5, 8];

const RELATION_LABELS: Record<IssueRelationType, string> = {
  BLOCKS: "Blocks",
  BLOCKED_BY: "Blocked by",
  DUPLICATE: "Duplicate of",
  RELATED: "Related to",
};

const RELATION_OPTIONS: IssueRelationType[] = [
  "BLOCKS",
  "BLOCKED_BY",
  "DUPLICATE",
  "RELATED",
];

export function MyIssuesView() {
  const { user, isAuthenticated } = useAuthStore();
  const { openCreateIssue } = useModalStore();

  const [activeTab, setActiveTab] = useState<MyIssuesTab>("assigned");
  const [statusFilter, setStatusFilter] = useState<IssueStatus | "ALL">("ALL");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showInspector, setShowInspector] = useState(true);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editingDesc, setEditingDesc] = useState<string | null>(null);

  const [isAddingParent, setIsAddingParent] = useState(false);
  const [isAddingRelation, setIsAddingRelation] = useState(false);
  const [relationType, setRelationType] = useState<IssueRelationType>("BLOCKS");
  const [relationTargetId, setRelationTargetId] = useState<string>("");

  const { data: issues = [], isLoading } = useIssues(undefined, isAuthenticated);
  const { data: detailIssue } = useIssue(
    showInspector ? selectedIssueId : null,
    isAuthenticated
  );
  const { data: members = [] } = useWorkspaceMembers(undefined, isAuthenticated);
  const { data: allLabels = [] } = useLabels(undefined, isAuthenticated);

  const updateIssue = useUpdateIssue();
  const deleteIssue = useDeleteIssue();
  const addRelation = useAddIssueRelation();
  const deleteRelation = useDeleteIssueRelation();

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

  // Allow inspecting a clicked sub-issue, parent, or related issue even if it belongs to another tab
  const fallbackSelected =
    issues.find((i) => i.id === selectedIssueId) ?? null;
  const selectedIssue =
    (detailIssue && detailIssue.id === selectedIssueId ? detailIssue : null) ??
    fallbackSelected;

  const selectIssue = (id: string) => {
    setSelectedIssueId(id);
    setEditingTitle(null);
    setEditingDesc(null);
    setIsAddingParent(false);
    setIsAddingRelation(false);
    setRelationTargetId("");
    setShowInspector(true);
  };

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

  const subIssues = selectedIssue?.subIssues ?? [];
  const completedSubCount = subIssues.filter(
    (s) => s.status === "DONE" || s.status === "CANCELED"
  ).length;
  const relations = selectedIssue?.relations ?? [];

  const availableParentCandidates = issues.filter(
    (i) =>
      i.id !== selectedIssue?.id &&
      !subIssues.some((sub) => sub.id === i.id)
  );
  const availableRelationCandidates = issues.filter(
    (i) => i.id !== selectedIssue?.id
  );

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
              showInspector && selectedIssue
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
              const isSelected = selectedIssueId === issue.id;
              return (
                <div
                  key={issue.id}
                  onClick={() => selectIssue(issue.id)}
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

        {/* Right-Hand Issue Detail & Edit Inspector */}
        {showInspector && selectedIssue && (
          <aside className="w-[400px] shrink-0 border-l border-[var(--border)] bg-[var(--bg-panel)] overflow-y-auto p-5 space-y-5">
            {/* Top Meta + Parent Breadcrumb */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                {selectedIssue.parent && (
                  <>
                    <button
                      type="button"
                      onClick={() => selectIssue(selectedIssue.parent!.id)}
                      className="truncate max-w-[140px] rounded bg-[var(--bg-elev)] border border-[var(--border)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--text-3)] hover:text-[var(--text)] hover:border-[var(--border-strong)] cursor-pointer"
                    >
                      {selectedIssue.parent.identifier}
                    </button>
                    <span className="text-[12px] text-[var(--text-4)]">&rsaquo;</span>
                  </>
                )}
                <span className="text-[12px] font-medium text-[var(--text-2)]">
                  {selectedIssue.identifier}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  title="Delete issue"
                  onClick={() => {
                    deleteIssue.mutate(selectedIssue.id, {
                      onSuccess: () => setSelectedIssueId(null),
                    });
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-4)] hover:bg-[var(--bg-hover)] hover:text-[var(--danger)] transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  title="Close inspector"
                  onClick={() => setShowInspector(false)}
                  className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-4)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)] transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Editable Title */}
            <input
              type="text"
              value={editingTitle !== null ? editingTitle : selectedIssue.title}
              onChange={(e) => setEditingTitle(e.target.value)}
              onBlur={() => {
                if (
                  editingTitle !== null &&
                  editingTitle.trim() &&
                  editingTitle.trim() !== selectedIssue.title
                ) {
                  updateIssue.mutate({
                    id: selectedIssue.id,
                    data: { title: editingTitle.trim() },
                  });
                }
                setEditingTitle(null);
              }}
              className="w-full bg-transparent text-[16px] font-medium text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] rounded px-1 -mx-1"
            />

            {/* Editable Description */}
            <textarea
              rows={4}
              value={
                editingDesc !== null
                  ? editingDesc
                  : selectedIssue.description ?? ""
              }
              placeholder="Add description..."
              onChange={(e) => setEditingDesc(e.target.value)}
              onBlur={() => {
                if (
                  editingDesc !== null &&
                  editingDesc !== (selectedIssue.description ?? "")
                ) {
                  updateIssue.mutate({
                    id: selectedIssue.id,
                    data: { description: editingDesc.trim() || null },
                  });
                }
                setEditingDesc(null);
              }}
              className="w-full bg-transparent text-[13px] text-[var(--text-2)] placeholder:text-[var(--text-4)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] rounded p-1 -m-1 resize-none leading-relaxed"
            />

            {/* Editable Properties */}
            <div className="space-y-2.5 border-t border-[var(--border)] pt-4 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-4)]">Status</span>
                <select
                  value={selectedIssue.status}
                  onChange={(e) =>
                    updateIssue.mutate({
                      id: selectedIssue.id,
                      data: { status: e.target.value as IssueStatus },
                    })
                  }
                  className="h-7 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-2 text-[12px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {STATUS_LABELS[opt]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-4)]">Priority</span>
                <select
                  value={selectedIssue.priority}
                  onChange={(e) =>
                    updateIssue.mutate({
                      id: selectedIssue.id,
                      data: { priority: e.target.value as IssuePriority },
                    })
                  }
                  className="h-7 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-2 text-[12px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {PRIORITY_LABELS[opt]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-4)]">Assignee</span>
                <select
                  value={selectedIssue.assigneeId ?? ""}
                  onChange={(e) =>
                    updateIssue.mutate({
                      id: selectedIssue.id,
                      data: {
                        assigneeId: e.target.value || null,
                      },
                    })
                  }
                  className="h-7 max-w-[185px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-2 text-[12px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                >
                  <option value="">No assignee</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[var(--text-4)]">
                  <Hash className="h-3 w-3" />
                  <span>Estimate</span>
                </span>
                <select
                  value={selectedIssue.estimate ?? ""}
                  onChange={(e) =>
                    updateIssue.mutate({
                      id: selectedIssue.id,
                      data: {
                        estimate: e.target.value
                          ? Number(e.target.value)
                          : null,
                      },
                    })
                  }
                  className="h-7 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-2 text-[12px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                >
                  {ESTIMATE_OPTIONS.map((opt) => (
                    <option key={opt === null ? "none" : opt} value={opt ?? ""}>
                      {opt === null ? "No estimate" : `${opt} pts`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[var(--text-4)]">
                  <Calendar className="h-3 w-3" />
                  <span>Due date</span>
                </span>
                <input
                  type="date"
                  value={
                    selectedIssue.dueDate
                      ? new Date(selectedIssue.dueDate).toISOString().slice(0, 10)
                      : ""
                  }
                  onChange={(e) =>
                    updateIssue.mutate({
                      id: selectedIssue.id,
                      data: {
                        dueDate: e.target.value
                          ? new Date(`${e.target.value}T00:00:00.000Z`).toISOString()
                          : null,
                      },
                    })
                  }
                  className="h-7 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-2 text-[12px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              {/* Labels */}
              <div className="space-y-1.5 pt-1">
                <span className="flex items-center gap-1 text-[var(--text-4)]">
                  <Tag className="h-3 w-3" />
                  <span>Labels</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {allLabels.map((lbl) => {
                    const active =
                      selectedIssue.labels?.some((l) => l.id === lbl.id) ?? false;
                    return (
                      <button
                        key={lbl.id}
                        type="button"
                        onClick={() => {
                          const currentIds =
                            selectedIssue.labels?.map((l) => l.id) ?? [];
                          const nextIds = active
                            ? currentIds.filter((id) => id !== lbl.id)
                            : [...currentIds, lbl.id];
                          updateIssue.mutate({
                            id: selectedIssue.id,
                            data: { labelIds: nextIds },
                          });
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] transition-colors cursor-pointer ${
                          active
                            ? "border-[var(--border-strong)] bg-[rgba(255,255,255,0.08)] text-[var(--text)]"
                            : "border-[var(--border)] text-[var(--text-4)] hover:text-[var(--text-2)]"
                        }`}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: lbl.color }}
                        />
                        <span>{lbl.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Parent Issue Link */}
            <div className="space-y-2 border-t border-[var(--border)] pt-4 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-4)]">Parent issue</span>
                {!selectedIssue.parent && (
                  <button
                    type="button"
                    onClick={() => setIsAddingParent((v) => !v)}
                    className="flex items-center gap-1 text-[11px] text-[var(--text-3)] hover:text-[var(--text)] cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Set parent</span>
                  </button>
                )}
              </div>

              {selectedIssue.parent ? (
                <div className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-2.5 py-1.5">
                  <button
                    type="button"
                    onClick={() => selectIssue(selectedIssue.parent!.id)}
                    className="flex items-center gap-2 min-w-0 text-left hover:text-[var(--text)] cursor-pointer"
                  >
                    <IssueStatusIcon
                      status={selectedIssue.parent.status}
                      className="h-3.5 w-3.5 shrink-0"
                    />
                    <span className="text-[11px] font-medium text-[var(--text-4)] shrink-0">
                      {selectedIssue.parent.identifier}
                    </span>
                    <span className="truncate text-[12px] text-[var(--text-2)]">
                      {selectedIssue.parent.title}
                    </span>
                  </button>
                  <button
                    type="button"
                    title="Unlink parent"
                    onClick={() =>
                      updateIssue.mutate({
                        id: selectedIssue.id,
                        data: { parentId: null },
                      })
                    }
                    className="ml-2 shrink-0 text-[var(--text-4)] hover:text-[var(--danger)] cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : isAddingParent ? (
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (!e.target.value) return;
                    updateIssue.mutate({
                      id: selectedIssue.id,
                      data: { parentId: e.target.value },
                    });
                    setIsAddingParent(false);
                  }}
                  className="h-7 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-2 text-[12px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="">Select parent issue...</option>
                  {availableParentCandidates.map((cand) => (
                    <option key={cand.id} value={cand.id}>
                      {cand.identifier} · {cand.title}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-[11px] text-[var(--text-4)]">None</p>
              )}
            </div>

            {/* Sub-issues Section */}
            <div className="space-y-2 border-t border-[var(--border)] pt-4 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[var(--text-4)]">
                  <GitBranch className="h-3.5 w-3.5" strokeWidth={1.5} />
                  <span>
                    Sub-issues
                    {subIssues.length > 0
                      ? ` (${completedSubCount}/${subIssues.length})`
                      : ""}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    openCreateIssue({
                      defaultStatus: "BACKLOG",
                      defaultParentId: selectedIssue.id,
                      defaultParentIdentifier: selectedIssue.identifier,
                    })
                  }
                  className="flex items-center gap-1 text-[11px] text-[var(--text-3)] hover:text-[var(--text)] cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add sub-issue</span>
                </button>
              </div>

              {subIssues.length === 0 ? (
                <p className="text-[11px] text-[var(--text-4)]">No sub-issues</p>
              ) : (
                <div className="space-y-1">
                  {subIssues.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-2.5 py-1.5 hover:border-[var(--border-strong)] transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => selectIssue(sub.id)}
                        className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                      >
                        <IssueStatusIcon
                          status={sub.status}
                          className="h-3.5 w-3.5 shrink-0"
                        />
                        <span className="text-[11px] font-medium text-[var(--text-4)] shrink-0">
                          {sub.identifier}
                        </span>
                        <span className="truncate text-[12px] text-[var(--text-2)]">
                          {sub.title}
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Relations Section (Blocks, Blocked by, Duplicate, Related) */}
            <div className="space-y-2 border-t border-[var(--border)] pt-4 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[var(--text-4)]">
                  <Link2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                  <span>Relations</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingRelation((v) => !v)}
                  className="flex items-center gap-1 text-[11px] text-[var(--text-3)] hover:text-[var(--text)] cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add relation</span>
                </button>
              </div>

              {isAddingRelation && (
                <div className="space-y-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] p-2.5">
                  <select
                    value={relationType}
                    onChange={(e) =>
                      setRelationType(e.target.value as IssueRelationType)
                    }
                    className="h-7 w-full rounded border border-[var(--border)] bg-[var(--bg-elev)] px-2 text-[12px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    {RELATION_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {RELATION_LABELS[type]}
                      </option>
                    ))}
                  </select>

                  <select
                    value={relationTargetId}
                    onChange={(e) => setRelationTargetId(e.target.value)}
                    className="h-7 w-full rounded border border-[var(--border)] bg-[var(--bg-elev)] px-2 text-[12px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="">Select target issue...</option>
                    {availableRelationCandidates.map((cand) => (
                      <option key={cand.id} value={cand.id}>
                        {cand.identifier} · {cand.title}
                      </option>
                    ))}
                  </select>

                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsAddingRelation(false)}
                      className="h-6 px-2 text-[11px] text-[var(--text-4)] hover:text-[var(--text-2)] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!relationTargetId || addRelation.isPending}
                      onClick={() => {
                        if (!relationTargetId) return;
                        addRelation.mutate(
                          {
                            issueId: selectedIssue.id,
                            targetIssueId: relationTargetId,
                            type: relationType,
                          },
                          {
                            onSuccess: () => {
                              setRelationTargetId("");
                              setIsAddingRelation(false);
                            },
                          }
                        );
                      }}
                      className="h-6 rounded bg-[var(--accent)] px-2.5 text-[11px] font-medium text-[var(--text)] hover:bg-[var(--accent-hover)] disabled:opacity-40 cursor-pointer"
                    >
                      Link
                    </button>
                  </div>
                </div>
              )}

              {relations.length === 0 ? (
                <p className="text-[11px] text-[var(--text-4)]">No relations</p>
              ) : (
                <div className="space-y-1">
                  {relations.map((rel) => (
                    <div
                      key={rel.id}
                      className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-2.5 py-1.5"
                    >
                      <button
                        type="button"
                        onClick={() => selectIssue(rel.issue.id)}
                        className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                      >
                        <span className="rounded bg-[rgba(255,255,255,0.06)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-3)] shrink-0">
                          {RELATION_LABELS[rel.type]}
                        </span>
                        <IssueStatusIcon
                          status={rel.issue.status}
                          className="h-3 w-3 shrink-0"
                        />
                        <span className="text-[11px] font-medium text-[var(--text-4)] shrink-0">
                          {rel.issue.identifier}
                        </span>
                        <span className="truncate text-[12px] text-[var(--text-2)]">
                          {rel.issue.title}
                        </span>
                      </button>

                      <button
                        type="button"
                        title="Remove relation"
                        onClick={() =>
                          deleteRelation.mutate({
                            issueId: selectedIssue.id,
                            relationId: rel.id,
                          })
                        }
                        className="ml-2 shrink-0 text-[var(--text-4)] hover:text-[var(--danger)] cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </WorkspaceShell>
  );
}
