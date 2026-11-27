"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useModalStore } from "@/store/useModalStore";
import {
  useCreateIssue,
  useLabels,
  useTeams,
  useWorkspaceMembers,
} from "../hooks/use-issues";
import {
  IssuePriority,
  IssueStatus,
  Team,
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
  X,
  Loader2,
  ChevronDown,
  Tag,
  Hash,
  UserCircle2,
  MoreHorizontal,
  Maximize2,
  Minimize2,
  Check,
} from "lucide-react";

interface CreateIssueModalProps {
  onIssueCreated?: () => void;
}

type ActivePicker =
  | "team"
  | "status"
  | "priority"
  | "assignee"
  | "labels"
  | "more"
  | null;

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

export function CreateIssueModal({ onIssueCreated }: CreateIssueModalProps) {
  const {
    isCreateIssueOpen,
    closeCreateIssue,
    defaultStatus,
    defaultAssigneeId,
    defaultTeamId,
    defaultProjectId,
    defaultCycleId,
    defaultParentId,
    defaultParentIdentifier,
  } = useModalStore();

  const { data: teams = [] } = useTeams(undefined, isCreateIssueOpen);
  const { data: labels = [] } = useLabels(undefined, isCreateIssueOpen);
  const { data: members = [] } = useWorkspaceMembers(
    undefined,
    isCreateIssueOpen
  );
  const createIssue = useCreateIssue();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<IssueStatus>("BACKLOG");
  const [priority, setPriority] = useState<IssuePriority>("NO_PRIORITY");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState<string>("");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [createMore, setCreateMore] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (teams.length > 0) {
      if (defaultTeamId) {
        const matched = teams.find((t) => t.id === defaultTeamId);
        if (matched) {
          setSelectedTeam(matched);
          return;
        }
      }
      if (!selectedTeam) {
        setSelectedTeam(teams[0]!);
      }
    }
  }, [teams, selectedTeam, defaultTeamId]);

  useEffect(() => {
    if (isCreateIssueOpen) {
      setStatus(defaultStatus ?? "BACKLOG");
      setAssigneeId(
        defaultAssigneeId !== undefined ? defaultAssigneeId : null
      );
      setActivePicker(null);

      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 40);
      return () => clearTimeout(timer);
    } else {
      setTitle("");
      setDescription("");
      setStatus("BACKLOG");
      setPriority("NO_PRIORITY");
      setAssigneeId(null);
      setEstimate(null);
      setDueDate("");
      setSelectedLabels([]);
      setActivePicker(null);
      setIsExpanded(false);
    }
  }, [isCreateIssueOpen, defaultStatus, defaultAssigneeId]);

  useEffect(() => {
    if (!activePicker) return;
    const handleOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setActivePicker(null);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [activePicker]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      if (activePicker) {
        e.stopPropagation();
        setActivePicker(null);
      } else {
        closeCreateIssue();
      }
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Please enter an issue title");
      titleInputRef.current?.focus();
      return;
    }

    const team = selectedTeam || teams[0];
    if (!team) {
      toast.error("No team available in this workspace");
      return;
    }

    try {
      const res = await createIssue.mutateAsync({
        teamId: team.id,
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        assigneeId,
        estimate,
        projectId: defaultProjectId ?? undefined,
        cycleId: defaultCycleId ?? undefined,
        parentId: defaultParentId ?? undefined,
        dueDate: dueDate ? new Date(`${dueDate}T00:00:00.000Z`).toISOString() : undefined,
        labelIds: selectedLabels.length > 0 ? selectedLabels : undefined,
      });

      toast.success("Issue created", {
        description: `${res.issue.identifier}: ${res.issue.title}`,
      });

      onIssueCreated?.();

      if (createMore) {
        setTitle("");
        setDescription("");
        setActivePicker(null);
        setTimeout(() => titleInputRef.current?.focus(), 30);
      } else {
        closeCreateIssue();
      }
    } catch {
      // Handled by useCreateIssue toast
    }
  };

  if (!isCreateIssueOpen) return null;

  const activeTeam = selectedTeam || teams[0] || null;
  const selectedAssignee = members.find((m) => m.id === assigneeId) ?? null;

  const togglePicker = (picker: ActivePicker) => {
    setActivePicker((prev) => (prev === picker ? null : picker));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-20"
      onClick={closeCreateIssue}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={modalRef}
        className={`relative w-full rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--bg-panel)] text-[var(--text)] shadow-2xl transition-all duration-150 ${
          isExpanded ? "max-w-[780px]" : "max-w-[640px]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex h-10 items-center justify-between px-4 pt-1">
          <div className="flex items-center gap-2">
            {/* Team Selector Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => togglePicker("team")}
                className="flex h-6 items-center gap-1.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-2 text-[11px] font-medium text-[var(--text-2)] hover:border-[var(--border-strong)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                <span className="h-2 w-2 rounded-[2px] bg-[var(--success)]" />
                <span>{activeTeam ? activeTeam.key : "ENG"}</span>
                {teams.length > 1 && (
                  <ChevronDown className="h-3 w-3 text-[var(--text-4)]" />
                )}
              </button>

              {activePicker === "team" && teams.length > 0 && (
                <div className="absolute left-0 top-full mt-1 z-50 w-44 rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--bg-panel)] p-1 shadow-xl">
                  {teams.map((team) => (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => {
                        setSelectedTeam(team);
                        setActivePicker(null);
                      }}
                      className={`flex h-7 w-full items-center justify-between rounded px-2 text-[12px] transition-colors cursor-pointer ${
                        activeTeam?.id === team.id
                          ? "bg-[rgba(255,255,255,0.06)] text-[var(--text)] font-medium"
                          : "text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
                      }`}
                    >
                      <span className="truncate">
                        {team.key} · {team.name}
                      </span>
                      {activeTeam?.id === team.id && (
                        <Check className="h-3 w-3 text-[var(--accent)]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="text-[12px] text-[var(--text-4)]">&rsaquo;</span>
            {defaultParentIdentifier ? (
              <>
                <span className="text-[12px] font-medium text-[var(--text-3)]">
                  {defaultParentIdentifier}
                </span>
                <span className="text-[12px] text-[var(--text-4)]">&rsaquo;</span>
                <span className="text-[12px] font-medium text-[var(--text-2)]">
                  New sub-issue
                </span>
              </>
            ) : (
              <span className="text-[12px] font-medium text-[var(--text-2)]">
                New issue
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              title={isExpanded ? "Collapse" : "Expand"}
              onClick={() => setIsExpanded((v) => !v)}
              className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-4)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)] transition-colors cursor-pointer"
            >
              {isExpanded ? (
                <Minimize2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              )}
            </button>
            <button
              type="button"
              title="Close (Esc)"
              onClick={closeCreateIssue}
              className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-4)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)] transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Title & Description */}
        <div
          className="px-4 pt-2 pb-3 space-y-2"
          onClick={() => {
            if (activePicker) setActivePicker(null);
          }}
        >
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Issue title"
            disabled={createIssue.isPending}
            className="w-full bg-transparent text-[16px] font-medium text-[var(--text)] placeholder:text-[var(--text-4)] focus:outline-none"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add description..."
            rows={isExpanded ? 7 : 3}
            disabled={createIssue.isPending}
            className="w-full bg-transparent text-[13px] text-[var(--text-2)] placeholder:text-[var(--text-4)] focus:outline-none resize-none leading-relaxed"
          />
        </div>

        {/* 4 Core Linear Property Pills (+ Overflow for Estimate) */}
        <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3">
          {/* 1. Status (defaults to Backlog) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => togglePicker("status")}
              className="flex h-7 items-center gap-1.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-2.5 text-[12px] text-[var(--text-2)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-strong)] transition-colors cursor-pointer"
            >
              <IssueStatusIcon status={status} className="h-3.5 w-3.5" />
              <span>{STATUS_LABELS[status]}</span>
            </button>

            {activePicker === "status" && (
              <div className="absolute left-0 top-full mt-1 z-50 w-40 rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--bg-panel)] p-1 shadow-xl">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setStatus(opt);
                      setActivePicker(null);
                    }}
                    className={`flex h-7 w-full items-center justify-between rounded px-2 text-[12px] transition-colors cursor-pointer ${
                      status === opt
                        ? "bg-[rgba(255,255,255,0.06)] text-[var(--text)] font-medium"
                        : "text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <IssueStatusIcon status={opt} className="h-3.5 w-3.5" />
                      <span>{STATUS_LABELS[opt]}</span>
                    </span>
                    {status === opt && (
                      <Check className="h-3 w-3 text-[var(--accent)]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Priority */}
          <div className="relative">
            <button
              type="button"
              onClick={() => togglePicker("priority")}
              className="flex h-7 items-center gap-1.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-2.5 text-[12px] text-[var(--text-2)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-strong)] transition-colors cursor-pointer"
            >
              <IssuePriorityIcon priority={priority} className="h-3.5 w-3.5" />
              <span>
                {priority === "NO_PRIORITY" ? "Priority" : PRIORITY_LABELS[priority]}
              </span>
            </button>

            {activePicker === "priority" && (
              <div className="absolute left-0 top-full mt-1 z-50 w-40 rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--bg-panel)] p-1 shadow-xl">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setPriority(opt);
                      setActivePicker(null);
                    }}
                    className={`flex h-7 w-full items-center justify-between rounded px-2 text-[12px] transition-colors cursor-pointer ${
                      priority === opt
                        ? "bg-[rgba(255,255,255,0.06)] text-[var(--text)] font-medium"
                        : "text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <IssuePriorityIcon priority={opt} className="h-3.5 w-3.5" />
                      <span>{PRIORITY_LABELS[opt]}</span>
                    </span>
                    {priority === opt && (
                      <Check className="h-3 w-3 text-[var(--accent)]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. Assign to */}
          <div className="relative">
            <button
              type="button"
              onClick={() => togglePicker("assignee")}
              className="flex h-7 items-center gap-1.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-2.5 text-[12px] text-[var(--text-2)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-strong)] transition-colors cursor-pointer"
            >
              {selectedAssignee ? (
                <>
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#f59e0b] text-[10px] font-medium text-[#08090a]">
                    {selectedAssignee.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-[120px] truncate">
                    {selectedAssignee.name}
                  </span>
                </>
              ) : (
                <>
                  <UserCircle2 className="h-3.5 w-3.5 text-[var(--text-4)]" strokeWidth={1.5} />
                  <span className="text-[var(--text-3)]">Assignee</span>
                </>
              )}
            </button>

            {activePicker === "assignee" && (
              <div className="absolute left-0 top-full mt-1 z-50 w-52 rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--bg-panel)] p-1 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setAssigneeId(null);
                    setActivePicker(null);
                  }}
                  className={`flex h-7 w-full items-center justify-between rounded px-2 text-[12px] transition-colors cursor-pointer ${
                    assigneeId === null
                      ? "bg-[rgba(255,255,255,0.06)] text-[var(--text)] font-medium"
                      : "text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <UserCircle2 className="h-3.5 w-3.5 text-[var(--text-4)]" strokeWidth={1.5} />
                    <span>No assignee</span>
                  </span>
                  {assigneeId === null && (
                    <Check className="h-3 w-3 text-[var(--accent)]" />
                  )}
                </button>

                {members.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      setAssigneeId(member.id);
                      setActivePicker(null);
                    }}
                    className={`flex h-7 w-full items-center justify-between rounded px-2 text-[12px] transition-colors cursor-pointer ${
                      assigneeId === member.id
                        ? "bg-[rgba(255,255,255,0.06)] text-[var(--text)] font-medium"
                        : "text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#f59e0b] text-[10px] font-medium text-[#08090a]">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="truncate">{member.name}</span>
                    </span>
                    {assigneeId === member.id && (
                      <Check className="h-3 w-3 shrink-0 text-[var(--accent)]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 4. Labels */}
          <div className="relative">
            <button
              type="button"
              onClick={() => togglePicker("labels")}
              className="flex h-7 items-center gap-1.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-2.5 text-[12px] text-[var(--text-2)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-strong)] transition-colors cursor-pointer"
            >
              <Tag className="h-3 w-3 text-[var(--text-4)]" strokeWidth={1.5} />
              <span>
                {selectedLabels.length > 0
                  ? `${selectedLabels.length} label${selectedLabels.length > 1 ? "s" : ""}`
                  : "Labels"}
              </span>
            </button>

            {activePicker === "labels" && (
              <div className="absolute left-0 top-full mt-1 z-50 w-44 rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--bg-panel)] p-1 shadow-xl">
                {labels.length === 0 ? (
                  <p className="px-2 py-1.5 text-[11px] text-[var(--text-4)]">
                    No labels available
                  </p>
                ) : (
                  labels.map((lbl) => {
                    const isSelected = selectedLabels.includes(lbl.id);
                    return (
                      <button
                        key={lbl.id}
                        type="button"
                        onClick={() => {
                          setSelectedLabels((prev) =>
                            isSelected
                              ? prev.filter((id) => id !== lbl.id)
                              : [...prev, lbl.id]
                          );
                        }}
                        className={`flex h-7 w-full items-center justify-between rounded px-2 text-[12px] transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-[rgba(255,255,255,0.06)] text-[var(--text)] font-medium"
                            : "text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: lbl.color }}
                          />
                          <span>{lbl.name}</span>
                        </span>
                        {isSelected && (
                          <Check className="h-3 w-3 text-[var(--accent)]" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Overflow (...) for Estimate & Due date */}
          <div className="relative">
            <button
              type="button"
              title="More properties (Estimate, Due date)"
              onClick={() => togglePicker("more")}
              className="flex h-7 items-center gap-1.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-2 text-[12px] text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-strong)] hover:text-[var(--text-2)] transition-colors cursor-pointer"
            >
              {estimate !== null || dueDate ? (
                <>
                  <Hash className="h-3 w-3 text-[var(--text-4)]" />
                  <span>
                    {[
                      estimate !== null ? `${estimate} pt` : null,
                      dueDate ? dueDate : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </>
              ) : (
                <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
              )}
            </button>

            {activePicker === "more" && (
              <div className="absolute left-0 top-full mt-1 z-50 w-44 rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--bg-panel)] p-1 shadow-xl">
                <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-[var(--text-4)]">
                  Estimate
                </div>
                {ESTIMATE_OPTIONS.map((opt) => (
                  <button
                    key={opt === null ? "none" : opt}
                    type="button"
                    onClick={() => {
                      setEstimate(opt);
                      setActivePicker(null);
                    }}
                    className={`flex h-7 w-full items-center justify-between rounded px-2 text-[12px] transition-colors cursor-pointer ${
                      estimate === opt
                        ? "bg-[rgba(255,255,255,0.06)] text-[var(--text)] font-medium"
                        : "text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
                    }`}
                  >
                    <span>{opt === null ? "No estimate" : `${opt} points`}</span>
                    {estimate === opt && (
                      <Check className="h-3 w-3 text-[var(--accent)]" />
                    )}
                  </button>
                ))}

                <div className="mt-1 border-t border-[var(--border)] px-2 pt-2 pb-1">
                  <label className="block text-[10px] font-medium uppercase tracking-wider text-[var(--text-4)] mb-1">
                    Due date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-7 w-full rounded border border-[var(--border)] bg-[var(--bg)] px-2 text-[12px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex h-12 items-center justify-between border-t border-[var(--border)] px-4">
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-4)]">
            <kbd className="rounded border border-[var(--border)] bg-[var(--bg-elev)] px-1.5 py-0.5">
              ⌘
            </kbd>
            <kbd className="rounded border border-[var(--border)] bg-[var(--bg-elev)] px-1.5 py-0.5">
              Enter
            </kbd>
            <span>to create</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Create more toggle */}
            <button
              type="button"
              role="switch"
              aria-checked={createMore}
              onClick={() => setCreateMore((v) => !v)}
              className="flex items-center gap-2 text-[12px] text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors cursor-pointer"
            >
              <span
                className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors ${
                  createMore
                    ? "bg-[var(--accent)]"
                    : "bg-[var(--bg-elev)] border border-[var(--border-strong)]"
                }`}
              >
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full bg-[var(--text)] transition-transform ${
                    createMore ? "translate-x-3.5" : "translate-x-0.5"
                  }`}
                />
              </span>
              <span>Create more</span>
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!title.trim() || createIssue.isPending}
              className={`flex h-7 items-center justify-center rounded-[var(--radius)] px-3 text-[12px] font-medium transition-colors ${
                title.trim() && !createIssue.isPending
                  ? "bg-[var(--accent)] text-[var(--text)] hover:bg-[var(--accent-hover)] cursor-pointer"
                  : "border border-[var(--border)] bg-[var(--bg-elev)] text-[var(--text-4)] cursor-not-allowed"
              }`}
            >
              {createIssue.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--text)]" />
              ) : (
                "Create issue"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
