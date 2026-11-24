"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface SlackStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export function SlackStep({ onNext, onSkip }: SlackStepProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    // Simulate brief handshake
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsConnecting(false);
    toast.success("Slack connected");
    onNext();
  };

  return (
    <div>
      {/* Title & Subtitle */}
      <div className="mb-6">
        <h1 className="text-[16px] font-medium text-[var(--text)] tracking-tight">
          Connect Slack
        </h1>
        <p className="mt-1 text-[13px] text-[var(--text-3)]">
          Bring your issues and notifications into Slack
        </p>
      </div>

      {/* Feature Value Propositions */}
      <div className="space-y-3.5 mb-6">
        <div className="border-b border-[var(--border)] pb-3">
          <h2 className="text-[13px] font-medium text-[var(--text)]">
            Create issues from Slack
          </h2>
          <p className="mt-0.5 text-[12px] text-[var(--text-3)]">
            Turn messages into SprintSync issues without leaving Slack
          </p>
        </div>

        <div className="border-b border-[var(--border)] pb-3">
          <h2 className="text-[13px] font-medium text-[var(--text)]">
            Issue notifications
          </h2>
          <p className="mt-0.5 text-[12px] text-[var(--text-3)]">
            Get updates on issues and projects in Slack channels
          </p>
        </div>

        <div>
          <h2 className="text-[13px] font-medium text-[var(--text)]">
            Personal notifications
          </h2>
          <p className="mt-0.5 text-[12px] text-[var(--text-3)]">
            Receive DMs for assignments, mentions, and comments
          </p>
        </div>
      </div>

      {/* Actions (Skip & Authenticate with Slack) */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onSkip}
          disabled={isConnecting}
          className="h-8 px-3 text-[13px] font-normal text-[var(--text-4)] transition-colors duration-100 ease-out hover:text-[var(--text-2)] disabled:opacity-50 cursor-pointer"
        >
          Skip
        </button>

        <button
          type="button"
          onClick={handleConnect}
          disabled={isConnecting}
          className="flex h-8 items-center gap-2 rounded-full bg-[var(--bg-elev)] border border-[var(--border)] px-4 text-[13px] font-medium text-[var(--text)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-strong)] transition-colors duration-100 ease-out disabled:opacity-50 cursor-pointer"
        >
          {isConnecting ? (
            <Loader2 className="h-4 w-4 animate-spin text-[var(--text-3)]" strokeWidth={1.5} />
          ) : (
            <svg
              className="h-4 w-4 fill-current text-[var(--text-2)]"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
            </svg>
          )}
          <span>Authenticate with Slack</span>
        </button>
      </div>
    </div>
  );
}
