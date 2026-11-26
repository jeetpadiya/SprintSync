"use client";

import { useState } from "react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { IssueInspector } from "@/features/issues/components/issue-inspector";
import { useIssues } from "@/features/issues/hooks/use-issues";
import { IssueStatusIcon } from "@/components/ui/issue-status-icon";
import { IssuePriorityIcon } from "@/components/ui/issue-priority-icon";
import {
  MoreHorizontal,
  Archive,
  SlidersHorizontal,
  Settings2,
  Layers,
  Plus,
} from "lucide-react";
import { useModalStore } from "@/store/useModalStore";
import { useAuthStore } from "@/store/useAuthStore";

export function WorkspaceDashboard() {
  const { openCreateIssue } = useModalStore();
  const { isAuthenticated } = useAuthStore();
  const { data: issues = [] } = useIssues(undefined, isAuthenticated);

  const [selectedIssueId, setSelectedIssueId] = useState<string | "welcome" | null>("welcome");
  const selectedIssue = issues.find((i) => i.id === selectedIssueId);

  return (
    <WorkspaceShell>
      {/* Top Header Bar */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-[var(--text)] tracking-tight">
            Inbox
          </span>
          <button
            type="button"
            className="flex h-5 w-5 items-center justify-center rounded text-[var(--text-4)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)] transition-colors duration-100 ease-out"
          >
            <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[var(--text-4)]">
          <button
            type="button"
            onClick={() => openCreateIssue()}
            className="flex h-6 items-center gap-1 rounded-[var(--radius)] bg-[var(--accent)] px-2 text-[12px] font-medium text-[var(--text)] hover:bg-[var(--accent-hover)] transition-colors duration-100 ease-out cursor-pointer"
          >
            <Plus className="h-3 w-3" strokeWidth={2} />
            <span>New</span>
          </button>
          <button
            type="button"
            title="Archive all"
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)] transition-colors duration-100 ease-out cursor-pointer"
          >
            <Archive className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            title="Filters"
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)] transition-colors duration-100 ease-out cursor-pointer"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            title="Display preferences"
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)] transition-colors duration-100 ease-out cursor-pointer"
          >
            <Settings2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* Master-Detail Split Pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column: Notification & Issue Item List */}
        <div className="w-[320px] shrink-0 border-r border-[var(--border)] overflow-y-auto">
          {/* Welcome Notification Item */}
          <div
            onClick={() => setSelectedIssueId("welcome")}
            className={`flex items-start gap-3 p-3 border-b border-[var(--border)] transition-colors duration-100 ease-out cursor-pointer ${
              selectedIssueId === "welcome"
                ? "bg-[rgba(255,255,255,0.06)]"
                : "hover:bg-[rgba(255,255,255,0.02)]"
            }`}
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--bg-elev)] border border-[var(--border)] text-[var(--text-3)] mt-0.5">
              <Layers className="h-3 w-3 text-[var(--text-3)]" strokeWidth={1.5} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-medium text-[var(--text)] tracking-tight truncate">
                  Welcome to SprintSync
                </h3>
                <span className="text-[11px] text-[var(--text-4)] shrink-0 ml-2">
                  8d
                </span>
              </div>
              <p className="mt-0.5 text-[12px] text-[var(--text-3)] truncate leading-normal">
                Watch an introductory video and access a list of resources to get started.
              </p>
            </div>
          </div>

          {/* Real Created Issues */}
          {issues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => setSelectedIssueId(issue.id)}
              className={`flex items-start gap-3 p-3 border-b border-[var(--border)] transition-colors duration-100 ease-out cursor-pointer ${
                selectedIssueId === issue.id
                  ? "bg-[rgba(255,255,255,0.06)]"
                  : "hover:bg-[rgba(255,255,255,0.02)]"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                <IssueStatusIcon status={issue.status} className="h-4 w-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[var(--text-4)] tracking-wide">
                    {issue.identifier}
                  </span>
                  <IssuePriorityIcon priority={issue.priority} className="h-3 w-3" />
                </div>
                <h4 className="text-[13px] font-medium text-[var(--text)] tracking-tight truncate mt-0.5">
                  {issue.title}
                </h4>
                {issue.description && (
                  <p className="mt-0.5 text-[12px] text-[var(--text-3)] truncate leading-normal">
                    {issue.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Detail Pane */}
        <div className="flex flex-1 flex-col overflow-y-auto bg-[var(--bg)] p-8">
          {selectedIssueId === "welcome" ? (
            <div className="flex flex-1 items-center justify-center select-none">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="mb-3 text-[var(--text-4)] opacity-60">
                  <svg
                    className="h-16 w-16 stroke-[1.25] fill-none text-current"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-3.5a2.5 2.5 0 01-2.5 2.5h-4a2.5 2.5 0 01-2.5-2.5H4"
                    />
                  </svg>
                </div>
                <p className="text-[12px] text-[var(--text-4)] font-normal">
                  No notification selected
                </p>
              </div>
            </div>
          ) : selectedIssue ? (
            <IssueInspector
              issueId={selectedIssue.id}
              onSelectIssue={(id) => setSelectedIssueId(id)}
              onDeleted={() => setSelectedIssueId("welcome")}
              className="max-w-2xl space-y-5"
            />
          ) : null}
        </div>
      </div>
    </WorkspaceShell>
  );
}
