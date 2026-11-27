"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi } from "@/features/auth/api/auth-api";
import { useCreateTeam, useTeams } from "@/features/issues/hooks/use-issues";
import { useAuthStore } from "@/store/useAuthStore";
import { useModalStore } from "@/store/useModalStore";
import {
  Inbox,
  CircleDot,
  GitPullRequest,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Search,
  SquarePen,
  FolderKanban,
  Layers,
  MoreHorizontal,
  Users2,
  HelpCircle,
  Check,
  Plus,
  Settings,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, clearAuth, isAuthenticated } = useAuthStore();
  const { openCreateIssue, openCommandMenu } = useModalStore();
  const { data: teams = [] } = useTeams(undefined, isAuthenticated);
  const createTeam = useCreateTeam();

  const [menuOpen, setMenuOpen] = useState(false);
  const [switchWorkspaceOpen, setSwitchWorkspaceOpen] = useState(false);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(
    null
  );
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [workspaceOpen, setWorkspaceOpen] = useState(true);
  const [teamsOpen, setTeamsOpen] = useState(true);
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamKey, setNewTeamKey] = useState("");
  const [tryOpen, setTryOpen] = useState(false);

  const menuContainerRef = useRef<HTMLDivElement>(null);

  const isInboxActive = pathname === "/" || pathname === "/dashboard";
  const isMyIssuesActive = pathname.startsWith("/my-issues");
  const isReviewsActive = pathname.startsWith("/reviews");
  const isDocumentsActive = pathname.startsWith("/documents");
  const isAgentActive = pathname.startsWith("/agent");
  const isProjectsActive = pathname.startsWith("/projects");
  const isViewsActive = pathname.startsWith("/views");

  const workspaces = user?.workspaces ?? [];
  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0];
  const workspaceName = activeWorkspace?.name || user?.name || "Workspace";
  const workspaceMonogram =
    workspaceName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "W";

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
        setSwitchWorkspaceOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setSwitchWorkspaceOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
      // Clear local session even if request fails
    } finally {
      setMenuOpen(false);
      setSwitchWorkspaceOpen(false);
      queryClient.clear();
      clearAuth();
      toast.success("Logged out");
      router.replace("/login");
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="flex h-screen w-[220px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg)] text-[var(--text)] select-none">
      {/* Workspace Switcher & Top Bar Actions */}
      <div
        ref={menuContainerRef}
        className="relative flex h-11 items-center justify-between px-3 border-b border-transparent"
      >
        <button
          type="button"
          onClick={() => {
            setMenuOpen((v) => !v);
            setSwitchWorkspaceOpen(false);
          }}
          className={`flex items-center gap-2 rounded-[var(--radius)] px-1.5 py-1 text-[13px] font-medium text-[var(--text)] transition-colors duration-100 ease-out cursor-pointer group ${
            menuOpen ? "bg-[var(--bg-elev)]" : "hover:bg-[var(--bg-hover)]"
          }`}
        >
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] bg-[#10b981] text-[10px] font-semibold text-[#052e16]">
            {workspaceMonogram}
          </div>
          <span className="truncate max-w-[100px] tracking-tight">
            {workspaceName}
          </span>
          <ChevronDown className="h-3 w-3 text-[var(--text-4)] group-hover:text-[var(--text-3)] transition-colors duration-100" />
        </button>

        {/* Workspace / Account Popup Menu */}
        {menuOpen && (
          <div className="absolute left-2.5 top-11 z-50 w-[240px] rounded-[10px] border border-[var(--border-strong)] bg-[var(--bg-panel)] p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.65)]">
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/settings");
                }}
                className="flex h-8 w-full items-center justify-between rounded-[6px] px-2.5 text-[13px] text-[var(--text)] hover:bg-[rgba(255,255,255,0.08)] transition-colors cursor-pointer"
              >
                <span>Settings</span>
                <span className="text-[11px] text-[var(--text-4)]">
                  G then S
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/settings?tab=members");
                }}
                className="flex h-8 w-full items-center justify-between rounded-[6px] px-2.5 text-[13px] text-[var(--text-2)] hover:bg-[rgba(255,255,255,0.08)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                <span>Invite and manage members</span>
              </button>
            </div>

            <div className="my-1.5 border-t border-[var(--border)]" />

            <div className="space-y-0.5">
              {/* Switch workspace (with submenu) */}
              <div
                className="relative"
                onMouseEnter={() => setSwitchWorkspaceOpen(true)}
                onMouseLeave={() => setSwitchWorkspaceOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setSwitchWorkspaceOpen((v) => !v)}
                  className="flex h-8 w-full items-center justify-between rounded-[6px] px-2.5 text-[13px] text-[var(--text-2)] hover:bg-[rgba(255,255,255,0.08)] hover:text-[var(--text)] transition-colors cursor-pointer"
                >
                  <span>Switch workspace</span>
                  <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-4)]">
                    <span>O then W</span>
                    <span className="text-[10px]">&#9656;</span>
                  </span>
                </button>

                {switchWorkspaceOpen && (
                  <div className="absolute left-full top-0 ml-1.5 z-50 w-56 rounded-[10px] border border-[var(--border-strong)] bg-[var(--bg-panel)] p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.65)]">
                    <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-[var(--text-4)]">
                      {user?.email || "Workspaces"}
                    </div>

                    {workspaces.length === 0 ? (
                      <div className="px-2 py-1.5 text-[12px] text-[var(--text-4)]">
                        No workspaces
                      </div>
                    ) : (
                      workspaces.map((ws) => {
                        const isCurrent = ws.id === activeWorkspace?.id;
                        return (
                          <button
                            key={ws.id}
                            type="button"
                            onClick={() => {
                              setActiveWorkspaceId(ws.id);
                              setSwitchWorkspaceOpen(false);
                              setMenuOpen(false);
                              toast.success(`Switched to ${ws.name}`);
                            }}
                            className="flex h-8 w-full items-center justify-between rounded-[6px] px-2 text-[12px] text-[var(--text-2)] hover:bg-[rgba(255,255,255,0.08)] hover:text-[var(--text)] cursor-pointer"
                          >
                            <span className="truncate">{ws.name}</span>
                            {isCurrent && (
                              <Check className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
                            )}
                          </button>
                        );
                      })
                    )}

                    <div className="my-1 border-t border-[var(--border)]" />
                    <Link
                      href="/create-workspace"
                      onClick={() => {
                        setSwitchWorkspaceOpen(false);
                        setMenuOpen(false);
                      }}
                      className="flex h-8 w-full items-center gap-2 rounded-[6px] px-2 text-[12px] text-[var(--text-3)] hover:bg-[rgba(255,255,255,0.08)] hover:text-[var(--text)]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Create workspace</span>
                    </Link>
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleLogout}
                className="flex h-8 w-full items-center justify-between rounded-[6px] px-2.5 text-[13px] text-[var(--text-2)] hover:bg-[rgba(255,255,255,0.08)] hover:text-[var(--text)] transition-colors disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
                <span className="text-[11px] text-[var(--text-4)]">
                  Alt &#8679; Q
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions (Settings, Search & Quick Create) */}
        <div className="flex items-center gap-0.5">
          <Link
            href="/settings"
            title="Settings"
            className={`flex h-6 w-6 items-center justify-center rounded-[var(--radius)] transition-colors duration-100 ease-out cursor-pointer ${
              pathname.startsWith("/settings")
                ? "bg-[rgba(255,255,255,0.08)] text-[var(--text)]"
                : "text-[var(--text-4)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
            }`}
          >
            <Settings className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Link>
          <button
            type="button"
            title="Search (Cmd+K)"
            onClick={() => openCommandMenu("root")}
            className="flex h-6 w-6 items-center justify-center rounded-[var(--radius)] text-[var(--text-4)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)] transition-colors duration-100 ease-out cursor-pointer"
          >
            <Search className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            title="New issue (C)"
            onClick={() => openCreateIssue()}
            className="flex h-6 w-6 items-center justify-center rounded-[var(--radius)] text-[var(--text-4)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)] transition-colors duration-100 ease-out cursor-pointer"
          >
            <SquarePen className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 space-y-0.5 px-2 py-1 overflow-y-auto">
        {/* Item: Inbox */}
        <Link
          href="/"
          className={`flex h-7 w-full items-center gap-2 rounded-[var(--radius)] px-2 text-[13px] transition-colors duration-100 ease-out cursor-pointer ${
            isInboxActive
              ? "bg-[rgba(255,255,255,0.06)] text-[var(--text)] font-medium"
              : "text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
          }`}
        >
          <Inbox className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
          <span>Inbox</span>
        </Link>

        {/* Item: My Issues */}
        <Link
          href="/my-issues"
          className={`flex h-7 w-full items-center gap-2 rounded-[var(--radius)] px-2 text-[13px] transition-colors duration-100 ease-out cursor-pointer ${
            isMyIssuesActive
              ? "bg-[rgba(255,255,255,0.06)] text-[var(--text)] font-medium"
              : "text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
          }`}
        >
          <CircleDot className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
          <span>My Issues</span>
        </Link>

        {/* Item: Reviews */}
        <Link
          href="/reviews"
          className={`flex h-7 w-full items-center justify-between rounded-[var(--radius)] px-2 text-[13px] transition-colors duration-100 ease-out cursor-pointer ${
            isReviewsActive
              ? "bg-[rgba(255,255,255,0.06)] text-[var(--text)] font-medium"
              : "text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
          }`}
        >
          <div className="flex items-center gap-2">
            <GitPullRequest className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
            <span>Reviews</span>
          </div>
          {/* Subtle notification dot on reviews */}
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-4)]" />
        </Link>

        {/* Item: Documents */}
        <Link
          href="/documents"
          className={`flex h-7 w-full items-center gap-2 rounded-[var(--radius)] px-2 text-[13px] transition-colors duration-100 ease-out cursor-pointer ${
            isDocumentsActive
              ? "bg-[rgba(255,255,255,0.06)] text-[var(--text)] font-medium"
              : "text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
          }`}
        >
          <FileText className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
          <span>Documents</span>
        </Link>

        {/* Item: Agent */}
        <Link
          href="/agent"
          className={`flex h-7 w-full items-center gap-2 rounded-[var(--radius)] px-2 text-[13px] transition-colors duration-100 ease-out cursor-pointer ${
            isAgentActive
              ? "bg-[rgba(255,255,255,0.06)] text-[var(--text)] font-medium"
              : "text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-[var(--text-3)]" strokeWidth={1.5} />
          <span>Agent</span>
        </Link>

        {/* Section: Workspace */}
        <div className="pt-4">
          <button
            type="button"
            onClick={() => setWorkspaceOpen(!workspaceOpen)}
            className="flex h-6 w-full items-center gap-1.5 rounded-[var(--radius)] px-2 text-[12px] font-medium text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors duration-100 ease-out cursor-pointer"
          >
            <span>Workspace</span>
            <ChevronRight
              className={`h-3 w-3 text-[var(--text-4)] transition-transform duration-150 ${
                workspaceOpen ? "rotate-90" : ""
              }`}
            />
          </button>
          {workspaceOpen && (
            <div className="pl-2 pr-1 py-1 space-y-0.5">
              <Link
                href="/projects"
                className={`flex h-7 w-full items-center gap-2 rounded-[var(--radius)] px-2 text-[13px] transition-colors cursor-pointer ${
                  isProjectsActive
                    ? "bg-[rgba(255,255,255,0.06)] text-[var(--text)] font-medium"
                    : "text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
                }`}
              >
                <FolderKanban className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                <span>Projects</span>
              </Link>

              <Link
                href="/views"
                className={`flex h-7 w-full items-center gap-2 rounded-[var(--radius)] px-2 text-[13px] transition-colors cursor-pointer ${
                  isViewsActive
                    ? "bg-[rgba(255,255,255,0.06)] text-[var(--text)] font-medium"
                    : "text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
                }`}
              >
                <Layers className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                <span>Views</span>
              </Link>

              <button
                type="button"
                className="flex h-7 w-full items-center gap-2 rounded-[var(--radius)] px-2 text-[13px] text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)] transition-colors cursor-pointer"
              >
                <MoreHorizontal className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                <span>More</span>
              </button>
            </div>
          )}
        </div>

        {/* Section: Your teams */}
        <div className="pt-2">
          <div className="flex items-center justify-between pr-1">
            <button
              type="button"
              onClick={() => setTeamsOpen(!teamsOpen)}
              className="flex h-6 flex-1 items-center gap-1.5 rounded-[var(--radius)] px-2 text-[12px] font-medium text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors duration-100 ease-out cursor-pointer"
            >
              <span>Your teams</span>
              <ChevronRight
                className={`h-3 w-3 text-[var(--text-4)] transition-transform duration-150 ${
                  teamsOpen ? "rotate-90" : ""
                }`}
              />
            </button>
            <button
              type="button"
              title="Create team"
              onClick={() => {
                setTeamsOpen(true);
                setIsCreatingTeam((v) => !v);
              }}
              className="flex h-5 w-5 items-center justify-center rounded text-[var(--text-4)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)] cursor-pointer"
            >
              <Plus className="h-3 w-3" strokeWidth={1.75} />
            </button>
          </div>

          {teamsOpen && (
            <div className="pl-2 pr-1 py-1 space-y-0.5">
              {isCreatingTeam && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newTeamName.trim() || !newTeamKey.trim()) return;
                    try {
                      const res = await createTeam.mutateAsync({
                        name: newTeamName.trim(),
                        key: newTeamKey.trim().toUpperCase(),
                      });
                      setNewTeamName("");
                      setNewTeamKey("");
                      setIsCreatingTeam(false);
                      if (res.team?.key) {
                        router.push(`/team/${res.team.key}/issues`);
                      }
                    } catch {
                      // Handled by useCreateTeam
                    }
                  }}
                  className="mb-1.5 space-y-1.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] p-2"
                >
                  <input
                    type="text"
                    autoFocus
                    value={newTeamName}
                    onChange={(e) => {
                      const v = e.target.value;
                      setNewTeamName(v);
                      setNewTeamKey(
                        v
                          .replace(/[^a-zA-Z0-9]/g, "")
                          .slice(0, 3)
                          .toUpperCase()
                      );
                    }}
                    placeholder="Team name (e.g. Design)"
                    className="h-6 w-full rounded border border-[var(--border)] bg-[var(--bg)] px-2 text-[11px] text-[var(--text)] placeholder:text-[var(--text-4)] focus:outline-none focus:border-[var(--accent)]"
                  />
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newTeamKey}
                      maxLength={10}
                      onChange={(e) =>
                        setNewTeamKey(
                          e.target.value
                            .replace(/[^a-zA-Z0-9]/g, "")
                            .toUpperCase()
                        )
                      }
                      placeholder="DES"
                      className="h-6 w-16 rounded border border-[var(--border)] bg-[var(--bg)] px-2 text-[11px] font-mono text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                    />
                    <button
                      type="submit"
                      disabled={
                        !newTeamName.trim() ||
                        newTeamKey.trim().length < 2 ||
                        createTeam.isPending
                      }
                      className="h-6 flex-1 rounded bg-[var(--accent)] text-[11px] font-medium text-[var(--text)] hover:bg-[var(--accent-hover)] disabled:opacity-40 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </form>
              )}

              {teams.map((team, idx) => {
                const isExpanded = expandedTeams[team.id] ?? idx === 0;
                const issuesHref = `/team/${team.key}/issues`;
                const backlogHref = `/team/${team.key}/backlog`;
                const cyclesHref = `/team/${team.key}/cycles`;
                const isIssuesActive = pathname === issuesHref;
                const isBacklogActive = pathname === backlogHref;
                const isCyclesActive = pathname === cyclesHref;

                return (
                  <div key={team.id} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedTeams((prev) => ({
                          ...prev,
                          [team.id]: !isExpanded,
                        }))
                      }
                      className="flex h-7 w-full items-center justify-between rounded-[var(--radius)] px-2 text-[13px] text-[var(--text-2)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)] transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <Users2
                          className="h-3.5 w-3.5 shrink-0 text-[var(--text-3)]"
                          strokeWidth={1.5}
                        />
                        <span className="truncate">{team.name}</span>
                      </span>
                      <ChevronRight
                        className={`h-3 w-3 shrink-0 text-[var(--text-4)] transition-transform duration-150 ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="pl-5 space-y-0.5">
                        <Link
                          href={issuesHref}
                          className={`flex h-6 w-full items-center gap-2 rounded-[var(--radius)] px-2 text-[12px] transition-colors ${
                            isIssuesActive
                              ? "bg-[rgba(255,255,255,0.06)] text-[var(--text)] font-medium"
                              : "text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
                          }`}
                        >
                          <span>Issues</span>
                        </Link>
                        <Link
                          href={backlogHref}
                          className={`flex h-6 w-full items-center gap-2 rounded-[var(--radius)] px-2 text-[12px] transition-colors ${
                            isBacklogActive
                              ? "bg-[rgba(255,255,255,0.06)] text-[var(--text)] font-medium"
                              : "text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
                          }`}
                        >
                          <span>Backlog</span>
                        </Link>
                        <Link
                          href={cyclesHref}
                          className={`flex h-6 w-full items-center gap-2 rounded-[var(--radius)] px-2 text-[12px] transition-colors ${
                            isCyclesActive
                              ? "bg-[rgba(255,255,255,0.06)] text-[var(--text)] font-medium"
                              : "text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
                          }`}
                        >
                          <span>Cycles</span>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section: Try */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setTryOpen(!tryOpen)}
            className="flex h-6 w-full items-center gap-1.5 rounded-[var(--radius)] px-2 text-[12px] font-medium text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors duration-100 ease-out cursor-pointer"
          >
            <span>Try</span>
            <ChevronRight
              className={`h-3 w-3 text-[var(--text-4)] transition-transform duration-150 ${
                tryOpen ? "rotate-90" : ""
              }`}
            />
          </button>
          {tryOpen && (
            <div className="pl-4 pr-1 py-1 space-y-0.5">
              <Link
                href="/cycles"
                className={`flex h-6 w-full items-center gap-2 rounded-[var(--radius)] px-2 text-[12px] transition-colors ${
                  pathname.startsWith("/cycles")
                    ? "bg-[rgba(255,255,255,0.06)] text-[var(--text)] font-medium"
                    : "text-[var(--text-4)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
                }`}
              >
                <HelpCircle className="h-3 w-3" strokeWidth={1.5} />
                <span>Cycles &amp; Sprints</span>
              </Link>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}
