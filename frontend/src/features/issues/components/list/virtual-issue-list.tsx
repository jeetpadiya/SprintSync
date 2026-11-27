"use client";

import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Issue, IssueStatus } from "@/types/issue.types";
import { useUIStore } from "@/store/useUIStore";
import {
  IssueStatusIcon,
  STATUS_LABELS,
} from "@/components/ui/issue-status-icon";
import {
  IssuePriorityIcon,
  PRIORITY_LABELS,
} from "@/components/ui/issue-priority-icon";
import {
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  Plus,
  UserCircle2,
} from "lucide-react";

const DEFAULT_LIST_STATUSES: IssueStatus[] = [
  "IN_PROGRESS",
  "IN_REVIEW",
  "TODO",
  "BACKLOG",
  "DONE",
  "CANCELED",
];

type VirtualRow =
  | { type: "header"; status: IssueStatus; count: number }
  | { type: "issue"; issue: Issue };

interface VirtualIssueListProps {
  issues: Issue[];
  selectedIssueId: string | null;
  onSelectIssue: (id: string) => void;
  onCreateInStatus: (status: IssueStatus) => void;
  statuses?: IssueStatus[];
}

export function VirtualIssueList({
  issues,
  selectedIssueId,
  onSelectIssue,
  onCreateInStatus,
  statuses = DEFAULT_LIST_STATUSES,
}: VirtualIssueListProps) {
  const scrollParentRef = useRef<HTMLDivElement>(null);
  const { collapsedGroups, toggleGroupCollapsed } = useUIStore();

  const rows = useMemo<VirtualRow[]>(() => {
    const grouped = new Map<IssueStatus, Issue[]>();
    for (const st of statuses) {
      grouped.set(st, []);
    }

    const sorted = [...issues].sort((a, b) => a.sortOrder - b.sortOrder);
    for (const issue of sorted) {
      grouped.get(issue.status)?.push(issue);
    }

    const flat: VirtualRow[] = [];
    for (const st of statuses) {
      const groupIssues = grouped.get(st) ?? [];
      if (groupIssues.length === 0) continue;

      flat.push({ type: "header", status: st, count: groupIssues.length });
      if (!collapsedGroups[st]) {
        for (const issue of groupIssues) {
          flat.push({ type: "issue", issue });
        }
      }
    }
    return flat;
  }, [issues, statuses, collapsedGroups]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: (index) => (rows[index]?.type === "header" ? 36 : 32),
    overscan: 12,
  });

  return (
    <div ref={scrollParentRef} className="flex-1 overflow-y-auto bg-[var(--bg)]">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const row = rows[virtualItem.index];
          if (!row) return null;

          if (row.type === "header") {
            const isCollapsed = !!collapsedGroups[row.status];
            return (
              <div
                key={`header-${row.status}`}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-panel)]/70 px-4 select-none"
              >
                <button
                  type="button"
                  onClick={() => toggleGroupCollapsed(row.status)}
                  className="flex items-center gap-2 text-[12px] font-medium text-[var(--text)] cursor-pointer"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-3.5 w-3.5 text-[var(--text-4)]" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-[var(--text-4)]" />
                  )}
                  <IssueStatusIcon status={row.status} className="h-3.5 w-3.5" />
                  <span>{STATUS_LABELS[row.status]}</span>
                  <span className="text-[11px] font-normal text-[var(--text-4)]">
                    {row.count}
                  </span>
                </button>

                <button
                  type="button"
                  title={`New ${STATUS_LABELS[row.status]} issue`}
                  onClick={() => onCreateInStatus(row.status)}
                  className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-4)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)] cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              </div>
            );
          }

          const { issue } = row;
          const isSelected = selectedIssueId === issue.id;

          return (
            <div
              key={issue.id}
              onClick={() => onSelectIssue(issue.id)}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
              className={`flex items-center gap-3 border-b border-[var(--border)] px-4 transition-colors cursor-pointer ${
                isSelected
                  ? "bg-[rgba(255,255,255,0.07)]"
                  : "hover:bg-[rgba(255,255,255,0.025)]"
              }`}
            >
              {/* Priority */}
              <span className="shrink-0" title={PRIORITY_LABELS[issue.priority]}>
                <IssuePriorityIcon
                  priority={issue.priority}
                  className="h-3.5 w-3.5"
                />
              </span>

              {/* Identifier */}
              <span className="w-16 shrink-0 text-[11px] font-medium text-[var(--text-4)]">
                {issue.identifier}
              </span>

              {/* Status */}
              <span className="shrink-0" title={STATUS_LABELS[issue.status]}>
                <IssueStatusIcon status={issue.status} className="h-3.5 w-3.5" />
              </span>

              {/* Title */}
              <span className="flex flex-1 items-center gap-1.5 min-w-0">
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

              {/* Labels */}
              <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                {issue.labels?.slice(0, 2).map((lbl) => (
                  <span
                    key={lbl.id}
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--bg-elev)] px-2 py-0.2 text-[10px] text-[var(--text-3)]"
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: lbl.color }}
                    />
                    <span>{lbl.name}</span>
                  </span>
                ))}
              </div>

              {/* Estimate */}
              {issue.estimate !== null && issue.estimate !== undefined && (
                <span className="hidden md:inline-flex items-center rounded border border-[var(--border)] bg-[var(--bg-elev)] px-1.5 text-[10px] text-[var(--text-4)] shrink-0">
                  {issue.estimate}pt
                </span>
              )}

              {/* Assignee */}
              <div className="shrink-0">
                {issue.assignee ? (
                  <span
                    title={issue.assignee.name}
                    className="flex h-4 w-4 items-center justify-center rounded-full bg-[#f59e0b] text-[9px] font-semibold text-[#08090a]"
                  >
                    {issue.assignee.name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <UserCircle2
                    className="h-3.5 w-3.5 text-[var(--text-4)]"
                    strokeWidth={1.5}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
