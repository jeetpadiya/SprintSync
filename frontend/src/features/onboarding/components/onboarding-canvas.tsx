"use client";

import { Layers, GitMerge, MessageSquare, Sparkles, Users } from "lucide-react";

interface OnboardingCanvasProps {
  step: number;
}

export function OnboardingCanvas({ step }: OnboardingCanvasProps) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden border-l border-[var(--border)] bg-[var(--bg-panel)] p-8 select-none">
      {/* Subtle background radial glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(94,106,210,0.06),transparent_70%)]" />

      {/* Step 1: Brand & Logo */}
      {step === 1 && (
        <div className="flex flex-col items-center gap-3 text-center transition-opacity duration-300 ease-out">
          <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] text-[var(--text-3)] shadow-sm">
            <Layers className="h-7 w-7 text-[var(--text-3)]" strokeWidth={1.5} />
          </div>
          <span className="text-[24px] font-medium tracking-tight text-[var(--text-2)]">
            SprintSync
          </span>
          <p className="max-w-[260px] text-[12px] text-[var(--text-4)] leading-relaxed">
            High performance issue tracking designed for velocity and modern engineering teams.
          </p>
        </div>
      )}

      {/* Step 2: Team Collaboration Mockup */}
      {step === 2 && (
        <div className="flex flex-col gap-3 w-full max-w-[320px] opacity-75 transition-opacity duration-300 ease-out">
          <div className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-[12px]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--warning)]" />
              <span className="text-[var(--text-2)] font-medium">In Progress</span>
            </div>
            <div className="flex items-center gap-1.5 text-[var(--text-4)]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3b82f6] text-[10px] text-white font-medium">
                AL
              </span>
              <span>Oct 9</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-[12px]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--success)]" />
              <span className="text-[var(--text-2)] font-medium">Finished</span>
            </div>
            <div className="flex items-center gap-1.5 text-[var(--text-4)]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#10b981] text-[10px] text-white font-medium">
                JD
              </span>
              <span>Oct 9</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-[12px]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--danger)]" />
              <span className="text-[var(--text-2)] font-medium">Bug</span>
            </div>
            <div className="flex items-center gap-1.5 text-[var(--text-4)]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f59e0b] text-[10px] text-white font-medium">
                JP
              </span>
              <span>Oct 9</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: GitHub PR / Code Diff Mockup */}
      {step === 3 && (
        <div className="flex flex-col gap-2 w-full max-w-[340px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] p-4 font-mono text-[11px] opacity-80 transition-opacity duration-300 ease-out">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 text-[var(--text-4)]">
            <span className="text-[var(--text-3)] font-sans font-medium text-[12px]">
              feat/optimistic-mutations
            </span>
            <span className="flex items-center gap-1 text-[var(--success)]">
              <GitMerge className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>Mergeable</span>
            </span>
          </div>

          <div className="pt-2 text-[var(--text-3)] space-y-1">
            <p className="text-[var(--text-4)]">// Synchronize optimistic issue cache</p>
            <p className="text-[var(--accent)] font-medium">
              const sorted = Array.from(issues);
            </p>
            <p className="text-[var(--text-2)]">
              sorted.sort((a, b) =&gt; a.position - b.position);
            </p>
            <p className="text-[var(--success)]">+ return sorted;</p>
          </div>

          <div className="mt-2 flex justify-end">
            <div className="flex items-center gap-1.5 rounded-[var(--radius)] bg-[var(--accent)] px-2.5 py-1 text-[11px] font-sans font-medium text-white shadow-sm">
              <GitMerge className="h-3 w-3" strokeWidth={1.5} />
              <span>Merge pull request</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Slack Notifications Thread Mockup */}
      {step === 4 && (
        <div className="flex flex-col gap-3 w-full max-w-[320px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] p-3.5 text-[12px] opacity-80 transition-opacity duration-300 ease-out">
          <div className="flex items-start gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#6366f1] text-[11px] font-medium text-white">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-[var(--text)]">andreas</span>
                <span className="text-[10px] text-[var(--text-4)]">11:07 AM</span>
              </div>
              <p className="mt-1 text-[12px] text-[var(--text-3)] leading-relaxed">
                Feels like we could render sooner and load the rest in the background.
              </p>
            </div>
          </div>

          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] p-2">
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-4)]">
              <Layers className="h-3 w-3 text-[var(--accent)]" strokeWidth={1.5} />
              <span className="font-medium text-[var(--text-3)]">SprintSync</span>
              <span>created issue ENG-248</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Cycles / Velocity Updates Mockup */}
      {step === 5 && (
        <div className="flex flex-col gap-3 w-full max-w-[300px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] p-4 opacity-80 transition-opacity duration-300 ease-out">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-[var(--text-3)]">
              Cycle 12 Velocity
            </span>
            <span className="rounded-[var(--radius)] bg-[var(--accent)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent)]">
              Active
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-[26px] font-medium text-[var(--text)]">32</span>
            <span className="text-[13px] text-[var(--text-4)]">/ 53 pts completed</span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full rounded-full bg-[var(--border)] overflow-hidden">
            <div className="h-full w-[60%] rounded-full bg-[var(--accent)]" />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[var(--text-4)] pt-1">
            <span>5 days remaining</span>
            <span className="text-[var(--success)]">60% burn-down</span>
          </div>
        </div>
      )}
    </div>
  );
}
