"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { useAuthStore } from "@/store/useAuthStore";
import {
  useCreateProject,
  useProjects,
} from "@/features/projects/hooks/use-projects";
import {
  useTeams,
  useWorkspaceMembers,
} from "@/features/issues/hooks/use-issues";
import { ProjectStatus } from "@/types/project.types";
import {
  PROJECT_STATUS_META,
  ProjectStatusBadge,
} from "./project-status-badge";
import {
  Calendar,
  FolderKanban,
  Loader2,
  Plus,
  Search,
  UserCircle2,
  X,
} from "lucide-react";

type ProjectFilterTab = "all" | "active" | "planned" | "completed";

const STATUS_OPTIONS: ProjectStatus[] = [
  "PLANNED",
  "IN_PROGRESS",
  "PAUSED",
  "COMPLETED",
  "CANCELED",
];

export function ProjectsView() {
  const { isAuthenticated, user } = useAuthStore();
  const { data: projects = [], isLoading } = useProjects(
    undefined,
    isAuthenticated
  );
  const { data: members = [] } = useWorkspaceMembers(undefined, isAuthenticated);
  const { data: teams = [] } = useTeams(undefined, isAuthenticated);
  const createProject = useCreateProject();

  const [activeTab, setActiveTab] = useState<ProjectFilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Create form state
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("PLANNED");
  const [leadId, setLeadId] = useState<string>("");
  const [teamId, setTeamId] = useState<string>("");
  const [targetDate, setTargetDate] = useState<string>("");

  const filteredProjects = useMemo(() => {
    return projects.filter((proj) => {
      if (activeTab === "active" && proj.status !== "IN_PROGRESS" && proj.status !== "PAUSED") {
        return false;
      }
      if (activeTab === "planned" && proj.status !== "PLANNED") {
        return false;
      }
      if (
        activeTab === "completed" &&
        proj.status !== "COMPLETED" &&
        proj.status !== "CANCELED"
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        return (
          proj.name.toLowerCase().includes(q) ||
          (proj.summary ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [projects, activeTab, searchQuery]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createProject.mutateAsync({
        name: name.trim(),
        summary: summary.trim() || null,
        status,
        leadId: leadId || user?.id || null,
        teamId: teamId || null,
        targetDate: targetDate
          ? new Date(`${targetDate}T00:00:00.000Z`).toISOString()
          : null,
      });

      setName("");
      setSummary("");
      setStatus("PLANNED");
      setLeadId("");
      setTeamId("");
      setTargetDate("");
      setIsModalOpen(false);
    } catch {
      // Handled by useCreateProject
    }
  };

  return (
    <WorkspaceShell>
      {/* Top Header Bar */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FolderKanban
              className="h-3.5 w-3.5 text-[var(--text-3)]"
              strokeWidth={1.5}
            />
            <span className="text-[13px] font-medium tracking-tight text-[var(--text)]">
              Projects
            </span>
          </div>

          <div className="flex items-center gap-1">
            {(
              [
                { id: "all", label: "All" },
                { id: "active", label: "Active" },
                { id: "planned", label: "Planned" },
                { id: "completed", label: "Completed" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`h-6 rounded-full border px-2.5 text-[11px] transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? "border-[var(--border-strong)] bg-[rgba(255,255,255,0.08)] font-medium text-[var(--text)]"
                    : "border-[var(--border)] text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex h-7 w-48 items-center gap-1.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] px-2">
            <Search
              className="h-3 w-3 text-[var(--text-4)] shrink-0"
              strokeWidth={1.5}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full bg-transparent text-[12px] text-[var(--text)] placeholder:text-[var(--text-4)] focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex h-7 items-center gap-1.5 rounded-[var(--radius)] bg-[var(--accent)] px-2.5 text-[12px] font-medium text-[var(--text)] hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            <span>New project</span>
          </button>
        </div>
      </header>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-20"
          onClick={() => setIsModalOpen(false)}
        >
          <form
            onSubmit={handleCreate}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[520px] rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-medium text-[var(--text)]">
                New project
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-4)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)] cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name"
                className="w-full bg-transparent text-[16px] font-medium text-[var(--text)] placeholder:text-[var(--text-4)] focus:outline-none"
              />

              <textarea
                rows={2}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Add a short summary of the outcome..."
                className="w-full resize-none bg-transparent text-[13px] text-[var(--text-2)] placeholder:text-[var(--text-4)] focus:outline-none"
              />

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border)]">
                <div>
                  <label className="block text-[11px] text-[var(--text-4)] mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as ProjectStatus)
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
                    Lead
                  </label>
                  <select
                    value={leadId}
                    onChange={(e) => setLeadId(e.target.value)}
                    className="h-7 w-full rounded border border-[var(--border)] bg-[var(--bg)] px-2 text-[12px] text-[var(--text)]"
                  >
                    <option value="">
                      {user ? `${user.name} (You)` : "Unassigned"}
                    </option>
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
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    className="h-7 w-full rounded border border-[var(--border)] bg-[var(--bg)] px-2 text-[12px] text-[var(--text)]"
                  >
                    <option value="">Cross-team / Workspace</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.key})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-[var(--text-4)] mb-1">
                    Target date
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="h-7 w-full rounded border border-[var(--border)] bg-[var(--bg)] px-2 text-[12px] text-[var(--text)]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-7 px-3 text-[12px] text-[var(--text-3)] hover:text-[var(--text)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || createProject.isPending}
                className="flex h-7 items-center rounded-[var(--radius)] bg-[var(--accent)] px-3 text-[12px] font-medium text-[var(--text)] hover:bg-[var(--accent-hover)] disabled:opacity-40 cursor-pointer"
              >
                {createProject.isPending ? "Creating..." : "Create project"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-[var(--bg)] p-6">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-[var(--text-3)]">
            <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.5} />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center select-none">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-panel)] text-[var(--text-3)]">
              <FolderKanban className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <h2 className="text-[14px] font-medium text-[var(--text)]">
              No projects found
            </h2>
            <p className="mt-1 max-w-sm text-[12px] text-[var(--text-3)]">
              Group issues across cycles toward milestones, target dates, and
              shared health indicators.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-4 flex h-8 items-center gap-1.5 rounded-[var(--radius)] bg-[var(--accent)] px-3.5 text-[12px] font-medium text-[var(--text)] hover:bg-[var(--accent-hover)] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create project</span>
            </button>
          </div>
        ) : (
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group flex flex-col justify-between rounded-[8px] border border-[var(--border)] bg-[var(--bg-panel)] p-4 hover:border-[var(--border-strong)] hover:bg-[rgba(255,255,255,0.025)] transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FolderKanban
                        className="h-4 w-4 shrink-0 text-[var(--text-3)]"
                        strokeWidth={1.5}
                      />
                      <h3 className="truncate text-[14px] font-medium text-[var(--text)] group-hover:text-white">
                        {project.name}
                      </h3>
                    </div>
                    <ProjectStatusBadge status={project.status} />
                  </div>

                  <p className="line-clamp-2 min-h-[34px] text-[12px] leading-relaxed text-[var(--text-3)]">
                    {project.summary || "No project summary provided."}
                  </p>
                </div>

                <div className="mt-4 space-y-3 pt-3 border-t border-[var(--border)]">
                  {/* Automated Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-4)]">
                        {project.progress.completedIssues}/
                        {project.progress.totalIssues} issues
                      </span>
                      <span className="font-medium text-[var(--text-2)]">
                        {project.progress.progressPercentage}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-elev)]">
                      <div
                        className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                        style={{
                          width: `${project.progress.progressPercentage}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Footer Meta */}
                  <div className="flex items-center justify-between text-[11px] text-[var(--text-4)]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {project.lead ? (
                        <>
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#f59e0b] text-[9px] font-semibold text-[#08090a]">
                            {project.lead.name.charAt(0).toUpperCase()}
                          </span>
                          <span className="truncate text-[var(--text-3)]">
                            {project.lead.name}
                          </span>
                        </>
                      ) : (
                        <>
                          <UserCircle2 className="h-3.5 w-3.5 shrink-0" />
                          <span>No lead</span>
                        </>
                      )}
                    </div>

                    {project.targetDate && (
                      <span className="flex items-center gap-1 shrink-0">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(project.targetDate).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric" }
                          )}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
