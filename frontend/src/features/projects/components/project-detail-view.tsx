"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { IssueInspector } from "@/features/issues/components/issue-inspector";
import {
  useDeleteProject,
  useProject,
  useUpdateProject,
} from "@/features/projects/hooks/use-projects";
import {
  useIssues,
  useTeams,
  useUpdateIssue,
  useWorkspaceMembers,
} from "@/features/issues/hooks/use-issues";
import { useAuthStore } from "@/store/useAuthStore";
import { useModalStore } from "@/store/useModalStore";
import { ProjectStatus } from "@/types/project.types";
import {
  PROJECT_STATUS_META,
  ProjectStatusBadge,
} from "./project-status-badge";
import { IssueStatusIcon } from "@/components/ui/issue-status-icon";
import { IssuePriorityIcon } from "@/components/ui/issue-priority-icon";
import {
  ArrowLeft,
  Calendar,
  FolderKanban,
  Loader2,
  Plus,
  Trash2,
  UserCircle2,
} from "lucide-react";

const STATUS_OPTIONS: ProjectStatus[] = [
  "PLANNED",
  "IN_PROGRESS",
  "PAUSED",
  "COMPLETED",
  "CANCELED",
];

export function ProjectDetailView({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { openCreateIssue } = useModalStore();

  const { data: project, isLoading } = useProject(projectId, isAuthenticated);
  const { data: allIssues = [] } = useIssues(undefined, isAuthenticated);
  const { data: members = [] } = useWorkspaceMembers(undefined, isAuthenticated);
  const { data: teams = [] } = useTeams(undefined, isAuthenticated);

  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const updateIssue = useUpdateIssue();

  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [summaryDraft, setSummaryDraft] = useState<string | null>(null);
  const [isLinkingIssue, setIsLinkingIssue] = useState(false);

  const projectIssues = project?.issues ?? [];
  const unlinkedIssues = allIssues.filter(
    (issue) => issue.projectId !== projectId
  );

  return (
    <WorkspaceShell>
      {/* Top Header */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/projects"
            className="flex items-center gap-1.5 text-[12px] text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>Projects</span>
          </Link>
          <span className="text-[12px] text-[var(--text-4)]">&rsaquo;</span>
          <span className="truncate text-[13px] font-medium text-[var(--text)]">
            {project?.name || "Project"}
          </span>
          {project && <ProjectStatusBadge status={project.status} />}
        </div>

        {project && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                openCreateIssue({
                  defaultProjectId: project.id,
                  defaultTeamId: project.teamId ?? null,
                  defaultStatus: "TODO",
                })
              }
              className="flex h-7 items-center gap-1.5 rounded-[var(--radius)] bg-[var(--accent)] px-2.5 text-[12px] font-medium text-[var(--text)] hover:bg-[var(--accent-hover)] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              <span>Add issue</span>
            </button>

            <button
              type="button"
              title="Delete project"
              onClick={() => {
                deleteProject.mutate(project.id, {
                  onSuccess: () => router.replace("/projects"),
                });
              }}
              className="flex h-7 w-7 items-center justify-center rounded text-[var(--text-4)] hover:bg-[var(--bg-hover)] hover:text-[var(--danger)] transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>
        )}
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center text-[var(--text-3)]">
            <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.5} />
          </div>
        ) : !project ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center px-4">
            <p className="text-[13px] text-[var(--text-3)]">
              Project not found.
            </p>
            <Link
              href="/projects"
              className="mt-3 text-[12px] text-[var(--accent)] hover:underline"
            >
              Back to Projects
            </Link>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto bg-[var(--bg)] p-6">
            <div className="mx-auto max-w-4xl space-y-6">
              {/* Project Overview Card */}
              <div className="rounded-[8px] border border-[var(--border)] bg-[var(--bg-panel)] p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] text-[var(--text-2)]">
                    <FolderKanban className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={nameDraft !== null ? nameDraft : project.name}
                      onChange={(e) => setNameDraft(e.target.value)}
                      onBlur={() => {
                        if (
                          nameDraft !== null &&
                          nameDraft.trim() &&
                          nameDraft.trim() !== project.name
                        ) {
                          updateProject.mutate({
                            id: project.id,
                            data: { name: nameDraft.trim() },
                          });
                        }
                        setNameDraft(null);
                      }}
                      className="w-full bg-transparent text-[20px] font-semibold tracking-tight text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] rounded px-1 -mx-1"
                    />
                    <input
                      type="text"
                      value={
                        summaryDraft !== null
                          ? summaryDraft
                          : project.summary ?? ""
                      }
                      placeholder="Add a project summary..."
                      onChange={(e) => setSummaryDraft(e.target.value)}
                      onBlur={() => {
                        if (
                          summaryDraft !== null &&
                          summaryDraft !== (project.summary ?? "")
                        ) {
                          updateProject.mutate({
                            id: project.id,
                            data: { summary: summaryDraft.trim() || null },
                          });
                        }
                        setSummaryDraft(null);
                      }}
                      className="w-full bg-transparent text-[13px] text-[var(--text-3)] placeholder:text-[var(--text-4)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] rounded px-1 -mx-1"
                    />
                  </div>
                </div>

                {/* Controls Row */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--border)] sm:grid-cols-4 text-[12px]">
                  <div>
                    <label className="block text-[11px] text-[var(--text-4)] mb-1">
                      Health status
                    </label>
                    <select
                      value={project.status}
                      onChange={(e) =>
                        updateProject.mutate({
                          id: project.id,
                          data: { status: e.target.value as ProjectStatus },
                        })
                      }
                      className="h-7 w-full rounded border border-[var(--border)] bg-[var(--bg)] px-2 text-[12px] text-[var(--text)]"
                    >
                      {STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>
                          {PROJECT_STATUS_META[st].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[var(--text-4)] mb-1">
                      Lead engineer
                    </label>
                    <select
                      value={project.leadId ?? ""}
                      onChange={(e) =>
                        updateProject.mutate({
                          id: project.id,
                          data: { leadId: e.target.value || null },
                        })
                      }
                      className="h-7 w-full rounded border border-[var(--border)] bg-[var(--bg)] px-2 text-[12px] text-[var(--text)]"
                    >
                      <option value="">No lead</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[var(--text-4)] mb-1">
                      Team
                    </label>
                    <select
                      value={project.teamId ?? ""}
                      onChange={(e) =>
                        updateProject.mutate({
                          id: project.id,
                          data: { teamId: e.target.value || null },
                        })
                      }
                      className="h-7 w-full rounded border border-[var(--border)] bg-[var(--bg)] px-2 text-[12px] text-[var(--text)]"
                    >
                      <option value="">Cross-team</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.key})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-[11px] text-[var(--text-4)] mb-1">
                      <Calendar className="h-3 w-3" />
                      <span>Target date</span>
                    </label>
                    <input
                      type="date"
                      value={
                        project.targetDate
                          ? new Date(project.targetDate)
                              .toISOString()
                              .slice(0, 10)
                          : ""
                      }
                      onChange={(e) =>
                        updateProject.mutate({
                          id: project.id,
                          data: {
                            targetDate: e.target.value
                              ? new Date(
                                  `${e.target.value}T00:00:00.000Z`
                                ).toISOString()
                              : null,
                          },
                        })
                      }
                      className="h-7 w-full rounded border border-[var(--border)] bg-[var(--bg)] px-2 text-[12px] text-[var(--text)]"
                    />
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-[var(--text-3)]">
                      Progress ({project.progress.completedIssues} of{" "}
                      {project.progress.totalIssues} issues completed)
                    </span>
                    <span className="font-medium text-[var(--text)]">
                      {project.progress.progressPercentage}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-elev)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                      style={{
                        width: `${project.progress.progressPercentage}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Project Issues Section */}
              <div className="rounded-[8px] border border-[var(--border)] bg-[var(--bg-panel)] overflow-hidden">
                <div className="flex h-10 items-center justify-between border-b border-[var(--border)] px-4">
                  <span className="text-[12px] font-medium text-[var(--text)]">
                    Issues ({projectIssues.length})
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsLinkingIssue((v) => !v)}
                      className="text-[11px] text-[var(--text-3)] hover:text-[var(--text)] cursor-pointer"
                    >
                      + Link existing issue
                    </button>
                  </div>
                </div>

                {isLinkingIssue && (
                  <div className="border-b border-[var(--border)] bg-[var(--bg)] p-3">
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        if (!e.target.value) return;
                        updateIssue.mutate({
                          id: e.target.value,
                          data: { projectId: project.id },
                        });
                        setIsLinkingIssue(false);
                      }}
                      className="h-7 w-full rounded border border-[var(--border)] bg-[var(--bg-elev)] px-2 text-[12px] text-[var(--text)]"
                    >
                      <option value="">
                        Select an existing workspace issue to link...
                      </option>
                      {unlinkedIssues.map((iss) => (
                        <option key={iss.id} value={iss.id}>
                          {iss.identifier} · {iss.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {projectIssues.length === 0 ? (
                  <div className="p-8 text-center text-[12px] text-[var(--text-4)]">
                    No issues in this project yet. Click &ldquo;Add issue&rdquo;
                    or link an existing issue above.
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border)]">
                    {projectIssues.map((issue) => (
                      <div
                        key={issue.id}
                        onClick={() => setSelectedIssueId(issue.id)}
                        className={`flex h-9 items-center gap-3 px-4 transition-colors cursor-pointer ${
                          selectedIssueId === issue.id
                            ? "bg-[rgba(255,255,255,0.06)]"
                            : "hover:bg-[rgba(255,255,255,0.025)]"
                        }`}
                      >
                        <IssuePriorityIcon
                          priority={issue.priority}
                          className="h-3.5 w-3.5 shrink-0"
                        />
                        <span className="w-16 shrink-0 text-[11px] font-medium text-[var(--text-4)]">
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
                    ))}
                  </div>
                )}
              </div>
            </div>
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
