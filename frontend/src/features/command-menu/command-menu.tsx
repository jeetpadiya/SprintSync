"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi } from "@/features/auth/api/auth-api";
import {
  useDeleteIssue,
  useIssues,
  useTeams,
  useUpdateIssue,
  useWorkspaceMembers,
} from "@/features/issues/hooks/use-issues";
import { useProjects } from "@/features/projects/hooks/use-projects";
import { useDocuments } from "@/features/documents/hooks/use-documents";
import { useAuthStore } from "@/store/useAuthStore";
import { useModalStore } from "@/store/useModalStore";
import { useUIStore } from "@/store/useUIStore";
import { IssuePriority, IssueStatus } from "@/types/issue.types";
import {
  IssueStatusIcon,
  STATUS_LABELS,
} from "@/components/ui/issue-status-icon";
import {
  IssuePriorityIcon,
  PRIORITY_LABELS,
} from "@/components/ui/issue-priority-icon";
import {
  ArrowLeft,
  CircleDot,
  Columns3,
  FileText,
  FolderKanban,
  GitPullRequest,
  Inbox,
  Layers,
  List as ListIcon,
  LogOut,
  Plus,
  Repeat,
  Search,
  Settings,
  Sparkles,
  Trash2,
  UserCircle2,
  Users2,
} from "lucide-react";

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

