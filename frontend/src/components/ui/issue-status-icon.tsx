import React from "react";
import { IssueStatus } from "@/types/issue.types";

interface IssueStatusIconProps {
  status: IssueStatus;
  className?: string;
}

export function IssueStatusIcon({ status, className = "h-3.5 w-3.5" }: IssueStatusIconProps) {
  switch (status) {
    case "BACKLOG":
      return (
        <svg
          className={`${className} text-[var(--text-4)]`}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="2 2"
        >
          <circle cx="8" cy="8" r="6" />
        </svg>
      );

    case "TODO":
      return (
        <svg
          className={`${className} text-[var(--text-3)]`}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="8" cy="8" r="6" />
        </svg>
      );

    case "IN_PROGRESS":
      return (
        <svg
          className={`${className} text-[var(--warning)]`}
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm0-1.5A5.5 5.5 0 0 0 8 2.5v11z"
          />
        </svg>
      );

    case "IN_REVIEW":
      return (
        <svg
          className={`${className} text-[var(--accent)]`}
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          {/* 3/4 filled circle */}
          <path d="M8 1a7 7 0 1 0 7 7H8V1z" fillOpacity="0.2" />
          <path d="M8 1v7h7A7 7 0 1 1 8 1z" />
        </svg>
      );

    case "DONE":
      return (
        <svg
          className={`${className} text-[var(--accent)]`}
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <circle cx="8" cy="8" r="7" />
          <path
            d="M5 8l2 2 4-4"
            fill="none"
            stroke="#08090a"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "CANCELED":
      return (
        <svg
          className={`${className} text-[var(--text-4)]`}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="8" cy="8" r="6" />
          <line x1="5.5" y1="5.5" x2="10.5" y2="10.5" />
          <line x1="10.5" y1="5.5" x2="5.5" y2="10.5" />
        </svg>
      );

    default:
      return (
        <svg
          className={`${className} text-[var(--text-4)]`}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="8" cy="8" r="6" />
        </svg>
      );
  }
}

export const STATUS_LABELS: Record<IssueStatus, string> = {
  BACKLOG: "Backlog",
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
  CANCELED: "Canceled",
};
