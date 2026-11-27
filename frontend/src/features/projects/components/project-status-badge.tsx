import { ProjectStatus } from "@/types/project.types";

export const PROJECT_STATUS_META: Record<
  ProjectStatus,
  { label: string; dotClass: string; badgeClass: string }
> = {
  PLANNED: {
    label: "Planned",
    dotClass: "bg-[var(--text-4)]",
    badgeClass: "text-[var(--text-3)] border-[var(--border)] bg-[var(--bg-elev)]",
  },
  IN_PROGRESS: {
    label: "In Progress",
    dotClass: "bg-[var(--warning)]",
    badgeClass:
      "text-[var(--warning)] border-[var(--warning)]/30 bg-[rgba(242,201,76,0.08)]",
  },
  PAUSED: {
    label: "Paused",
    dotClass: "bg-[#f97316]",
    badgeClass:
      "text-[#fb923c] border-[#f97316]/30 bg-[rgba(249,115,22,0.08)]",
  },
  COMPLETED: {
    label: "Completed",
    dotClass: "bg-[var(--success)]",
    badgeClass:
      "text-[var(--success)] border-[var(--success)]/30 bg-[rgba(76,183,130,0.08)]",
  },
  CANCELED: {
    label: "Canceled",
    dotClass: "bg-[var(--danger)]",
    badgeClass:
      "text-[var(--danger)] border-[var(--danger)]/30 bg-[rgba(235,87,87,0.08)]",
  },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const meta = PROJECT_STATUS_META[status] ?? PROJECT_STATUS_META.PLANNED;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.badgeClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
      <span>{meta.label}</span>
    </span>
  );
}
