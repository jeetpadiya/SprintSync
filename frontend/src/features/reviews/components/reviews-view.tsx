"use client";

import { useState } from "react";
import { toast } from "sonner";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { useAuthStore } from "@/store/useAuthStore";
import {
  GitPullRequest,
  Sparkles,
  MessageSquare,
  Inbox,
  Compass,
  RefreshCw,
  Check,
  ChevronRight,
  Info,
} from "lucide-react";

type ReviewFeatureId =
  | "highlighting"
  | "iterate"
  | "inbox"
  | "guided"
  | "sync";

interface ReviewFeature {
  id: ReviewFeatureId;
  label: string;
  stepCount: string;
  sectionTitle: string;
  sectionDescription: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const REVIEW_FEATURES: ReviewFeature[] = [
  {
    id: "highlighting",
    label: "Structural highlighting",
    stepCount: "01 / 03",
    sectionTitle: "Shared Notification Model",
    sectionDescription:
      "Separating category, route, and parse-failure concepts keeps driver notifications consistent across platforms. Categories now own their default copy, while notifications carry optional parse failure details for analytics reporting.",
    icon: Sparkles,
  },
  {
    id: "iterate",
    label: "Review and iterate",
    stepCount: "02 / 03",
    sectionTitle: "Inline Thread Resolution",
    sectionDescription:
      "Discuss edge cases directly on changed blocks, request follow-up commits, and resolve threads without losing context on the underlying product issue.",
    icon: MessageSquare,
  },
  {
    id: "inbox",
    label: "Review inbox",
    stepCount: "01 / 04",
    sectionTitle: "Prioritized Review Queue",
    sectionDescription:
      "See pull requests waiting on your approval alongside CI status, review requests, and linked SprintSync issues in a single keyboard-first queue.",
    icon: Inbox,
  },
  {
    id: "guided",
    label: "Guided reviews",
    stepCount: "01 / 03",
    sectionTitle: "Shared Notification Model",
    sectionDescription:
      "Separating category, route, and parse-failure concepts keeps driver notifications consistent across platforms. Categories now own their default copy, while notifications carry optional parse failure details for analytics reporting.",
    icon: Compass,
  },
  {
    id: "sync",
    label: "Two-way GitHub sync",
    stepCount: "03 / 03",
    sectionTitle: "Automated Status Transitions",
    sectionDescription:
      "Approvals, comments, and merges synchronize bidirectionally with GitHub so issues automatically transition from In Review to Done on merge.",
    icon: RefreshCw,
  },
];

interface DiffFile {
  id: string;
  name: string;
  path: string;
  lang: "K" | "S";
  additions: number;
  deletions: number;
}

const DIFF_FILES: DiffFile[] = [
  {
    id: "notif-cat-kt",
    name: "NotificationCategory.kt",
    path: "driver/android/app/src/main/kot...",
    lang: "K",
    additions: 57,
    deletions: 0,
  },
  {
    id: "driver-notif-kt",
    name: "DriverNotification.kt",
    path: "driver/android/app/src/...",
    lang: "K",
    additions: 2,
    deletions: 52,
  },
  {
    id: "notif-cat-swift",
    name: "NotificationCategory.swift",
    path: "driver/ios/DriverApp/Service...",
    lang: "S",
    additions: 42,
    deletions: 0,
  },
  {
    id: "driver-notif-swift",
    name: "DriverNotification.swift",
    path: "driver/ios/DriverApp/Service...",
    lang: "S",
    additions: 8,
    deletions: 36,
  },
];

export function ReviewsView() {
  const { user } = useAuthStore();
  const [activeFeatureId, setActiveFeatureId] =
    useState<ReviewFeatureId>("guided");
  const [selectedFileId, setSelectedFileId] =
    useState<string>("driver-notif-kt");
  const [reviewedFiles, setReviewedFiles] = useState<Record<string, boolean>>(
    {}
  );
  const [dismissedHint, setDismissedHint] = useState(false);

  const activeFeature =
    REVIEW_FEATURES.find((f) => f.id === activeFeatureId) ?? REVIEW_FEATURES[3]!;
  const authorName = user?.name || "Jeet Padiya";

  const toggleReviewed = (fileId: string) => {
    setReviewedFiles((prev) => ({
      ...prev,
      [fileId]: !prev[fileId],
    }));
  };

  return (
    <WorkspaceShell>
      {/* Top Header Bar */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
        <div className="flex items-center gap-2">
          <GitPullRequest
            className="h-3.5 w-3.5 text-[var(--text-3)]"
            strokeWidth={1.5}
          />
          <span className="text-[13px] font-medium tracking-tight text-[var(--text)]">
            Reviews
          </span>
          <span className="rounded-[4px] border border-[var(--border)] bg-[var(--bg-elev)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--text-3)]">
            Get started
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            setDismissedHint(true);
            toast.info("Reviews preference saved", {
              description: "You can connect GitHub anytime from Settings.",
            });
          }}
          className="text-[12px] text-[var(--text-4)] hover:text-[var(--text-2)] transition-colors cursor-pointer"
        >
          {dismissedHint ? "Code review hidden" : "I don't do code review"}
        </button>
      </header>

      {/* Main Content */}
      <div className="relative flex flex-1 flex-col overflow-y-auto bg-[var(--bg)]">
        <div className="mx-auto flex w-full max-w-[1160px] flex-1 items-center px-6 py-10 lg:px-10">
          <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left Column: Intro + CTAs + Feature List */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-3">
                <h1 className="text-[22px] font-medium tracking-tight text-[var(--text)]">
                  SprintSync Reviews
                </h1>
                <p className="text-[13px] leading-relaxed text-[var(--text-3)] max-w-[400px]">
                  SprintSync Reviews brings code review into the product
                  development workflow. See pull requests alongside the issues
                  behind them, review and discuss changes, and merge without
                  switching between SprintSync and GitHub.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    toast.info("GitHub integration coming soon", {
                      description:
                        "Backend OAuth & PR sync will be wired in the next phase.",
                    })
                  }
                  className="flex h-8 items-center gap-2 rounded-[var(--radius)] bg-[var(--accent)] px-3.5 text-[12px] font-medium text-[var(--text)] hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
                >
                  <svg
                    className="h-3.5 w-3.5 fill-current"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                  <span>Connect GitHub</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFeatureId("highlighting")}
                  className="flex h-8 items-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-3.5 text-[12px] font-medium text-[var(--text-2)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)] transition-colors cursor-pointer"
                >
                  Learn more
                </button>
              </div>

              {/* Feature Highlights List */}
              <div className="space-y-1 pt-2">
                {REVIEW_FEATURES.map((feature) => {
                  const Icon = feature.icon;
                  const isActive = activeFeatureId === feature.id;
                  return (
                    <button
                      key={feature.id}
                      type="button"
                      onClick={() => setActiveFeatureId(feature.id)}
                      className={`flex h-8 w-full max-w-[260px] items-center gap-2.5 rounded-[var(--radius)] px-2 text-left text-[13px] transition-colors cursor-pointer ${
                        isActive
                          ? "bg-[rgba(255,255,255,0.05)] text-[var(--text)] font-medium"
                          : "text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-2)]"
                      }`}
                    >
                      <Icon
                        className={`h-3.5 w-3.5 shrink-0 ${
                          isActive ? "text-[var(--text-2)]" : "text-[var(--text-4)]"
                        }`}
                        strokeWidth={1.5}
                      />
                      <span>{feature.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Interactive PR Review Preview Card */}
            <div className="lg:col-span-7">
              <div className="overflow-hidden rounded-[10px] border border-[var(--border-strong)] bg-[var(--bg-panel)] shadow-[0_24px_60px_rgba(0,0,0,0.65)]">
                {/* PR Card Header */}
                <div className="border-b border-[var(--border)] px-5 py-4">
                  <h2 className="text-[15px] font-medium tracking-tight text-[var(--text)]">
                    Refactor notification model and capture parse failures
                  </h2>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--text-4)]">
                    <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#38bdf8]/20 text-[9px] font-semibold text-[#38bdf8]">
                      {authorName.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-[var(--text-3)]">{authorName}</span>
                    <span>·</span>
                    <span>rideshare#357</span>
                    <span>·</span>
                    <span className="font-mono text-[10px] text-[var(--text-3)]">
                      main &rarr; notification-parse-failures
                    </span>
                  </div>
                </div>

                {/* Card Body: Left Guided Summary & Files + Right Code Diff */}
                <div className="grid grid-cols-1 md:grid-cols-12">
                  {/* Left Guided Summary + File List */}
                  <div className="border-b border-[var(--border)] p-4 md:col-span-5 md:border-b-0 md:border-r space-y-4">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-[var(--text-4)]">
                        {activeFeature.stepCount}
                      </span>
                      <h3 className="text-[13px] font-medium text-[var(--text)]">
                        {activeFeature.sectionTitle}
                      </h3>
                      <p className="text-[11px] leading-relaxed text-[var(--text-3)]">
                        {activeFeature.sectionDescription}
                      </p>
                    </div>

                    {/* Changed Files */}
                    <div className="space-y-1 pt-1">
                      {DIFF_FILES.map((file) => {
                        const isSelected = selectedFileId === file.id;
                        return (
                          <button
                            key={file.id}
                            type="button"
                            onClick={() => setSelectedFileId(file.id)}
                            className={`flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-[rgba(255,255,255,0.06)]"
                                : "hover:bg-[var(--bg-hover)]"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] text-[9px] font-semibold ${
                                  file.lang === "K"
                                    ? "bg-[#7f52ff]/20 text-[#a78bfa]"
                                    : "bg-[#f97316]/20 text-[#fb923c]"
                                }`}
                              >
                                {file.lang}
                              </span>
                              <span className="truncate text-[11px] font-medium text-[var(--text-2)]">
                                {file.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 font-mono text-[10px]">
                              {file.additions > 0 && (
                                <span className="text-[var(--success)]">
                                  +{file.additions}
                                </span>
                              )}
                              {file.deletions > 0 && (
                                <span className="text-[var(--danger)]">
                                  -{file.deletions}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Code Diff Panel */}
                  <div className="bg-[#0b0c0d] md:col-span-7 flex flex-col">
                    {/* Collapsed File Bar 1 */}
                    <div className="flex h-8 items-center justify-between border-b border-[var(--border)] px-3 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setSelectedFileId("notif-cat-kt")}
                        className="flex items-center gap-1.5 min-w-0 text-left cursor-pointer"
                      >
                        <ChevronRight className="h-3 w-3 text-[var(--text-4)] shrink-0" />
                        <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] bg-[#7f52ff]/20 text-[9px] font-semibold text-[#a78bfa]">
                          K
                        </span>
                        <span className="truncate text-[var(--text-2)]">
                          NotificationCategory.kt
                        </span>
                        <span className="truncate text-[10px] text-[var(--text-4)] hidden sm:inline">
                          driver/android/app/src/...
                        </span>
                      </button>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="font-mono text-[10px] text-[var(--success)]">
                          +57
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleReviewed("notif-cat-kt")}
                          className="flex items-center gap-1 text-[10px] text-[var(--text-4)] hover:text-[var(--text-2)] cursor-pointer"
                        >
                          <span
                            className={`flex h-3 w-3 items-center justify-center rounded-[3px] border ${
                              reviewedFiles["notif-cat-kt"]
                                ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                                : "border-[var(--border-strong)]"
                            }`}
                          >
                            {reviewedFiles["notif-cat-kt"] && (
                              <Check className="h-2 w-2" strokeWidth={2.5} />
                            )}
                          </span>
                          <span>Reviewed</span>
                        </button>
                      </div>
                    </div>

                    {/* Expanded Active File Header */}
                    <div className="flex h-8 items-center justify-between border-b border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-3 text-[11px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] bg-[#7f52ff]/20 text-[9px] font-semibold text-[#a78bfa]">
                          K
                        </span>
                        <span className="truncate font-medium text-[var(--text)]">
                          {DIFF_FILES.find((f) => f.id === selectedFileId)?.name ??
                            "DriverNotification.kt"}
                        </span>
                        <span className="truncate text-[10px] text-[var(--text-4)] hidden sm:inline">
                          {DIFF_FILES.find((f) => f.id === selectedFileId)?.path ??
                            "driver/android/app/src/..."}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="font-mono text-[10px]">
                          <span className="text-[var(--success)]">+2</span>{" "}
                          <span className="text-[var(--danger)]">-52</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleReviewed(selectedFileId)}
                          className="flex items-center gap-1 text-[10px] text-[var(--text-4)] hover:text-[var(--text-2)] cursor-pointer"
                        >
                          <span
                            className={`flex h-3 w-3 items-center justify-center rounded-[3px] border ${
                              reviewedFiles[selectedFileId]
                                ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                                : "border-[var(--border-strong)]"
                            }`}
                          >
                            {reviewedFiles[selectedFileId] && (
                              <Check className="h-2 w-2" strokeWidth={2.5} />
                            )}
                          </span>
                          <span>Reviewed</span>
                        </button>
                      </div>
                    </div>

                    {/* Code Diff Lines */}
                    <div className="py-2 font-mono text-[11px] leading-[1.65] overflow-x-auto select-text">
                      <DiffLine num="1" code="package com.rideshare.driver.common" />
                      <DiffLine num="2" code="import java.time.Instant" />
                      <DiffLine num="3" code="" />
                      <DiffLine
                        num="4"
                        code="data class DriverNotification("
                        highlight="keyword"
                      />
                      <DiffLine num="5" code="    val id: String," />
                      <DiffLine
                        num="6"
                        code="    val category: String,"
                        variant="remove"
                      />
                      <DiffLine
                        num="6"
                        code="    val category: NotificationCategory,"
                        variant="add"
                      />
                      <DiffLine num="7" code="    val title: String," />
                      <DiffLine num="8" code="    val body: String," />
                      <DiffLine num="9" code="    val route: DriverNotificationRoute," />
                      <DiffLine num="10" code="    val receivedAt: Instant," />
                      <DiffLine num="11" code="    val source: Source," />
                      <DiffLine num="12" code="    val raw: Map<String, String>," />
                      <DiffLine num="13" code=") {" />
                      <DiffLine
                        num=""
                        code="    enum class Category(val rawValue: String) {"
                        variant="remove-muted"
                      />
                      <DiffLine
                        num=""
                        code='        TripRequest("trip_request"),'
                        variant="remove-muted"
                      />
                      <DiffLine
                        num=""
                        code='        TripUpdate("trip_update"),'
                        variant="remove-muted"
                      />
                      <DiffLine
                        num=""
                        code='        Earnings("earnings"),'
                        variant="remove-muted"
                      />
                      <DiffLine
                        num=""
                        code='        Delivery("delivery"),'
                        variant="remove-muted"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom-right subtle Agent/Info footer matching Linear screenshot */}
        <div className="flex h-9 shrink-0 items-center justify-end gap-3 px-4 text-[11px] text-[var(--text-4)]">
          <span className="flex items-center gap-1">
            <span>&triangleright;</span>
            <span>Agent</span>
          </span>
          <Info className="h-3.5 w-3.5" strokeWidth={1.5} />
        </div>
      </div>
    </WorkspaceShell>
  );
}

interface DiffLineProps {
  num: string;
  code: string;
  variant?: "normal" | "add" | "remove" | "remove-muted";
  highlight?: "keyword";
}

function DiffLine({ num, code, variant = "normal" }: DiffLineProps) {
  const rowStyles: Record<NonNullable<DiffLineProps["variant"]>, string> = {
    normal: "text-[var(--text-3)]",
    add: "bg-[#12261e]/80 text-[#7ee787] border-l-2 border-[#4cb782]",
    remove: "bg-[#2c1517]/80 text-[#ffa198] border-l-2 border-[#eb5757]",
    "remove-muted": "bg-[#1e1214]/60 text-[#c97a76]/75",
  };

  return (
    <div className={`flex items-center px-3 whitespace-pre ${rowStyles[variant]}`}>
      <span className="w-7 shrink-0 select-none text-right pr-3 text-[10px] text-[var(--text-4)]">
        {num}
      </span>
      <span>{code}</span>
    </div>
  );
}
