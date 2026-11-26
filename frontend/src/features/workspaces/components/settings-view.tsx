"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { useAuthStore } from "@/store/useAuthStore";
import { useWorkspaceMembers } from "@/features/issues/hooks/use-issues";
import { onboardingApi } from "@/features/onboarding/api/onboarding-api";
import { Settings, Users, User as UserIcon, Loader2 } from "lucide-react";

type SettingsTab = "general" | "members";

export function SettingsView() {
  const { user, setUser, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  const [name, setName] = useState(user?.name || "");
  const [title, setTitle] = useState(user?.title || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  const { data: members = [], isLoading: membersLoading } =
    useWorkspaceMembers(undefined, isAuthenticated);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "members") {
      setActiveTab("members");
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

  return (
    <WorkspaceShell>
      {/* Header */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
        <div className="flex items-center gap-2">
          <Settings
            className="h-3.5 w-3.5 text-[var(--text-3)]"
            strokeWidth={1.5}
          />
          <span className="text-[13px] font-medium tracking-tight text-[var(--text)]">
            Settings
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`h-6 rounded-full border px-2.5 text-[11px] transition-colors cursor-pointer ${
              activeTab === "general"
                ? "border-[var(--border-strong)] bg-[rgba(255,255,255,0.08)] font-medium text-[var(--text)]"
                : "border-[var(--border)] text-[var(--text-3)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            Profile &amp; Workspace
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={`h-6 rounded-full border px-2.5 text-[11px] transition-colors cursor-pointer ${
              activeTab === "members"
                ? "border-[var(--border-strong)] bg-[rgba(255,255,255,0.08)] font-medium text-[var(--text)]"
                : "border-[var(--border)] text-[var(--text-3)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            Members
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto max-w-xl space-y-8">
          {activeTab === "general" ? (
            <>
              <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <UserIcon
                    className="h-4 w-4 text-[var(--text-3)]"
                    strokeWidth={1.5}
                  />
                  <h2 className="text-[14px] font-medium text-[var(--text)]">
                    Your Profile
                  </h2>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-3">
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
                      Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Software engineer"
                      className="h-8 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-2.5 text-[13px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div className="pt-1 flex justify-end">
                    <button
                      type="submit"
                      disabled={!name.trim() || isSavingProfile}
                      className="flex h-7 items-center rounded-[var(--radius)] bg-[var(--accent)] px-3 text-[12px] font-medium text-[var(--text)] hover:bg-[var(--accent-hover)] disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingProfile ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </form>
              </section>

              <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] p-5 space-y-2">
                <h2 className="text-[14px] font-medium text-[var(--text)]">
                  Active Workspace
                </h2>
                <p className="text-[12px] text-[var(--text-3)]">
                  Name:{" "}
                  <span className="text-[var(--text)] font-medium">
                    {activeWorkspace?.name || "—"}
                  </span>
                </p>
                <p className="text-[12px] text-[var(--text-3)]">
                  URL slug:{" "}
                  <span className="font-mono text-[var(--text-2)]">
                    sprintsync.app/{activeWorkspace?.slug || "workspace"}
                  </span>
                </p>
              </section>
            </>
          ) : (
            <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] p-5 space-y-5">
              <div className="flex items-center gap-2">
                <Users
                  className="h-4 w-4 text-[var(--text-3)]"
                  strokeWidth={1.5}
                />
                <h2 className="text-[14px] font-medium text-[var(--text)]">
                  Workspace Members
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
          )}
        </div>
      </div>
    </WorkspaceShell>
  );
}
