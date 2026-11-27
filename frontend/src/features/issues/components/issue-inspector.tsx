"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useModalStore } from "@/store/useModalStore";
import {
  useAddIssueRelation,
  useDeleteIssue,
  useDeleteIssueRelation,
  useIssue,
  useIssues,
  useLabels,
  useUpdateIssue,
  useWorkspaceMembers,
} from "@/features/issues/hooks/use-issues";
import { useProjects } from "@/features/projects/hooks/use-projects";
import { useCycles } from "@/features/cycles/hooks/use-cycles";
import {
  IssuePriority,
  IssueRelationType,
  IssueStatus,
} from "@/types/issue.types";
import {
  IssueStatusIcon,
  STATUS_LABELS,
} from "@/components/ui/issue-status-icon";
import {
  PRIORITY_LABELS,
} from "@/components/ui/issue-priority-icon";
import {
  Plus,
  Trash2,
  Hash,
  Tag,
  X,
  GitBranch,
  Link2,
  Calendar,
  FolderKanban,
  Repeat,
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

const ESTIMATE_OPTIONS: (number | null)[] = [null, 1, 2, 3, 5, 8];

const RELATION_LABELS: Record<IssueRelationType, string> = {
  BLOCKS: "Blocks",
  BLOCKED_BY: "Blocked by",
  DUPLICATE: "Duplicate of",
  RELATED: "Related to",
};

const RELATION_OPTIONS: IssueRelationType[] = [
  "BLOCKS",
  "BLOCKED_BY",
  "DUPLICATE",
  "RELATED",
];

interface IssueInspectorProps {
  issueId: string;
  onSelectIssue: (id: string) => void;
  onClose?: () => void;
  onDeleted?: () => void;
  className?: string;
}

export function IssueInspector({
  issueId,
  onSelectIssue,
  onClose,
  onDeleted,
  className = "w-[400px] shrink-0 border-l border-[var(--border)] bg-[var(--bg-panel)] overflow-y-auto p-5 space-y-5",
}: IssueInspectorProps) {
  const { isAuthenticated } = useAuthStore();
  const { openCreateIssue } = useModalStore();

  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editingDesc, setEditingDesc] = useState<string | null>(null);
  const [isAddingParent, setIsAddingParent] = useState(false);
  const [isAddingRelation, setIsAddingRelation] = useState(false);
  const [relationType, setRelationType] = useState<IssueRelationType>("BLOCKS");
  const [relationTargetId, setRelationTargetId] = useState<string>("");

  const { data: issues = [] } = useIssues(undefined, isAuthenticated);
  const { data: detailIssue } = useIssue(issueId, isAuthenticated);
  const { data: members = [] } = useWorkspaceMembers(undefined, isAuthenticated);
  const { data: allLabels = [] } = useLabels(undefined, isAuthenticated);
  const { data: allProjects = [] } = useProjects(undefined, isAuthenticated);
  const { data: teamCycles = [] } = useCycles(
    undefined,
    isAuthenticated
  );

  const updateIssue = useUpdateIssue();
  const deleteIssue = useDeleteIssue();
  const addRelation = useAddIssueRelation();
  const deleteRelation = useDeleteIssueRelation();

  const fallbackIssue = issues.find((i) => i.id === issueId) ?? null;
  const selectedIssue =
    (detailIssue && detailIssue.id === issueId ? detailIssue : null) ??
    fallbackIssue;

  if (!selectedIssue) return null;

  const subIssues = selectedIssue.subIssues ?? [];
  const completedSubCount = subIssues.filter(
    (s) => s.status === "DONE" || s.status === "CANCELED"
  ).length;
  const relations = selectedIssue.relations ?? [];

  const availableParentCandidates = issues.filter(
    (i) =>
      i.id !== selectedIssue.id &&
      !subIssues.some((sub) => sub.id === i.id)
  );
  const availableRelationCandidates = issues.filter(
    (i) => i.id !== selectedIssue.id
  );

  const handleNavigate = (nextId: string) => {
    setEditingTitle(null);
    setEditingDesc(null);
    setIsAddingParent(false);
    setIsAddingRelation(false);
    setRelationTargetId("");
    onSelectIssue(nextId);
  };

  return (
    <aside className={className}>
      {/* Top Meta + Parent Breadcrumb */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {selectedIssue.parent && (
            <>
              <button
                type="button"
                onClick={() => handleNavigate(selectedIssue.parent!.id)}
                className="truncate max-w-[140px] rounded bg-[var(--bg-elev)] border border-[var(--border)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--text-3)] hover:text-[var(--text)] hover:border-[var(--border-strong)] cursor-pointer"
              >
                {selectedIssue.parent.identifier}
              </button>
              <span className="text-[12px] text-[var(--text-4)]">&rsaquo;</span>
            </>
          )}
          <span className="text-[12px] font-medium text-[var(--text-2)]">
            {selectedIssue.identifier}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            title="Delete issue"
            onClick={() => {
              deleteIssue.mutate(selectedIssue.id, {
                onSuccess: () => onDeleted?.(),
              });
            }}
            className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-4)] hover:bg-[var(--bg-hover)] hover:text-[var(--danger)] transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          {onClose && (
            <button
              type="button"
              title="Close inspector"
              onClick={onClose}
              className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-4)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)] transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {/* Editable Title */}
      <input
        type="text"
        value={editingTitle !== null ? editingTitle : selectedIssue.title}
        onChange={(e) => setEditingTitle(e.target.value)}
        onBlur={() => {
          if (
            editingTitle !== null &&
            editingTitle.trim() &&
            editingTitle.trim() !== selectedIssue.title
          ) {
            updateIssue.mutate({
              id: selectedIssue.id,
              data: { title: editingTitle.trim() },
            });
          }
          setEditingTitle(null);
        }}
        className="w-full bg-transparent text-[16px] font-medium text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] rounded px-1 -mx-1"
      />

      {/* Editable Description */}
      <textarea
        rows={4}
        value={
          editingDesc !== null ? editingDesc : selectedIssue.description ?? ""
        }
        placeholder="Add description..."
        onChange={(e) => setEditingDesc(e.target.value)}
        onBlur={() => {
          if (
            editingDesc !== null &&
            editingDesc !== (selectedIssue.description ?? "")
          ) {
            updateIssue.mutate({
              id: selectedIssue.id,
              data: { description: editingDesc.trim() || null },
            });
          }
          setEditingDesc(null);
        }}
        className="w-full bg-transparent text-[13px] text-[var(--text-2)] placeholder:text-[var(--text-4)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] rounded p-1 -m-1 resize-none leading-relaxed"
      />

      {/* Editable Properties */}
      <div className="space-y-2.5 border-t border-[var(--border)] pt-4 text-[12px]">
        <div className="flex items-center justify-between">
          <span className="text-[var(--text-4)]">Status</span>
          <select
            value={selectedIssue.status}
            onChange={(e) =>
              updateIssue.mutate({
                id: selectedIssue.id,
                data: { status: e.target.value as IssueStatus },
              })
            }
            className="h-7 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-2 text-[12px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {STATUS_LABELS[opt]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[var(--text-4)]">Priority</span>
          <select
            value={selectedIssue.priority}
            onChange={(e) =>
              updateIssue.mutate({
                id: selectedIssue.id,
                data: { priority: e.target.value as IssuePriority },
              })
            }
            className="h-7 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-2 text-[12px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {PRIORITY_LABELS[opt]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[var(--text-4)]">Assignee</span>
          <select
            value={selectedIssue.assigneeId ?? ""}
            onChange={(e) =>
              updateIssue.mutate({
                id: selectedIssue.id,
                data: {
                  assigneeId: e.target.value || null,
                },
              })
            }
            className="h-7 max-w-[185px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-2 text-[12px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
          >
            <option value="">No assignee</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[var(--text-4)]">
            <Hash className="h-3 w-3" />
            <span>Estimate</span>
          </span>
          <select
            value={selectedIssue.estimate ?? ""}
            onChange={(e) =>
              updateIssue.mutate({
                id: selectedIssue.id,
                data: {
                  estimate: e.target.value ? Number(e.target.value) : null,
                },
              })
            }
            className="h-7 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-2 text-[12px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
          >
            {ESTIMATE_OPTIONS.map((opt) => (
              <option key={opt === null ? "none" : opt} value={opt ?? ""}>
                {opt === null ? "No estimate" : `${opt} pts`}
              </option>
            ))}
          </select>
        </div>

        {/* Due Date */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[var(--text-4)]">
            <Calendar className="h-3 w-3" />
            <span>Due date</span>
          </span>
          <input
            type="date"
            value={
              selectedIssue.dueDate
                ? new Date(selectedIssue.dueDate).toISOString().slice(0, 10)
                : ""
            }
            onChange={(e) =>
              updateIssue.mutate({
                id: selectedIssue.id,
                data: {
                  dueDate: e.target.value
                    ? new Date(`${e.target.value}T00:00:00.000Z`).toISOString()
                    : null,
                },
              })
            }
            className="h-7 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-2 text-[12px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        {/* Project */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[var(--text-4)]">
            <FolderKanban className="h-3 w-3" />
            <span>Project</span>
          </span>
          <select
            value={selectedIssue.projectId ?? ""}
            onChange={(e) =>
              updateIssue.mutate({
                id: selectedIssue.id,
                data: {
                  projectId: e.target.value || null,
                },
              })
            }
            className="h-7 max-w-[185px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-2 text-[12px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
          >
            <option value="">No project</option>
            {allProjects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>
        </div>

        {/* Cycle */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[var(--text-4)]">
            <Repeat className="h-3 w-3" />
            <span>Cycle</span>
          </span>
          <select
            value={selectedIssue.cycleId ?? ""}
            onChange={(e) =>
              updateIssue.mutate({
                id: selectedIssue.id,
                data: {
                  cycleId: e.target.value || null,
                },
              })
            }
            className="h-7 max-w-[185px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-2 text-[12px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
          >
            <option value="">No cycle</option>
            {teamCycles
              .filter(
                (c) =>
                  c.teamId === selectedIssue.teamId && c.status !== "COMPLETED"
              )
              .map((cycle) => (
                <option key={cycle.id} value={cycle.id}>
                  {cycle.name} ({cycle.status.toLowerCase()})
                </option>
              ))}
          </select>
        </div>

        {/* Labels */}
        <div className="space-y-1.5 pt-1">
          <span className="flex items-center gap-1 text-[var(--text-4)]">
            <Tag className="h-3 w-3" />
            <span>Labels</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {allLabels.map((lbl) => {
              const active =
                selectedIssue.labels?.some((l) => l.id === lbl.id) ?? false;
              return (
                <button
                  key={lbl.id}
                  type="button"
                  onClick={() => {
                    const currentIds =
                      selectedIssue.labels?.map((l) => l.id) ?? [];
                    const nextIds = active
                      ? currentIds.filter((id) => id !== lbl.id)
                      : [...currentIds, lbl.id];
                    updateIssue.mutate({
                      id: selectedIssue.id,
                      data: { labelIds: nextIds },
                    });
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] transition-colors cursor-pointer ${
                    active
                      ? "border-[var(--border-strong)] bg-[rgba(255,255,255,0.08)] text-[var(--text)]"
                      : "border-[var(--border)] text-[var(--text-4)] hover:text-[var(--text-2)]"
                  }`}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: lbl.color }}
                  />
                  <span>{lbl.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Parent Issue Link */}
      <div className="space-y-2 border-t border-[var(--border)] pt-4 text-[12px]">
        <div className="flex items-center justify-between">
          <span className="text-[var(--text-4)]">Parent issue</span>
          {!selectedIssue.parent && (
            <button
              type="button"
              onClick={() => setIsAddingParent((v) => !v)}
              className="flex items-center gap-1 text-[11px] text-[var(--text-3)] hover:text-[var(--text)] cursor-pointer"
            >
              <Plus className="h-3 w-3" />
              <span>Set parent</span>
            </button>
          )}
        </div>

        {selectedIssue.parent ? (
          <div className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-2.5 py-1.5">
            <button
              type="button"
              onClick={() => handleNavigate(selectedIssue.parent!.id)}
              className="flex items-center gap-2 min-w-0 text-left hover:text-[var(--text)] cursor-pointer"
            >
              <IssueStatusIcon
                status={selectedIssue.parent.status}
                className="h-3.5 w-3.5 shrink-0"
              />
              <span className="text-[11px] font-medium text-[var(--text-4)] shrink-0">
                {selectedIssue.parent.identifier}
              </span>
              <span className="truncate text-[12px] text-[var(--text-2)]">
                {selectedIssue.parent.title}
              </span>
            </button>
            <button
              type="button"
              title="Unlink parent"
              onClick={() =>
                updateIssue.mutate({
                  id: selectedIssue.id,
                  data: { parentId: null },
                })
              }
              className="ml-2 shrink-0 text-[var(--text-4)] hover:text-[var(--danger)] cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : isAddingParent ? (
          <select
            defaultValue=""
            onChange={(e) => {
              if (!e.target.value) return;
              updateIssue.mutate({
                id: selectedIssue.id,
                data: { parentId: e.target.value },
              });
              setIsAddingParent(false);
            }}
            className="h-7 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-2 text-[12px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="">Select parent issue...</option>
            {availableParentCandidates.map((cand) => (
              <option key={cand.id} value={cand.id}>
                {cand.identifier} · {cand.title}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-[11px] text-[var(--text-4)]">None</p>
        )}
      </div>

      {/* Sub-issues Section */}
      <div className="space-y-2 border-t border-[var(--border)] pt-4 text-[12px]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[var(--text-4)]">
            <GitBranch className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>
              Sub-issues
              {subIssues.length > 0
                ? ` (${completedSubCount}/${subIssues.length})`
                : ""}
            </span>
          </span>
          <button
            type="button"
            onClick={() =>
              openCreateIssue({
                defaultStatus: "BACKLOG",
                defaultAssigneeId: selectedIssue.assigneeId ?? null,
                defaultParentId: selectedIssue.id,
                defaultParentIdentifier: selectedIssue.identifier,
              })
            }
            className="flex items-center gap-1 text-[11px] text-[var(--text-3)] hover:text-[var(--text)] cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            <span>Add sub-issue</span>
          </button>
        </div>

        {subIssues.length === 0 ? (
          <p className="text-[11px] text-[var(--text-4)]">No sub-issues</p>
        ) : (
          <div className="space-y-1">
            {subIssues.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-2.5 py-1.5 hover:border-[var(--border-strong)] transition-colors"
              >
                <button
                  type="button"
                  onClick={() => handleNavigate(sub.id)}
                  className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                >
                  <IssueStatusIcon
                    status={sub.status}
                    className="h-3.5 w-3.5 shrink-0"
                  />
                  <span className="text-[11px] font-medium text-[var(--text-4)] shrink-0">
                    {sub.identifier}
                  </span>
                  <span className="truncate text-[12px] text-[var(--text-2)]">
                    {sub.title}
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Relations Section */}
      <div className="space-y-2 border-t border-[var(--border)] pt-4 text-[12px]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[var(--text-4)]">
            <Link2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>Relations</span>
          </span>
          <button
            type="button"
            onClick={() => setIsAddingRelation((v) => !v)}
            className="flex items-center gap-1 text-[11px] text-[var(--text-3)] hover:text-[var(--text)] cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            <span>Add relation</span>
          </button>
        </div>

        {isAddingRelation && (
          <div className="space-y-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] p-2.5">
            <select
              value={relationType}
              onChange={(e) =>
                setRelationType(e.target.value as IssueRelationType)
              }
              className="h-7 w-full rounded border border-[var(--border)] bg-[var(--bg-elev)] px-2 text-[12px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
            >
              {RELATION_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {RELATION_LABELS[type]}
                </option>
              ))}
            </select>

            <select
              value={relationTargetId}
              onChange={(e) => setRelationTargetId(e.target.value)}
              className="h-7 w-full rounded border border-[var(--border)] bg-[var(--bg-elev)] px-2 text-[12px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="">Select target issue...</option>
              {availableRelationCandidates.map((cand) => (
                <option key={cand.id} value={cand.id}>
                  {cand.identifier} · {cand.title}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setIsAddingRelation(false)}
                className="h-6 px-2 text-[11px] text-[var(--text-4)] hover:text-[var(--text-2)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!relationTargetId || addRelation.isPending}
                onClick={() => {
                  if (!relationTargetId) return;
                  addRelation.mutate(
                    {
                      issueId: selectedIssue.id,
                      targetIssueId: relationTargetId,
                      type: relationType,
                    },
                    {
                      onSuccess: () => {
                        setRelationTargetId("");
                        setIsAddingRelation(false);
                      },
                    }
                  );
                }}
                className="h-6 rounded bg-[var(--accent)] px-2.5 text-[11px] font-medium text-[var(--text)] hover:bg-[var(--accent-hover)] disabled:opacity-40 cursor-pointer"
              >
                Link
              </button>
            </div>
          </div>
        )}

        {relations.length === 0 ? (
          <p className="text-[11px] text-[var(--text-4)]">No relations</p>
        ) : (
          <div className="space-y-1">
            {relations.map((rel) => (
              <div
                key={rel.id}
                className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-2.5 py-1.5"
              >
                <button
                  type="button"
                  onClick={() => handleNavigate(rel.issue.id)}
                  className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                >
                  <span className="rounded bg-[rgba(255,255,255,0.06)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-3)] shrink-0">
                    {RELATION_LABELS[rel.type]}
                  </span>
                  <IssueStatusIcon
                    status={rel.issue.status}
                    className="h-3 w-3 shrink-0"
                  />
                  <span className="text-[11px] font-medium text-[var(--text-4)] shrink-0">
                    {rel.issue.identifier}
                  </span>
                  <span className="truncate text-[12px] text-[var(--text-2)]">
                    {rel.issue.title}
                  </span>
                </button>

                <button
                  type="button"
                  title="Remove relation"
                  onClick={() =>
                    deleteRelation.mutate({
                      issueId: selectedIssue.id,
                      relationId: rel.id,
                    })
                  }
                  className="ml-2 shrink-0 text-[var(--text-4)] hover:text-[var(--danger)] cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
