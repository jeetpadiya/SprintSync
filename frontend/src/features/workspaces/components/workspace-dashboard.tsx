"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import {
  MoreHorizontal,
  Archive,
  SlidersHorizontal,
  Settings2,
  Layers,
  Inbox as InboxIcon,
} from "lucide-react";

export function WorkspaceDashboard() {
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--bg)] text-[var(--text)] font-sans">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar />

      {/* 2. Main Application Area (Inbox View) */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="flex h-11 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-[var(--text)] tracking-tight">
              Inbox
            </span>
            <button
              type="button"
              className="flex h-5 w-5 items-center justify-center rounded text-[var(--text-4)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)] transition-colors duration-100 ease-out"
            >
              <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>

          <div className="flex items-center gap-1 text-[var(--text-4)]">
            <button
              type="button"
              title="Archive all"
              className="flex h-6 w-6 items-center justify-center rounded hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)] transition-colors duration-100 ease-out cursor-pointer"
            >
              <Archive className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              title="Filters"
              className="flex h-6 w-6 items-center justify-center rounded hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)] transition-colors duration-100 ease-out cursor-pointer"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              title="Display preferences"
              className="flex h-6 w-6 items-center justify-center rounded hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)] transition-colors duration-100 ease-out cursor-pointer"
            >
              <Settings2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </header>

        {/* Master-Detail Split Pane */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Column: Notification Item List */}
          <div className="w-[300px] shrink-0 border-r border-[var(--border)] overflow-y-auto">
            {/* Notification Item (matching screenshot) */}
            <div
              onClick={() => setSelectedNotification("welcome")}
              className={`flex items-start gap-3 p-3 border-b border-[var(--border)] transition-colors duration-100 ease-out cursor-pointer ${
                selectedNotification === "welcome"
                  ? "bg-[rgba(255,255,255,0.06)]"
                  : "hover:bg-[rgba(255,255,255,0.02)]"
              }`}
            >
              {/* Circular Linear / SprintSync Badge */}
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--bg-elev)] border border-[var(--border)] text-[var(--text-3)] mt-0.5">
                <Layers className="h-3 w-3 text-[var(--text-3)]" strokeWidth={1.5} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-[13px] font-medium text-[var(--text)] tracking-tight truncate">
                    Welcome to SprintSync
                  </h3>
                  <span className="text-[11px] text-[var(--text-4)] shrink-0 ml-2">
                    8d
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] text-[var(--text-3)] truncate leading-normal">
                  Watch an introductory video and access a list of resources to get started.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Detail Pane (Empty State matching screenshot) */}
          <div className="flex flex-1 items-center justify-center bg-[var(--bg)] p-8 select-none">
            <div className="flex flex-col items-center justify-center text-center">
              {/* Outline Line-Art Inbox Tray Icon matching screenshot */}
              <div className="mb-3 text-[var(--text-4)] opacity-60">
                <svg
                  className="h-16 w-16 stroke-[1.25] fill-none text-current"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-3.5a2.5 2.5 0 01-2.5 2.5h-4a2.5 2.5 0 01-2.5-2.5H4"
                  />
                </svg>
              </div>
              <p className="text-[12px] text-[var(--text-4)] font-normal">
                No notification selected
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