export function CommandMenu() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clearAuth, isAuthenticated } = useAuthStore();
  const {
    isCommandMenuOpen,
    commandMenuPage,
    closeCommandMenu,
    setCommandMenuPage,
    openCreateIssue,
  } = useModalStore();

  const {
    activeIssueId,
    onSelectActiveIssue,
    setIssueViewMode,
  } = useUIStore();

  const [search, setSearch] = useState("");

  const { data: issues = [] } = useIssues(
    undefined,
    isCommandMenuOpen && isAuthenticated
  );
  const { data: teams = [] } = useTeams(
    undefined,
    isCommandMenuOpen && isAuthenticated
  );
  const { data: projects = [] } = useProjects(
    undefined,
    isCommandMenuOpen && isAuthenticated
  );
  const { data: documents = [] } = useDocuments(
    undefined,
    isCommandMenuOpen && isAuthenticated
  );
  const { data: members = [] } = useWorkspaceMembers(
    undefined,
    isCommandMenuOpen && isAuthenticated
  );

  const updateIssue = useUpdateIssue();
  const deleteIssue = useDeleteIssue();

  const activeIssue = activeIssueId
    ? issues.find((i) => i.id === activeIssueId) ?? null
    : null;

  useEffect(() => {
    if (!isCommandMenuOpen) {
      setSearch("");
    }
  }, [isCommandMenuOpen]);

  if (!isCommandMenuOpen) return null;

  const navigate = (href: string) => {
    closeCommandMenu();
    router.push(href);
  };

  const handleLogout = async () => {
    closeCommandMenu();
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      queryClient.clear();
      clearAuth();
      toast.success("Logged out");
      router.replace("/login");
    }
  };

  const placeholderText =
    commandMenuPage === "status"
      ? `Set status for ${activeIssue?.identifier ?? "issue"}...`
      : commandMenuPage === "priority"
        ? `Set priority for ${activeIssue?.identifier ?? "issue"}...`
        : commandMenuPage === "assignee"
          ? `Assign ${activeIssue?.identifier ?? "issue"} to...`
          : "Type a command or search issues, projects, docs...";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-24"
      onClick={closeCommandMenu}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[600px] overflow-hidden rounded-[10px] border border-[var(--border-strong)] bg-[var(--bg-panel)] shadow-[0_24px_64px_rgba(0,0,0,0.75)]"
      >
        <Command
          label="SprintSync Command Menu"
          className="flex flex-col text-[var(--text)]"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              if (commandMenuPage !== "root") {
                setCommandMenuPage("root");
                setSearch("");
              } else {
                closeCommandMenu();
              }
            } else if (
              e.key === "Backspace" &&
              !search &&
              commandMenuPage !== "root"
            ) {
              setCommandMenuPage("root");
            }
          }}
        >
          {/* Context Badge on Sub-pages */}
          {commandMenuPage !== "root" && activeIssue && (
            <div className="flex items-center gap-2 border-b border-[var(--border)] px-3.5 py-2 text-[11px] text-[var(--text-3)]">
              <button
                type="button"
                onClick={() => {
                  setCommandMenuPage("root");
                  setSearch("");
                }}
                className="flex items-center gap-1 rounded bg-[var(--bg-elev)] border border-[var(--border)] px-1.5 py-0.5 hover:text-[var(--text)] cursor-pointer"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Back</span>
              </button>
              <span className="font-medium text-[var(--text-2)]">
                {activeIssue.identifier}
              </span>
              <span className="truncate text-[var(--text-4)]">
                {activeIssue.title}
              </span>
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-3.5">
            <Search className="h-4 w-4 shrink-0 text-[var(--text-4)]" strokeWidth={1.5} />
            <Command.Input
              autoFocus
              value={search}
              onValueChange={setSearch}
              placeholder={placeholderText}
              className="h-11 w-full bg-transparent text-[13px] text-[var(--text)] placeholder:text-[var(--text-4)] focus:outline-none"
            />
            <kbd className="rounded border border-[var(--border)] bg-[var(--bg-elev)] px-1.5 py-0.5 text-[10px] text-[var(--text-4)]">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[380px] overflow-y-auto p-1.5">
            <Command.Empty className="py-8 text-center text-[12px] text-[var(--text-4)]">
              No matching results.
            </Command.Empty>

            {/* SUB-PAGE: STATUS PICKER */}
            {commandMenuPage === "status" && activeIssue && (
              <Command.Group
                heading="Change status"
                className="px-1.5 py-1 text-[11px] font-medium text-[var(--text-4)]"
              >
                {STATUS_OPTIONS.map((st) => (
                  <CommandItem
                    key={st}
                    value={`${STATUS_LABELS[st]} ${st}`}
                    onSelect={() => {
                      updateIssue.mutate({
                        id: activeIssue.id,
                        data: { status: st },
                      });
                      toast.success(`${activeIssue.identifier} → ${STATUS_LABELS[st]}`);
                      closeCommandMenu();
                    }}
                  >
                    <IssueStatusIcon status={st} className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1">{STATUS_LABELS[st]}</span>
                    {activeIssue.status === st && (
                      <span className="text-[10px] text-[var(--accent)]">Current</span>
                    )}
                  </CommandItem>
                ))}
              </Command.Group>
            )}

            {/* SUB-PAGE: PRIORITY PICKER */}
            {commandMenuPage === "priority" && activeIssue && (
              <Command.Group
                heading="Set priority"
                className="px-1.5 py-1 text-[11px] font-medium text-[var(--text-4)]"
              >
                {PRIORITY_OPTIONS.map((pr) => (
                  <CommandItem
                    key={pr}
                    value={`${PRIORITY_LABELS[pr]} ${pr}`}
                    onSelect={() => {
                      updateIssue.mutate({
                        id: activeIssue.id,
                        data: { priority: pr },
                      });
                      toast.success(`${activeIssue.identifier} → ${PRIORITY_LABELS[pr]}`);
                      closeCommandMenu();
                    }}
                  >
                    <IssuePriorityIcon priority={pr} className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1">{PRIORITY_LABELS[pr]}</span>
                    {activeIssue.priority === pr && (
                      <span className="text-[10px] text-[var(--accent)]">Current</span>
                    )}
                  </CommandItem>
                ))}
              </Command.Group>
            )}

            {/* SUB-PAGE: ASSIGNEE PICKER */}
            {commandMenuPage === "assignee" && activeIssue && (
              <Command.Group
                heading="Assign to"
                className="px-1.5 py-1 text-[11px] font-medium text-[var(--text-4)]"
              >
                <CommandItem
                  value="No assignee unassign"
                  onSelect={() => {
                    updateIssue.mutate({
                      id: activeIssue.id,
                      data: { assigneeId: null },
                    });
                    toast.success(`${activeIssue.identifier} unassigned`);
                    closeCommandMenu();
                  }}
                >
                  <UserCircle2 className="h-3.5 w-3.5 shrink-0 text-[var(--text-4)]" />
                  <span className="flex-1">No assignee</span>
                </CommandItem>
                {members.map((m) => (
                  <CommandItem
                    key={m.id}
                    value={`${m.name} ${m.email}`}
                    onSelect={() => {
                      updateIssue.mutate({
                        id: activeIssue.id,
                        data: { assigneeId: m.id },
                      });
                      toast.success(`${activeIssue.identifier} assigned to ${m.name}`);
                      closeCommandMenu();
                    }}
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#f59e0b] text-[9px] font-semibold text-[#08090a]">
                      {m.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="flex-1 truncate">{m.name}</span>
                    {activeIssue.assigneeId === m.id && (
                      <span className="text-[10px] text-[var(--accent)]">Assigned</span>
                    )}
                  </CommandItem>
                ))}
              </Command.Group>
            )}

            {/* ROOT PAGE */}
            {commandMenuPage === "root" && (
              <>
                {activeIssue && (
                  <Command.Group
                    heading={`Selected Issue · ${activeIssue.identifier}`}
                    className="px-1.5 py-1 text-[11px] font-medium text-[var(--text-4)]"
                  >
                    <CommandItem
                      value={`Change status ${activeIssue.identifier}`}
                      shortcut="S"
                      onSelect={() => {
                        setCommandMenuPage("status");
                        setSearch("");
                      }}
                    >
                      <IssueStatusIcon
                        status={activeIssue.status}
                        className="h-3.5 w-3.5 shrink-0"
                      />
                      <span className="flex-1">Change status...</span>
                    </CommandItem>
                    <CommandItem
                      value={`Set priority ${activeIssue.identifier}`}
                      shortcut="P"
                      onSelect={() => {
                        setCommandMenuPage("priority");
                        setSearch("");
                      }}
                    >
                      <IssuePriorityIcon
                        priority={activeIssue.priority}
                        className="h-3.5 w-3.5 shrink-0"
                      />
                      <span className="flex-1">Set priority...</span>
                    </CommandItem>
                    <CommandItem
                      value={`Assign to ${activeIssue.identifier}`}
                      shortcut="A"
                      onSelect={() => {
                        setCommandMenuPage("assignee");
                        setSearch("");
                      }}
                    >
                      <UserCircle2 className="h-3.5 w-3.5 shrink-0 text-[var(--text-3)]" />
                      <span className="flex-1">Assign to...</span>
                    </CommandItem>
                    <CommandItem
                      value={`Delete issue ${activeIssue.identifier}`}
                      shortcut="⌫"
                      onSelect={() => {
                        deleteIssue.mutate(activeIssue.id, {
                          onSuccess: () => onSelectActiveIssue?.(null),
                        });
                        closeCommandMenu();
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 shrink-0 text-[var(--danger)]" />
                      <span className="flex-1 text-[var(--danger)]">
                        Delete issue
                      </span>
                    </CommandItem>
                  </Command.Group>
                )}

                <Command.Group
                  heading="Actions"
                  className="px-1.5 py-1 text-[11px] font-medium text-[var(--text-4)]"
                >
                  <CommandItem
                    value="Create new issue"
                    shortcut="C"
                    onSelect={() => openCreateIssue()}
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0 text-[var(--text-3)]" />
                    <span className="flex-1">Create new issue</span>
                  </CommandItem>
                  <CommandItem
                    value="Switch to Board view"
                    onSelect={() => {
                      setIssueViewMode("board");
                      closeCommandMenu();
                      toast.success("Switched to Board view");
                    }}
                  >
                    <Columns3 className="h-3.5 w-3.5 shrink-0 text-[var(--text-3)]" />
                    <span className="flex-1">Switch to Board view</span>
                  </CommandItem>
                  <CommandItem
                    value="Switch to List view"
                    onSelect={() => {
                      setIssueViewMode("list");
                      closeCommandMenu();
                      toast.success("Switched to List view");
                    }}
                  >
                    <ListIcon className="h-3.5 w-3.5 shrink-0 text-[var(--text-3)]" />
                    <span className="flex-1">Switch to List view</span>
                  </CommandItem>
                  <CommandItem
                    value="Log out sign out"
                    shortcut="Alt ⇧ Q"
                    onSelect={handleLogout}
                  >
                    <LogOut className="h-3.5 w-3.5 shrink-0 text-[var(--text-3)]" />
                    <span className="flex-1">Log out</span>
                  </CommandItem>
                </Command.Group>

                <Command.Group
                  heading="Navigation"
                  className="px-1.5 py-1 text-[11px] font-medium text-[var(--text-4)]"
                >
                  <CommandItem
                    value="Go to Inbox"
                    onSelect={() => navigate("/")}
                  >
                    <Inbox className="h-3.5 w-3.5 shrink-0 text-[var(--text-3)]" />
                    <span className="flex-1">Go to Inbox</span>
                  </CommandItem>
                  <CommandItem
                    value="Go to My Issues"
                    onSelect={() => navigate("/my-issues")}
                  >
                    <CircleDot className="h-3.5 w-3.5 shrink-0 text-[var(--text-3)]" />
                    <span className="flex-1">Go to My Issues</span>
                  </CommandItem>
                  <CommandItem
                    value="Go to Projects"
                    onSelect={() => navigate("/projects")}
                  >
                    <FolderKanban className="h-3.5 w-3.5 shrink-0 text-[var(--text-3)]" />
                    <span className="flex-1">Go to Projects</span>
                  </CommandItem>
                  <CommandItem
                    value="Go to Cycles Sprints"
                    onSelect={() => navigate("/cycles")}
                  >
                    <Repeat className="h-3.5 w-3.5 shrink-0 text-[var(--text-3)]" />
                    <span className="flex-1">Go to Cycles</span>
                  </CommandItem>
                  <CommandItem
                    value="Go to Views"
                    onSelect={() => navigate("/views")}
                  >
                    <Layers className="h-3.5 w-3.5 shrink-0 text-[var(--text-3)]" />
                    <span className="flex-1">Go to Views</span>
                  </CommandItem>
                  <CommandItem
                    value="Go to Documents"
                    onSelect={() => navigate("/documents")}
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0 text-[var(--text-3)]" />
                    <span className="flex-1">Go to Documents</span>
                  </CommandItem>
                  <CommandItem
                    value="Go to Reviews"
                    onSelect={() => navigate("/reviews")}
                  >
                    <GitPullRequest className="h-3.5 w-3.5 shrink-0 text-[var(--text-3)]" />
                    <span className="flex-1">Go to Reviews</span>
                  </CommandItem>
                  <CommandItem
                    value="Go to Agent"
                    onSelect={() => navigate("/agent")}
                  >
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-[var(--text-3)]" />
                    <span className="flex-1">Go to Agent</span>
                  </CommandItem>
                  <CommandItem
                    value="Go to Settings"
                    shortcut="G then S"
                    onSelect={() => navigate("/settings")}
                  >
                    <Settings className="h-3.5 w-3.5 shrink-0 text-[var(--text-3)]" />
                    <span className="flex-1">Go to Settings</span>
                  </CommandItem>

                  {teams.map((team) => (
                    <CommandItem
                      key={team.id}
                      value={`Go to ${team.name} ${team.key} issues backlog`}
                      onSelect={() => navigate(`/team/${team.key}/issues`)}
                    >
                      <Users2 className="h-3.5 w-3.5 shrink-0 text-[var(--text-3)]" />
                      <span className="flex-1">
                        Go to {team.name} ({team.key})
                      </span>
                    </CommandItem>
                  ))}
                </Command.Group>

                {issues.length > 0 && (
                  <Command.Group
                    heading="Issues"
                    className="px-1.5 py-1 text-[11px] font-medium text-[var(--text-4)]"
                  >
                    {issues.slice(0, 20).map((issue) => (
                      <CommandItem
                        key={issue.id}
                        value={`${issue.identifier} ${issue.title}`}
                        onSelect={() => {
                          if (onSelectActiveIssue && issue.id) {
                            onSelectActiveIssue(issue.id);
                          }
                          if (issue.team?.key) {
                            navigate(`/team/${issue.team.key}/issues?issue=${issue.id}`);
                          } else {
                            navigate("/my-issues");
                          }
                        }}
                      >
                        <IssueStatusIcon
                          status={issue.status}
                          className="h-3.5 w-3.5 shrink-0"
                        />
                        <span className="w-16 shrink-0 font-mono text-[11px] text-[var(--text-4)]">
                          {issue.identifier}
                        </span>
                        <span className="flex-1 truncate">{issue.title}</span>
                      </CommandItem>
                    ))}
                  </Command.Group>
                )}

                {projects.length > 0 && (
                  <Command.Group
                    heading="Projects"
                    className="px-1.5 py-1 text-[11px] font-medium text-[var(--text-4)]"
                  >
                    {projects.map((proj) => (
                      <CommandItem
                        key={proj.id}
                        value={`Project ${proj.name} ${proj.summary ?? ""}`}
                        onSelect={() => navigate(`/projects/${proj.id}`)}
                      >
                        <FolderKanban className="h-3.5 w-3.5 shrink-0 text-[var(--text-3)]" />
                        <span className="flex-1 truncate">{proj.name}</span>
                        <span className="text-[11px] text-[var(--text-4)]">
                          {proj.progress.progressPercentage}%
                        </span>
                      </CommandItem>
                    ))}
                  </Command.Group>
                )}

                {documents.length > 0 && (
                  <Command.Group
                    heading="Documents"
                    className="px-1.5 py-1 text-[11px] font-medium text-[var(--text-4)]"
                  >
                    {documents.slice(0, 10).map((doc) => (
                      <CommandItem
                        key={doc.id}
                        value={`Document ${doc.title}`}
                        onSelect={() => navigate("/documents")}
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0 text-[var(--text-3)]" />
                        <span className="flex-1 truncate">{doc.title}</span>
                      </CommandItem>
                    ))}
                  </Command.Group>
                )}
              </>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

function CommandItem({
  children,
  value,
  shortcut,
  onSelect,
}: {
  children: React.ReactNode;
  value: string;
  shortcut?: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="flex h-8 items-center gap-2.5 rounded-[6px] px-2.5 text-[13px] font-normal text-[var(--text-2)] cursor-pointer aria-selected:bg-[rgba(255,255,255,0.08)] aria-selected:text-[var(--text)]"
    >
      {children}
      {shortcut && (
        <kbd className="ml-auto rounded border border-[var(--border)] bg-[var(--bg-elev)] px-1.5 py-0.5 text-[10px] text-[var(--text-4)]">
          {shortcut}
        </kbd>
      )}
    </Command.Item>
  );
}
