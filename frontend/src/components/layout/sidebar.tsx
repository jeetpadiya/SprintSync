"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import {
  Inbox,
  CircleDot,
  GitPullRequest,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Search,
  SquarePen,
  FolderKanban,
  Users2,
  HelpCircle,
} from "lucide-react";

export function Sidebar() {
  const { user } = useAuthStore();
  const [activeItem, setActiveItem] = useState("inbox");
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [teamsOpen, setTeamsOpen] = useState(false);
  const [tryOpen, setTryOpen] = useState(false);

  const workspaceName = user?.workspaces?.[0]?.name || "Jeet22";
  const workspaceInitial = workspaceName.charAt(0).toUpperCase() || "J";

  return (
    <aside className="flex h-screen w-[220px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg)] text-[var(--text)] select-none">
      {/* Workspace Switcher & Top Bar Actions */}
      <div className="flex h-11 items-center justify-between px-3 border-b border-transparent">
        <button
          type="button"
          className="flex items-center gap-2 rounded-[var(--radius)] px-1.5 py-1 text-[13px] font-medium text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors duration-100 ease-out cursor-pointer group"
        >
          {/* Workspace Avatar Badge (matching screenshot purple badge) */}
          <div className="flex h-4 w-4 items-center justify-center rounded-[3px] bg-[#6366f1] text-[10px] font-medium text-white">
            {workspaceInitial}
          </div>
          <span className="truncate max-w-[105px] tracking-tight">{workspaceName}</span>
          <ChevronDown className="h-3 w-3 text-[var(--text-4)] group-hover:text-[var(--text-3)] transition-colors duration-100" />
        </button>

        {/* Quick Actions (Search & Quick Create) */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            title="Search (Cmd+K)"
            className="flex h-6 w-6 items-center justify-center rounded-[var(--radius)] text-[var(--text-4)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)] transition-colors duration-100 ease-out cursor-pointer"
          >
            <Search className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            title="New issue (C)"
            className="flex h-6 w-6 items-center justify-center rounded-[var(--radius)] text-[var(--text-4)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)] transition-colors duration-100 ease-out cursor-pointer"
          >
            <SquarePen className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 space-y-0.5 px-2 py-1 overflow-y-auto">
        {/* Item: Inbox */}
        <button
          type="button"
          onClick={() => setActiveItem("inbox")}
          className={`flex h-7 w-full items-center gap-2 rounded-[var(--radius)] px-2 text-[13px] transition-colors duration-100 ease-out cursor-pointer ${
            activeItem === "inbox"
              ? "bg-[rgba(255,255,255,0.06)] text-[var(--text)] font-medium"
              : "text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
          }`}
        >
          <Inbox className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
          <span>Inbox</span>
        </button>

        {/* Item: My Issues */}
        <button
          type="button"
          onClick={() => setActiveItem("my-issues")}
          className={`flex h-7 w-full items-center gap-2 rounded-[var(--radius)] px-2 text-[13px] transition-colors duration-100 ease-out cursor-pointer ${
            activeItem === "my-issues"
              ? "bg-[rgba(255,255,255,0.06)] text-[var(--text)] font-medium"
              : "text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
          }`}
        >
          <CircleDot className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
          <span>My Issues</span>
        </button>

        {/* Item: Reviews */}
        <button
          type="button"
          onClick={() => setActiveItem("reviews")}
          className={`flex h-7 w-full items-center justify-between rounded-[var(--radius)] px-2 text-[13px] transition-colors duration-100 ease-out cursor-pointer ${
            activeItem === "reviews"
              ? "bg-[rgba(255,255,255,0.06)] text-[var(--text)] font-medium"
              : "text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
          }`}
        >
          <div className="flex items-center gap-2">
            <GitPullRequest className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
            <span>Reviews</span>
          </div>
          {/* Subtle notification dot on reviews */}
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-4)]" />
        </button>

        {/* Item: Documents */}
        <button
          type="button"
          onClick={() => setActiveItem("documents")}
          className={`flex h-7 w-full items-center gap-2 rounded-[var(--radius)] px-2 text-[13px] transition-colors duration-100 ease-out cursor-pointer ${
            activeItem === "documents"
              ? "bg-[rgba(255,255,255,0.06)] text-[var(--text)] font-medium"
              : "text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
          }`}
        >
          <FileText className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
          <span>Documents</span>
        </button>

        {/* Item: Agent */}
        <button
          type="button"
          onClick={() => setActiveItem("agent")}
          className={`flex h-7 w-full items-center gap-2 rounded-[var(--radius)] px-2 text-[13px] transition-colors duration-100 ease-out cursor-pointer ${
            activeItem === "agent"
              ? "bg-[rgba(255,255,255,0.06)] text-[var(--text)] font-medium"
              : "text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-[var(--text-3)]" strokeWidth={1.5} />
          <span>Agent</span>
        </button>

        {/* Section: Workspace */}
        <div className="pt-4">
          <button
            type="button"
            onClick={() => setWorkspaceOpen(!workspaceOpen)}
            className="flex h-6 w-full items-center gap-1.5 rounded-[var(--radius)] px-2 text-[12px] font-medium text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors duration-100 ease-out cursor-pointer"
          >
            <span>Workspace</span>
            <ChevronRight
              className={`h-3 w-3 text-[var(--text-4)] transition-transform duration-150 ${
                workspaceOpen ? "rotate-90" : ""
              }`}
            />
          </button>
          {workspaceOpen && (
            <div className="pl-4 pr-1 py-1 space-y-0.5">
              <button
                type="button"
                className="flex h-6 w-full items-center gap-2 rounded-[var(--radius)] px-2 text-[12px] text-[var(--text-4)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)] cursor-pointer"
              >
                <FolderKanban className="h-3 w-3" strokeWidth={1.5} />
                <span>Projects</span>
              </button>
            </div>
          )}
        </div>

        {/* Section: Your teams */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setTeamsOpen(!teamsOpen)}
            className="flex h-6 w-full items-center gap-1.5 rounded-[var(--radius)] px-2 text-[12px] font-medium text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors duration-100 ease-out cursor-pointer"
          >
            <span>Your teams</span>
            <ChevronRight
              className={`h-3 w-3 text-[var(--text-4)] transition-transform duration-150 ${
                teamsOpen ? "rotate-90" : ""
              }`}
            />
          </button>
          {teamsOpen && (
            <div className="pl-4 pr-1 py-1 space-y-0.5">
              <button
                type="button"
                className="flex h-6 w-full items-center gap-2 rounded-[var(--radius)] px-2 text-[12px] text-[var(--text-4)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)] cursor-pointer"
              >
                <Users2 className="h-3 w-3" strokeWidth={1.5} />
                <span>Engineering</span>
              </button>
            </div>
          )}
        </div>

        {/* Section: Try */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setTryOpen(!tryOpen)}
            className="flex h-6 w-full items-center gap-1.5 rounded-[var(--radius)] px-2 text-[12px] font-medium text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors duration-100 ease-out cursor-pointer"
          >
            <span>Try</span>
            <ChevronRight
              className={`h-3 w-3 text-[var(--text-4)] transition-transform duration-150 ${
                tryOpen ? "rotate-90" : ""
              }`}
            />
          </button>
          {tryOpen && (
            <div className="pl-4 pr-1 py-1 space-y-0.5">
              <button
                type="button"
                className="flex h-6 w-full items-center gap-2 rounded-[var(--radius)] px-2 text-[12px] text-[var(--text-4)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)] cursor-pointer"
              >
                <HelpCircle className="h-3 w-3" strokeWidth={1.5} />
                <span>Cycles &amp; Sprints</span>
              </button>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}
