"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi } from "@/features/auth/api/auth-api";
import { onboardingApi } from "@/features/onboarding/api/onboarding-api";
import {
  useLabels,
  useWorkspaceMembers,
} from "@/features/issues/hooks/use-issues";
import { useAuthStore } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";
import {
  IssueStatusIcon,
  STATUS_LABELS,
} from "@/components/ui/issue-status-icon";
import { IssueStatus } from "@/types/issue.types";
import {
  ArrowLeft,
  Bell,
  Building2,
  CircleDot,
  FolderKanban,
  Loader2,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Tag,
  User as UserIcon,
  Users,
} from "lucide-react";

type SettingsSection =
  | "personal-profile"
  | "personal-preferences"
  | "personal-notifications"
  | "issues-workflows"
  | "issues-defaults"
  | "projects-general"
  | "features-modules"
  | "members";

const STATUS_LIST: IssueStatus[] = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
  "CANCELED",
];

const PROJECT_HEALTH_STATES = [
  { label: "Planned", color: "bg-[var(--text-4)]", desc: "Scoped and queued for an upcoming cycle" },
  { label: "In Progress", color: "bg-[var(--warning)]", desc: "Actively executing toward target date" },
  { label: "Paused", color: "bg-[#f97316]", desc: "Temporarily on hold pending dependencies" },
  { label: "Completed", color: "bg-[var(--success)]", desc: "All deliverables shipped and verified" },
  { label: "Canceled", color: "bg-[var(--danger)]", desc: "Deprioritized or superseded" },
];

