"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Issue, IssueStatus } from "@/types/issue.types";
import {
  IssueStatusIcon,
  STATUS_LABELS,
} from "@/components/ui/issue-status-icon";
import {
  IssuePriorityIcon,
  PRIORITY_LABELS,
} from "@/components/ui/issue-priority-icon";
import { computeDropSortOrder } from "@/features/issues/lib/fractional-order";
import { Plus, UserCircle2 } from "lucide-react";

const BOARD_COLUMNS: IssueStatus[] = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
];

interface KanbanBoardProps {
  issues: Issue[];
  selectedIssueId: string | null;
  onSelectIssue: (id: string) => void;
  onMoveIssue: (id: string, status: IssueStatus, sortOrder: number) => void;
  onCreateInStatus: (status: IssueStatus) => void;
  statuses?: IssueStatus[];
}

export function KanbanBoard({
  issues,
  selectedIssueId,
  onSelectIssue,
  onMoveIssue,
  onCreateInStatus,
  statuses = BOARD_COLUMNS,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<IssueStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const groupedByStatus = useMemo(() => {
    const map = new Map<IssueStatus, Issue[]>();
    for (const st of statuses) {
      map.set(st, []);
    }
    const sorted = [...issues].sort((a, b) => a.sortOrder - b.sortOrder);
    for (const issue of sorted) {
      const bucket = map.get(issue.status);
      if (bucket) {
        bucket.push(issue);
      }
    }
    return map;
  }, [issues, statuses]);

  const activeIssue = activeId
    ? issues.find((i) => i.id === activeId) ?? null
    : null;

  const findContainerStatus = (id: string): IssueStatus | null => {
    if (statuses.includes(id as IssueStatus)) {
      return id as IssueStatus;
    }
    const item = issues.find((i) => i.id === id);
    return item ? item.status : null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over ? String(event.over.id) : null;
    if (!overId) {
      setOverStatus(null);
      return;
    }
    setOverStatus(findContainerStatus(overId));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverStatus(null);

    if (!over) return;

    const draggedId = String(active.id);
    const overId = String(over.id);

    const draggedIssue = issues.find((i) => i.id === draggedId);
    if (!draggedIssue) return;

    const targetStatus = findContainerStatus(overId);
    if (!targetStatus) return;

    const targetColumnIssues = (groupedByStatus.get(targetStatus) ?? []).filter(
      (i) => i.id !== draggedId
    );

    let targetIndex = targetColumnIssues.length;
    if (!statuses.includes(overId as IssueStatus)) {
      const overIndex = targetColumnIssues.findIndex((i) => i.id === overId);
      if (overIndex !== -1) {
        targetIndex = overIndex;
      }
    }

    const newSortOrder = computeDropSortOrder(targetColumnIssues, targetIndex);

    if (
      draggedIssue.status === targetStatus &&
      draggedIssue.sortOrder === newSortOrder
    ) {
      return;
    }

    onMoveIssue(draggedId, targetStatus, newSortOrder);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-1 gap-3 overflow-x-auto px-4 py-4 bg-[var(--bg)]">
        {statuses.map((status) => {
          const columnIssues = groupedByStatus.get(status) ?? [];
          return (
            <BoardColumn
              key={status}
              status={status}
              issues={columnIssues}
              isOver={overStatus === status}
              selectedIssueId={selectedIssueId}
              onSelectIssue={onSelectIssue}
              onCreateInStatus={onCreateInStatus}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeIssue ? (
          <div className="w-[272px] rotate-[1deg] opacity-95 shadow-2xl">
            <IssueCardContent issue={activeIssue} isSelected={false} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

interface BoardColumnProps {
  status: IssueStatus;
  issues: Issue[];
  isOver: boolean;
  selectedIssueId: string | null;
  onSelectIssue: (id: string) => void;
  onCreateInStatus: (status: IssueStatus) => void;
}

function BoardColumn({
  status,
  issues,
  isOver,
  selectedIssueId,
  onSelectIssue,
  onCreateInStatus,
}: BoardColumnProps) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-[280px] shrink-0 flex-col rounded-[8px] border transition-colors ${
        isOver
          ? "border-[var(--accent)]/60 bg-[rgba(94,106,210,0.05)]"
          : "border-[var(--border)] bg-[var(--bg-panel)]/40"
      }`}
    >
      {/* Column Header */}
      <div className="flex h-10 shrink-0 items-center justify-between px-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <IssueStatusIcon status={status} className="h-3.5 w-3.5" />
          <span className="text-[12px] font-medium text-[var(--text)]">
            {STATUS_LABELS[status]}
          </span>
          <span className="text-[11px] text-[var(--text-4)]">
            {issues.length}
          </span>
        </div>

        <button
          type="button"
          title={`New ${STATUS_LABELS[status]} issue`}
          onClick={() => onCreateInStatus(status)}
          className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-4)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)] transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>

      {/* Cards Container */}
      <SortableContext
        items={issues.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 space-y-2 overflow-y-auto p-2">
          {issues.map((issue) => (
            <SortableIssueCard
              key={issue.id}
              issue={issue}
              isSelected={selectedIssueId === issue.id}
              onSelect={() => onSelectIssue(issue.id)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableIssueCard({
  issue,
  isSelected,
  onSelect,
}: {
  issue: Issue;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: issue.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onSelect}
      className={isDragging ? "opacity-35" : ""}
    >
      <IssueCardContent issue={issue} isSelected={isSelected} />
    </div>
  );
}

function IssueCardContent({
  issue,
  isSelected,
}: {
  issue: Issue;
  isSelected: boolean;
}) {
  return (
    <div
      className={`rounded-[var(--radius)] border p-3 transition-colors cursor-grab active:cursor-grabbing ${
        isSelected
          ? "border-[var(--accent)] bg-[rgba(94,106,210,0.08)]"
          : "border-[var(--border)] bg-[var(--bg-panel)] hover:border-[var(--border-strong)]"
      }`}
    >
      {/* Top Row: Identifier + Assignee */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-[var(--text-4)]">
          {issue.identifier}
        </span>

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

      {/* Title */}
      <div className="mt-1.5 flex items-start gap-1.5">
        <span className="mt-0.5 shrink-0">
          <IssueStatusIcon status={issue.status} className="h-3.5 w-3.5" />
        </span>
        <p className="line-clamp-2 text-[13px] font-medium leading-snug text-[var(--text)]">
          {issue.title}
        </p>
      </div>

      {/* Bottom Meta Row: Priority + Estimate + Labels */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span
          title={PRIORITY_LABELS[issue.priority]}
          className="inline-flex h-5 items-center rounded border border-[var(--border)] bg-[var(--bg-elev)] px-1.5"
        >
          <IssuePriorityIcon priority={issue.priority} className="h-3 w-3" />
        </span>

        {issue.estimate !== null && issue.estimate !== undefined && (
          <span className="inline-flex h-5 items-center rounded border border-[var(--border)] bg-[var(--bg-elev)] px-1.5 text-[10px] text-[var(--text-3)]">
            {issue.estimate}pt
          </span>
        )}

        {issue.labels?.slice(0, 2).map((lbl) => (
          <span
            key={lbl.id}
            className="inline-flex h-5 items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--bg-elev)] px-2 text-[10px] text-[var(--text-3)]"
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: lbl.color }}
            />
            <span className="max-w-[72px] truncate">{lbl.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
