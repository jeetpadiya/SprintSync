import React from "react";
import { IssuePriority } from "@/types/issue.types";

interface IssuePriorityIconProps {
  priority: IssuePriority;
  className?: string;
}

export function IssuePriorityIcon({ priority, className = "h-3.5 w-3.5" }: IssuePriorityIconProps) {
  switch (priority) {
    case "URGENT":
      return (
        <svg
          className={`${className} text-[var(--danger)]`}
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <rect x="2" y="2" width="12" height="12" rx="2" fillOpacity="0.15" />
          <path
            d="M8 4.5v4m0 2.5h.01"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      );

    case "HIGH":
      return (
        <svg
          className={`${className} text-[var(--warning)]`}
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <rect x="2.5" y="10" width="2" height="4" rx="0.5" />
          <rect x="7" y="7" width="2" height="7" rx="0.5" />
          <rect x="11.5" y="4" width="2" height="10" rx="0.5" />
        </svg>
      );

    case "MEDIUM":
      return (
        <svg
          className={`${className} text-[var(--text-3)]`}
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <rect x="2.5" y="10" width="2" height="4" rx="0.5" />
          <rect x="7" y="7" width="2" height="7" rx="0.5" />
          <rect x="11.5" y="4" width="2" height="10" rx="0.5" fillOpacity="0.25" />
        </svg>
      );

    case "LOW":
      return (
        <svg
          className={`${className} text-[var(--text-3)]`}
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <rect x="2.5" y="10" width="2" height="4" rx="0.5" />
          <rect x="7" y="7" width="2" height="7" rx="0.5" fillOpacity="0.25" />
          <rect x="11.5" y="4" width="2" height="10" rx="0.5" fillOpacity="0.25" />
        </svg>
      );

    case "NO_PRIORITY":
    default:
      return (
        <svg
          className={`${className} text-[var(--text-4)]`}
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <circle cx="4" cy="8" r="1" />
          <circle cx="8" cy="8" r="1" />
          <circle cx="12" cy="8" r="1" />
        </svg>
      );
  }
}

export const PRIORITY_LABELS: Record<IssuePriority, string> = {
  NO_PRIORITY: "No priority",
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};
