"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  useAddTeamMember,
  useCreateTeam,
  useRemoveTeamMember,
  useTeamMembers,
  useTeams,
  useUpdateTeamMemberRole,
  useWorkspaceMembers,
} from "@/features/issues/hooks/use-issues";
import { TeamMemberRole } from "@/types/issue.types";
import {
  Check,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
  UserPlus,
  Users2,
} from "lucide-react";

interface TeamsSettingsSectionProps {
  workspaceId?: string;
  currentUserId?: string;
  initialTeamKey?: string | null;
  enabled: boolean;
  onNavigateToWorkspaceMembers: () => void;
}

export function TeamsSettingsSection({
  workspaceId,
  currentUserId,
  initialTeamKey,
  enabled,
  onNavigateToWorkspaceMembers,
}: TeamsSettingsSectionProps) {
  const { data: teams = [], isLoading: teamsLoading } = useTeams(
    workspaceId,
    enabled
  );
  const { data: workspaceMembers = [], isLoading: wsMembersLoading } =
    useWorkspaceMembers(workspaceId, enabled);

  const createTeam = useCreateTeam();
  const addTeamMember = useAddTeamMember();
  const updateTeamMemberRole = useUpdateTeamMemberRole();
  const removeTeamMember = useRemoveTeamMember();

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamKey, setNewTeamKey] = useState("");

  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<TeamMemberRole>("MEMBER");
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  // Select team from ?team=<key> when it arrives
  useEffect(() => {
    if (!initialTeamKey || teams.length === 0) return;
    const matched = teams.find(
      (t) => t.key.toUpperCase() === initialTeamKey.toUpperCase()
    );
    if (matched) {
      setSelectedTeamId(matched.id);
    }
  }, [initialTeamKey, teams]);

  // Default to first team when none is selected
  useEffect(() => {
    if (teams.length === 0) return;
    setSelectedTeamId((prev) => {
      if (prev && teams.some((t) => t.id === prev)) return prev;
      return teams[0]?.id ?? null;
    });
  }, [teams]);

  const selectedTeam = useMemo(
    () => teams.find((t) => t.id === selectedTeamId) ?? teams[0] ?? null,
    [teams, selectedTeamId]
  );

  const { data: teamMembers = [], isLoading: teamMembersLoading } =
    useTeamMembers(selectedTeam?.id, enabled && Boolean(selectedTeam?.id));

  const availableWorkspaceMembers = useMemo(() => {
    const memberIds = new Set(teamMembers.map((m) => m.userId));
    return workspaceMembers.filter((wm) => !memberIds.has(wm.id));
  }, [workspaceMembers, teamMembers]);

  // Keep add-member dropdown pointed at an available member
  useEffect(() => {
    if (availableWorkspaceMembers.length === 0) {
      setSelectedUserId("");
      return;
    }
    if (!availableWorkspaceMembers.some((m) => m.id === selectedUserId)) {
      setSelectedUserId(availableWorkspaceMembers[0]!.id);
    }
  }, [availableWorkspaceMembers, selectedUserId]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || newTeamKey.trim().length < 2) return;
    try {
      const res = await createTeam.mutateAsync({
        name: newTeamName.trim(),
        key: newTeamKey.trim().toUpperCase(),
        workspaceId,
      });
      setNewTeamName("");
      setNewTeamKey("");
      setIsCreatingTeam(false);
      if (res.team?.id) {
        setSelectedTeamId(res.team.id);
      }
    } catch {
      // Toast handled by hook
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !selectedUserId) return;
    try {
      await addTeamMember.mutateAsync({
        teamId: selectedTeam.id,
        userId: selectedUserId,
        role: selectedRole,
      });
      setSelectedRole("MEMBER");
    } catch {
      // Toast handled by hook
    }
  };

  const handleJoinCurrentUser = async () => {
    if (!selectedTeam || !currentUserId) return;
    setPendingUserId(currentUserId);
    try {
      await addTeamMember.mutateAsync({
        teamId: selectedTeam.id,
        userId: currentUserId,
        role: "LEAD",
      });
    } finally {
      setPendingUserId(null);
    }
  };

  const handleRoleChange = async (userId: string, role: TeamMemberRole) => {
    if (!selectedTeam) return;
    setPendingUserId(userId);
    try {
      await updateTeamMemberRole.mutateAsync({
        teamId: selectedTeam.id,
        userId,
        role,
      });
    } finally {
      setPendingUserId(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedTeam) return;
    setPendingUserId(userId);
    try {
      await removeTeamMember.mutateAsync({
        teamId: selectedTeam.id,
        userId,
      });
    } finally {
      setPendingUserId(null);
    }
  };

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-medium tracking-tight text-[var(--text)]">
            Teams &amp; Members
          </h1>
          <p className="mt-1 text-[12px] text-[var(--text-3)]">
            Create teams and manage which workspace members belong to each team.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreatingTeam((v) => !v)}
          className="flex h-8 shrink-0 items-center gap-1.5 rounded-[var(--radius)] bg-[var(--accent)] px-3 text-[12px] font-medium text-[var(--text)] hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
          <span>New team</span>
        </button>
      </div>

      {/* Inline Create Team Form */}
      {isCreatingTeam && (
        <form
          onSubmit={handleCreateTeam}
          className="rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4 space-y-3"
        >
          <div className="text-[13px] font-medium text-[var(--text)]">
            Create a new team
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px]">
            <div>
              <label className="mb-1 block text-[11px] text-[var(--text-3)]">
                Team name
              </label>
              <input
                type="text"
                autoFocus
                value={newTeamName}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewTeamName(val);
                  setNewTeamKey(
                    val
                      .replace(/[^a-zA-Z0-9]/g, "")
                      .slice(0, 3)
                      .toUpperCase()
                  );
                }}
                placeholder="Design"
                className="h-8 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-2.5 text-[13px] text-[var(--text)] placeholder:text-[var(--text-4)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-[var(--text-3)]">
                Identifier
              </label>
              <input
                type="text"
                value={newTeamKey}
                maxLength={10}
                onChange={(e) =>
                  setNewTeamKey(
                    e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
                  )
                }
                placeholder="DES"
                className="h-8 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-2.5 text-[13px] font-mono text-[var(--text)] placeholder:text-[var(--text-4)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreatingTeam(false)}
              className="h-7 rounded-[var(--radius)] border border-[var(--border)] px-3 text-[12px] text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                !newTeamName.trim() ||
                newTeamKey.trim().length < 2 ||
                createTeam.isPending
              }
              className="flex h-7 items-center gap-1.5 rounded-[var(--radius)] bg-[var(--accent)] px-3 text-[12px] font-medium text-[var(--text)] hover:bg-[var(--accent-hover)] disabled:opacity-50 cursor-pointer"
            >
              {createTeam.isPending && (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
              <span>Create team</span>
            </button>
          </div>
        </form>
      )}

      {/* Workspace Teams Selector */}
      <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--text)]">
            <Users2 className="h-4 w-4 text-[var(--text-3)]" strokeWidth={1.5} />
            <span>Workspace Teams ({teams.length})</span>
          </div>
          <span className="text-[11px] text-[var(--text-4)]">
            Select a team to manage its members
          </span>
        </div>

        {teamsLoading ? (
          <div className="flex justify-center py-6 text-[var(--text-4)]">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : teams.length === 0 ? (
          <div className="rounded-[var(--radius)] border border-dashed border-[var(--border)] py-6 text-center text-[12px] text-[var(--text-4)]">
            No teams yet. Create your first team above.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
            {teams.map((team) => {
              const isSelected = selectedTeam?.id === team.id;
              const count =
                isSelected && !teamMembersLoading
                  ? teamMembers.length
                  : (team.memberCount ?? 0);

              return (
                <div
                  key={team.id}
                  onClick={() => setSelectedTeamId(team.id)}
                  className={`flex items-center justify-between gap-3 px-2 py-2.5 transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[rgba(255,255,255,0.04)]"
                      : "hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-6 min-w-10 items-center justify-center rounded border border-[var(--border)] bg-[var(--bg-elev)] px-1.5 font-mono text-[10px] font-semibold text-[var(--text-2)]">
                      {team.key}
                    </span>
                    <span className="truncate text-[13px] font-medium text-[var(--text)]">
                      {team.name}
                    </span>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-[var(--text-4)]">
                      {count} {count === 1 ? "member" : "members"}
                    </span>
                    <Link
                      href={`/team/${team.key}/issues`}
                      onClick={(e) => e.stopPropagation()}
                      title={`Open ${team.name} issues`}
                      className="flex items-center gap-1 rounded border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--text-3)] hover:bg-[var(--bg-elev)] hover:text-[var(--text)]"
                    >
                      <span>Issues</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Selected Team Members Management */}
      {selectedTeam && (
        <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] p-5 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[14px] font-medium text-[var(--text)]">
                {selectedTeam.name} Members ({teamMembers.length})
              </h2>
              <p className="mt-0.5 text-[12px] text-[var(--text-3)]">
                Add workspace members to{" "}
                <span className="font-mono text-[var(--text-2)]">
                  {selectedTeam.key}
                </span>{" "}
                or update their team role.
              </p>
            </div>
          </div>

          {/* Add Member Form */}
          {wsMembersLoading ? (
            <div className="flex items-center gap-2 text-[12px] text-[var(--text-4)]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Loading workspace members...</span>
            </div>
          ) : availableWorkspaceMembers.length > 0 ? (
            <form onSubmit={handleAddMember} className="flex flex-wrap gap-2">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                aria-label="Select workspace member"
                className="h-8 flex-1 min-w-[200px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-2.5 text-[12px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
              >
                {availableWorkspaceMembers.map((wm) => (
                  <option key={wm.id} value={wm.id}>
                    {wm.name} ({wm.email})
                  </option>
                ))}
              </select>

              <select
                value={selectedRole}
                onChange={(e) =>
                  setSelectedRole(e.target.value as TeamMemberRole)
                }
                aria-label="Select team role"
                className="h-8 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-2.5 text-[12px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="MEMBER">Member</option>
                <option value="LEAD">Lead</option>
              </select>

              <button
                type="submit"
                disabled={!selectedUserId || addTeamMember.isPending}
                className="flex h-8 items-center gap-1.5 rounded-[var(--radius)] bg-[var(--accent)] px-3 text-[12px] font-medium text-[var(--text)] hover:bg-[var(--accent-hover)] disabled:opacity-50 cursor-pointer"
              >
                {addTeamMember.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <UserPlus className="h-3.5 w-3.5" strokeWidth={1.5} />
                )}
                <span>Add member</span>
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[12px] text-[var(--text-3)]">
              <span>
                All workspace members are already in {selectedTeam.name}.
              </span>
              <button
                type="button"
                onClick={onNavigateToWorkspaceMembers}
                className="shrink-0 font-medium text-[var(--accent)] hover:underline cursor-pointer"
              >
                Invite to workspace
              </button>
            </div>
          )}

          {/* Current Team Members List */}
          <div className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
            {teamMembersLoading ? (
              <div className="flex justify-center py-6 text-[var(--text-4)]">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2.5 py-6 text-center">
                <p className="text-[12px] text-[var(--text-4)]">
                  No members assigned to {selectedTeam.name} yet.
                </p>
                {currentUserId &&
                  workspaceMembers.some((m) => m.id === currentUserId) && (
                    <button
                      type="button"
                      disabled={addTeamMember.isPending}
                      onClick={handleJoinCurrentUser}
                      className="flex h-7 items-center gap-1.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-3 text-[12px] text-[var(--text-2)] hover:text-[var(--text)] disabled:opacity-50 cursor-pointer"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Add yourself as Lead</span>
                    </button>
                  )}
              </div>
            ) : (
              teamMembers.map((member) => {
                const isSelf = member.userId === currentUserId;
                const isUpdating = pendingUserId === member.userId;

                return (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f59e0b] text-[11px] font-medium text-[#08090a]">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 truncate text-[13px] font-medium text-[var(--text)]">
                          <span className="truncate">{member.name}</span>
                          {isSelf && (
                            <span className="rounded bg-[var(--bg-elev)] px-1.5 py-0.5 text-[10px] font-normal text-[var(--text-4)]">
                              You
                            </span>
                          )}
                        </div>
                        <div className="truncate text-[11px] text-[var(--text-4)]">
                          {member.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={member.role}
                        disabled={isUpdating}
                        onChange={(e) =>
                          handleRoleChange(
                            member.userId,
                            e.target.value as TeamMemberRole
                          )
                        }
                        aria-label={`Role for ${member.name}`}
                        className="h-7 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-2 text-[11px] text-[var(--text-2)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-50 cursor-pointer"
                      >
                        <option value="LEAD">Lead</option>
                        <option value="MEMBER">Member</option>
                      </select>

                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleRemoveMember(member.userId)}
                        title={`Remove ${member.name} from ${selectedTeam.name}`}
                        className="flex h-7 w-7 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] text-[var(--text-4)] hover:border-[var(--danger)]/40 hover:bg-[rgba(235,87,87,0.1)] hover:text-[var(--danger)] disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {isUpdating ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}
    </>
  );
}