export function SettingsView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    user,
    setUser,
    clearAuth,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuthStore();
  const { issueViewMode, setIssueViewMode } = useUIStore();

  const [activeSection, setActiveSection] =
    useState<SettingsSection>("personal-profile");

  // Personal Profile state
  const [name, setName] = useState(user?.name || "");
  const [title, setTitle] = useState(user?.title || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  // Notification preferences (UI state)
  const [notifPrefs, setNotifPrefs] = useState({
    assignments: true,
    mentions: true,
    statusChanges: true,
    comments: true,
  });

  // Issue defaults (UI state)
  const [defaultIssueStatus, setDefaultIssueStatus] =
    useState<IssueStatus>("BACKLOG");
  const [autoAssignCreator, setAutoAssignCreator] = useState(false);

  // Project defaults (UI state)
  const [projectDefaults, setProjectDefaults] = useState({
    requireLead: true,
    autoCalculateProgress: true,
    weeklyHealthReminders: false,
  });

  // Features toggles (UI state)
  const [featureFlags, setFeatureFlags] = useState({
    cycles: true,
    triage: false,
    subIssuesAndRelations: true,
    documents: true,
    reviews: true,
    agent: true,
  });

  // Workspace members & invites
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  const { data: members = [], isLoading: membersLoading } =
    useWorkspaceMembers(undefined, isAuthenticated);
  const { data: labels = [], isLoading: labelsLoading } = useLabels(
    undefined,
    isAuthenticated
  );

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "members") {
      setActiveSection("members");
    } else if (tab === "issues") {
      setActiveSection("issues-workflows");
    } else if (tab === "projects") {
      setActiveSection("projects-general");
    } else if (tab === "features") {
      setActiveSection("features-modules");
    }
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setTitle(user.title || "");
    }
  }, [user]);

  const activeWorkspace = user?.workspaces?.[0];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSavingProfile(true);
    try {
      const res = await onboardingApi.updateProfile({
        name: name.trim(),
        title: title.trim(),
      });
      if (res.user) {
        setUser(res.user);
      }
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLogoutAll = async () => {
    setIsLoggingOutAll(true);
    try {
      await authApi.logoutAll();
      queryClient.clear();
      clearAuth();
      toast.success("Logged out from all sessions");
      router.replace("/login");
    } catch {
      toast.error("Failed to revoke sessions");
    } finally {
      setIsLoggingOutAll(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    try {
      await onboardingApi.sendInvites({
        emails: [inviteEmail.trim()],
        workspaceId: activeWorkspace?.id,
      });
      toast.success("Invitation sent", { description: inviteEmail.trim() });
      setInviteEmail("");
    } catch {
      toast.error("Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--bg)] text-[var(--text-3)]">
        <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--bg)] text-[var(--text)] font-sans">
      {/* Dedicated Settings Left Sidebar */}
      <aside className="flex h-screen w-[240px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg)] select-none">
        <div className="flex h-11 items-center border-b border-[var(--border)] px-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-[var(--radius)] px-2 py-1 text-[13px] font-medium text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>Back to app</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {/* Group 1: Personal */}
          <div className="space-y-0.5">
            <div className="px-2 pb-1 text-[11px] font-medium text-[var(--text-4)]">
              Personal
            </div>
            <SettingsNavItem
              active={activeSection === "personal-profile"}
              onClick={() => setActiveSection("personal-profile")}
              icon={UserIcon}
              label="Profile & Security"
            />
            <SettingsNavItem
              active={activeSection === "personal-preferences"}
              onClick={() => setActiveSection("personal-preferences")}
              icon={SlidersHorizontal}
              label="Preferences"
            />
            <SettingsNavItem
              active={activeSection === "personal-notifications"}
              onClick={() => setActiveSection("personal-notifications")}
              icon={Bell}
              label="Notifications"
            />
          </div>

          {/* Group 2: Issues */}
          <div className="space-y-0.5">
            <div className="px-2 pb-1 text-[11px] font-medium text-[var(--text-4)]">
              Issues
            </div>
            <SettingsNavItem
              active={activeSection === "issues-workflows"}
              onClick={() => setActiveSection("issues-workflows")}
              icon={CircleDot}
              label="Statuses & Labels"
            />
            <SettingsNavItem
              active={activeSection === "issues-defaults"}
              onClick={() => setActiveSection("issues-defaults")}
              icon={Tag}
              label="Issue Defaults"
            />
          </div>

          {/* Group 3: Projects */}
          <div className="space-y-0.5">
            <div className="px-2 pb-1 text-[11px] font-medium text-[var(--text-4)]">
              Projects
            </div>
            <SettingsNavItem
              active={activeSection === "projects-general"}
              onClick={() => setActiveSection("projects-general")}
              icon={FolderKanban}
              label="Project Settings"
            />
          </div>

          {/* Group 4: Features */}
          <div className="space-y-0.5">
            <div className="px-2 pb-1 text-[11px] font-medium text-[var(--text-4)]">
              Features
            </div>
            <SettingsNavItem
              active={activeSection === "features-modules"}
              onClick={() => setActiveSection("features-modules")}
              icon={Sparkles}
              label="Workspace Features"
            />
          </div>

          {/* Group 5: Workspace & Members */}
          <div className="space-y-0.5">
            <div className="px-2 pb-1 text-[11px] font-medium text-[var(--text-4)]">
              Workspace
            </div>
            <SettingsNavItem
              active={activeSection === "members"}
              onClick={() => setActiveSection("members")}
              icon={Users}
              label="General & Members"
            />
          </div>
        </nav>
      </aside>

      {/* Main Settings Content */}
      <main className="flex-1 overflow-y-auto bg-[var(--bg)] px-8 py-10">
        <div className="mx-auto max-w-2xl space-y-8">
          {/* PERSONAL: PROFILE & SECURITY */}
          {activeSection === "personal-profile" && (
            <>
              <div>
                <h1 className="text-[18px] font-medium tracking-tight text-[var(--text)]">
                  Profile &amp; Security
                </h1>
                <p className="mt-1 text-[12px] text-[var(--text-3)]">
                  Manage how your name and title appear across SprintSync.
                </p>
              </div>

              <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] p-5 space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-[var(--border)]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f59e0b] text-[14px] font-semibold text-[#08090a]">
                    {(name || user?.name || "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-[var(--text)]">
                      {user?.name}
                    </div>
                    <div className="text-[12px] text-[var(--text-4)]">
                      {user?.email}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-3.5">
                  <div>
                    <label className="block text-[12px] text-[var(--text-3)] mb-1">
                      Full name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-8 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-2.5 text-[13px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] text-[var(--text-3)] mb-1">
                      Job title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Software engineer"
                      className="h-8 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-2.5 text-[13px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={!name.trim() || isSavingProfile}
                      className="flex h-8 items-center rounded-[var(--radius)] bg-[var(--accent)] px-3.5 text-[12px] font-medium text-[var(--text)] hover:bg-[var(--accent-hover)] disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingProfile ? "Saving..." : "Save profile"}
                    </button>
                  </div>
                </form>
              </section>

              <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] p-5 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--text)]">
                    <Shield className="h-3.5 w-3.5 text-[var(--text-3)]" />
                    <span>Active sessions</span>
                  </div>
                  <p className="text-[12px] text-[var(--text-3)]">
                    Revoke all refresh tokens and log out from every browser.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isLoggingOutAll}
                  onClick={handleLogoutAll}
                  className="shrink-0 h-8 rounded-[var(--radius)] border border-[var(--danger)]/40 bg-[rgba(235,87,87,0.1)] px-3 text-[12px] font-medium text-[var(--danger)] hover:bg-[rgba(235,87,87,0.18)] disabled:opacity-50 cursor-pointer"
                >
                  {isLoggingOutAll ? "Revoking..." : "Log out all sessions"}
                </button>
              </section>
            </>
          )}

          {/* PERSONAL: PREFERENCES */}
          {activeSection === "personal-preferences" && (
            <>
              <div>
                <h1 className="text-[18px] font-medium tracking-tight text-[var(--text)]">
                  Preferences
                </h1>
                <p className="mt-1 text-[12px] text-[var(--text-3)]">
                  Customize your workspace interface and default layout.
                </p>
              </div>

              <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] divide-y divide-[var(--border)]">
                <div className="flex items-center justify-between p-4">
                  <div>
                    <div className="text-[13px] font-medium text-[var(--text)]">
                      Default team issue layout
                    </div>
                    <div className="text-[12px] text-[var(--text-3)]">
                      Choose between High-Density List or Kanban Board.
                    </div>
                  </div>
                  <div className="flex rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] p-0.5">
                    {(["list", "board"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setIssueViewMode(mode);
                          toast.success(`Default view set to ${mode}`);
                        }}
                        className={`h-6 rounded-[4px] px-2.5 text-[12px] capitalize cursor-pointer ${
                          issueViewMode === mode
                            ? "bg-[rgba(255,255,255,0.08)] font-medium text-[var(--text)]"
                            : "text-[var(--text-4)] hover:text-[var(--text-2)]"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4">
                  <div>
                    <div className="text-[13px] font-medium text-[var(--text)]">
                      Interface theme
                    </div>
                    <div className="text-[12px] text-[var(--text-3)]">
                      Linear-grade low-glare dark mode.
                    </div>
                  </div>
                  <span className="rounded border border-[var(--border)] bg-[var(--bg-elev)] px-2.5 py-1 text-[11px] text-[var(--text-2)]">
                    Dark (Default)
                  </span>
                </div>
              </section>

              <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] p-4 space-y-2.5">
                <h2 className="text-[13px] font-medium text-[var(--text)]">
                  Keyboard shortcuts
                </h2>
                <div className="grid grid-cols-2 gap-2 text-[12px]">
                  <div className="flex items-center justify-between rounded bg-[var(--bg)] px-2.5 py-1.5">
                    <span className="text-[var(--text-3)]">Create issue</span>
                    <kbd className="rounded border border-[var(--border)] px-1.5 text-[11px]">C</kbd>
                  </div>
                  <div className="flex items-center justify-between rounded bg-[var(--bg)] px-2.5 py-1.5">
                    <span className="text-[var(--text-3)]">Close modal</span>
                    <kbd className="rounded border border-[var(--border)] px-1.5 text-[11px]">Esc</kbd>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* PERSONAL: NOTIFICATIONS */}
          {activeSection === "personal-notifications" && (
            <>
              <div>
                <h1 className="text-[18px] font-medium tracking-tight text-[var(--text)]">
                  Notifications
                </h1>
                <p className="mt-1 text-[12px] text-[var(--text-3)]">
                  Control which events appear in your SprintSync Inbox.
                </p>
              </div>

              <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] divide-y divide-[var(--border)]">
                <ToggleRow
                  title="Issue assignments"
                  description="Notify me when an issue is assigned or reassigned to me."
                  checked={notifPrefs.assignments}
                  onToggle={() =>
                    setNotifPrefs((p) => ({ ...p, assignments: !p.assignments }))
                  }
                />
                <ToggleRow
                  title="Mentions"
                  description="Notify me when someone @mentions me in an issue or document."
                  checked={notifPrefs.mentions}
                  onToggle={() =>
                    setNotifPrefs((p) => ({ ...p, mentions: !p.mentions }))
                  }
                />
                <ToggleRow
                  title="Status changes"
                  description="Notify me when issues I created or follow change workflow state."
                  checked={notifPrefs.statusChanges}
                  onToggle={() =>
                    setNotifPrefs((p) => ({
                      ...p,
                      statusChanges: !p.statusChanges,
                    }))
                  }
                />
                <ToggleRow
                  title="Comments & replies"
                  description="Notify me on new replies in threads I participate in."
                  checked={notifPrefs.comments}
                  onToggle={() =>
                    setNotifPrefs((p) => ({ ...p, comments: !p.comments }))
                  }
                />
              </section>
            </>
          )}

          {/* ISSUES: STATUSES & LABELS */}
          {activeSection === "issues-workflows" && (
            <>
              <div>
                <h1 className="text-[18px] font-medium tracking-tight text-[var(--text)]">
                  Issues — Statuses &amp; Labels
                </h1>
                <p className="mt-1 text-[12px] text-[var(--text-3)]">
                  Workflow states and labels configured for your workspace.
                </p>
              </div>

              <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] p-4 space-y-3">
                <h2 className="text-[13px] font-medium text-[var(--text)]">
                  Workflow statuses
                </h2>
                <div className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
                  {STATUS_LIST.map((st) => (
                    <div
                      key={st}
                      className="flex items-center justify-between py-2 text-[12px]"
                    >
                      <span className="flex items-center gap-2 text-[var(--text-2)]">
                        <IssueStatusIcon status={st} className="h-3.5 w-3.5" />
                        <span>{STATUS_LABELS[st]}</span>
                      </span>
                      <span className="font-mono text-[11px] text-[var(--text-4)]">
                        {st}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] p-4 space-y-3">
                <h2 className="text-[13px] font-medium text-[var(--text)]">
                  Workspace labels
                </h2>
                {labelsLoading ? (
                  <div className="py-4 flex justify-center text-[var(--text-4)]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {labels.map((lbl) => (
                      <span
                        key={lbl.id}
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-1 text-[12px] text-[var(--text-2)]"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: lbl.color }}
                        />
                        <span>{lbl.name}</span>
                      </span>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {/* ISSUES: DEFAULTS */}
          {activeSection === "issues-defaults" && (
            <>
              <div>
                <h1 className="text-[18px] font-medium tracking-tight text-[var(--text)]">
                  Issue Defaults
                </h1>
                <p className="mt-1 text-[12px] text-[var(--text-3)]">
                  Default status, estimation scale, and creation behavior.
                </p>
              </div>

              <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] divide-y divide-[var(--border)]">
                <div className="flex items-center justify-between p-4">
                  <div>
                    <div className="text-[13px] font-medium text-[var(--text)]">
                      Default new issue status
                    </div>
                    <div className="text-[12px] text-[var(--text-3)]">
                      Initial status when opening the Create Issue modal.
                    </div>
                  </div>
                  <select
                    value={defaultIssueStatus}
                    onChange={(e) => {
                      setDefaultIssueStatus(e.target.value as IssueStatus);
                      toast.success("Default issue status updated");
                    }}
                    className="h-7 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-2 text-[12px] text-[var(--text)]"
                  >
                    {STATUS_LIST.map((st) => (
                      <option key={st} value={st}>
                        {STATUS_LABELS[st]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between p-4">
                  <div>
                    <div className="text-[13px] font-medium text-[var(--text)]">
                      Estimation scale
                    </div>
                    <div className="text-[12px] text-[var(--text-3)]">
                      Story points scale used across teams.
                    </div>
                  </div>
                  <span className="rounded border border-[var(--border)] bg-[var(--bg-elev)] px-2.5 py-1 text-[11px] text-[var(--text-2)]">
                    Fibonacci (1, 2, 3, 5, 8)
                  </span>
                </div>

                <ToggleRow
                  title="Auto-assign creator"
                  description="Automatically assign new issues to the user who created them."
                  checked={autoAssignCreator}
                  onToggle={() => setAutoAssignCreator((v) => !v)}
                />
              </section>
            </>
          )}

          {/* PROJECTS */}
          {activeSection === "projects-general" && (
            <>
              <div>
                <h1 className="text-[18px] font-medium tracking-tight text-[var(--text)]">
                  Project Settings
                </h1>
                <p className="mt-1 text-[12px] text-[var(--text-3)]">
                  Configure project health indicators, milestones, and progress
                  tracking.
                </p>
              </div>

              <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] divide-y divide-[var(--border)]">
                <ToggleRow
                  title="Require project lead"
                  description="Prompt for a lead engineer when creating a new project."
                  checked={projectDefaults.requireLead}
                  onToggle={() =>
                    setProjectDefaults((p) => ({
                      ...p,
                      requireLead: !p.requireLead,
                    }))
                  }
                />
                <ToggleRow
                  title="Automated progress aggregation"
                  description="Calculate project completion % automatically from child issue statuses."
                  checked={projectDefaults.autoCalculateProgress}
                  onToggle={() =>
                    setProjectDefaults((p) => ({
                      ...p,
                      autoCalculateProgress: !p.autoCalculateProgress,
                    }))
                  }
                />
                <ToggleRow
                  title="Weekly health reminders"
                  description="Remind project leads to update project health status every Friday."
                  checked={projectDefaults.weeklyHealthReminders}
                  onToggle={() =>
                    setProjectDefaults((p) => ({
                      ...p,
                      weeklyHealthReminders: !p.weeklyHealthReminders,
                    }))
                  }
                />
              </section>

              <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] p-4 space-y-3">
                <h2 className="text-[13px] font-medium text-[var(--text)]">
                  Project health indicators
                </h2>
                <div className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
                  {PROJECT_HEALTH_STATES.map((state) => (
                    <div
                      key={state.label}
                      className="flex items-center justify-between gap-4 py-2.5 text-[12px]"
                    >
                      <span className="flex items-center gap-2 font-medium text-[var(--text)]">
                        <span className={`h-2 w-2 rounded-full ${state.color}`} />
                        <span>{state.label}</span>
                      </span>
                      <span className="text-[var(--text-4)]">{state.desc}</span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* FEATURES */}
          {activeSection === "features-modules" && (
            <>
              <div>
                <h1 className="text-[18px] font-medium tracking-tight text-[var(--text)]">
                  Workspace Features
                </h1>
                <p className="mt-1 text-[12px] text-[var(--text-3)]">
                  Enable or configure product modules across your workspace.
                </p>
              </div>

              <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] divide-y divide-[var(--border)]">
                <ToggleRow
                  title="Cycles (Sprints Engine)"
                  description="Automated 2-week execution sprints with burndown & rollover."
                  checked={featureFlags.cycles}
                  onToggle={() =>
                    setFeatureFlags((f) => ({ ...f, cycles: !f.cycles }))
                  }
                />
                <ToggleRow
                  title="Triage Queue"
                  description="Route incoming issues into a Triage queue before entering Backlog."
                  checked={featureFlags.triage}
                  onToggle={() =>
                    setFeatureFlags((f) => ({ ...f, triage: !f.triage }))
                  }
                />
                <ToggleRow
                  title="Sub-issues & Issue Relations"
                  description="Allow parent/child issue hierarchies and blocking/duplicate links."
                  checked={featureFlags.subIssuesAndRelations}
                  onToggle={() =>
                    setFeatureFlags((f) => ({
                      ...f,
                      subIssuesAndRelations: !f.subIssuesAndRelations,
                    }))
                  }
                />
                <ToggleRow
                  title="Documents (Tiptap Rich Editor)"
                  description="Collaborative specs, slash commands (/), and debounced auto-save."
                  checked={featureFlags.documents}
                  onToggle={() =>
                    setFeatureFlags((f) => ({ ...f, documents: !f.documents }))
                  }
                />
                <ToggleRow
                  title="Reviews (Code & PR Queue)"
                  description="Review pull requests alongside linked SprintSync issues."
                  checked={featureFlags.reviews}
                  onToggle={() =>
                    setFeatureFlags((f) => ({ ...f, reviews: !f.reviews }))
                  }
                />
                <ToggleRow
                  title="SprintSync Agent"
                  description="AI assistant for scoping projects, searching backlog, and setup."
                  checked={featureFlags.agent}
                  onToggle={() =>
                    setFeatureFlags((f) => ({ ...f, agent: !f.agent }))
                  }
                />
              </section>
            </>
          )}

          {/* WORKSPACE & MEMBERS */}
          {activeSection === "members" && (
            <>
              <div>
                <h1 className="text-[18px] font-medium tracking-tight text-[var(--text)]">
                  Workspace &amp; Members
                </h1>
                <p className="mt-1 text-[12px] text-[var(--text-3)]">
                  Manage workspace details and invite teammates.
                </p>
              </div>

              <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] p-5 space-y-2">
                <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--text)]">
                  <Building2 className="h-4 w-4 text-[var(--text-3)]" />
                  <span>{activeWorkspace?.name || "Workspace"}</span>
                </div>
                <p className="text-[12px] text-[var(--text-3)]">
                  URL:{" "}
                  <span className="font-mono text-[var(--text-2)]">
                    sprintsync.app/{activeWorkspace?.slug || "workspace"}
                  </span>
                </p>
              </section>

              <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] p-5 space-y-5">
                <div className="flex items-center gap-2">
                  <Users
                    className="h-4 w-4 text-[var(--text-3)]"
                    strokeWidth={1.5}
                  />
                  <h2 className="text-[14px] font-medium text-[var(--text)]">
                    Workspace Members ({members.length})
                  </h2>
                </div>

                <form onSubmit={handleInvite} className="flex gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@company.com"
                    className="h-8 flex-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-2.5 text-[13px] text-[var(--text)] placeholder:text-[var(--text-4)] focus:outline-none focus:border-[var(--accent)]"
                  />
                  <button
                    type="submit"
                    disabled={!inviteEmail.trim() || isInviting}
                    className="flex h-8 items-center rounded-[var(--radius)] bg-[var(--accent)] px-3 text-[12px] font-medium text-[var(--text)] hover:bg-[var(--accent-hover)] disabled:opacity-50 cursor-pointer"
                  >
                    {isInviting ? "Sending..." : "Invite"}
                  </button>
                </form>

                <div className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
                  {membersLoading ? (
                    <div className="flex justify-center py-6 text-[var(--text-4)]">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between py-2.5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f59e0b] text-[11px] font-medium text-[#08090a]">
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-[13px] font-medium text-[var(--text)]">
                              {member.name}
                            </div>
                            <div className="truncate text-[11px] text-[var(--text-4)]">
                              {member.email}
                            </div>
                          </div>
                        </div>
                        <span className="rounded border border-[var(--border)] bg-[var(--bg-elev)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-3)]">
                          {member.role}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function SettingsNavItem({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-7 w-full items-center gap-2 rounded-[var(--radius)] px-2 text-[13px] transition-colors cursor-pointer ${
        active
          ? "bg-[rgba(255,255,255,0.06)] text-[var(--text)] font-medium"
          : "text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
      <span className="truncate">{label}</span>
    </button>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onToggle,
}: {
  title: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div>
        <div className="text-[13px] font-medium text-[var(--text)]">
          {title}
        </div>
        <div className="text-[12px] text-[var(--text-3)]">{description}</div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
          checked
            ? "bg-[var(--accent)]"
            : "bg-[var(--bg-elev)] border border-[var(--border-strong)]"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-[var(--text)] transition-transform ${
            checked ? "translate-x-4.5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
