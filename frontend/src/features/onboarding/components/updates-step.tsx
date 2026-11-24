"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface UpdatesStepProps {
  onComplete: () => void;
}

export function UpdatesStep({ onComplete }: UpdatesStepProps) {
  const [changelog, setChangelog] = useState(false);
  const [onboardingEmails, setOnboardingEmails] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);

  const handleFinish = async () => {
    setIsFinishing(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setIsFinishing(false);
    toast.success("Welcome to SprintSync!");
    onComplete();
  };

  return (
    <div>
      {/* Title & Subtitle */}
      <div className="mb-6">
        <h1 className="text-[16px] font-medium text-[var(--text)] tracking-tight">
          Subscribe to updates
        </h1>
        <p className="mt-1 text-[13px] text-[var(--text-3)]">
          Stay in the loop as SprintSync evolves
        </p>
      </div>

      {/* Subscription Options */}
      <div className="space-y-4 mb-8">
        {/* Item 1: Changelog */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[13px] font-medium text-[var(--text)]">
              Changelog
            </h2>
            <p className="mt-0.5 text-[12px] text-[var(--text-3)]">
              Bi-weekly email with new features and updates
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={changelog}
            onClick={() => setChangelog(!changelog)}
            className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              changelog ? "bg-[var(--accent)]" : "bg-[var(--bg-elev)] border border-[var(--border)]"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                changelog ? "translate-x-3.5" : "translate-x-0.5"
              } mt-0.5`}
            />
          </button>
        </div>

        {/* Item 2: Onboarding emails */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[13px] font-medium text-[var(--text)]">
              Onboarding emails
            </h2>
            <p className="mt-0.5 text-[12px] text-[var(--text-3)]">
              A limited set of emails to help you ramp up
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={onboardingEmails}
            onClick={() => setOnboardingEmails(!onboardingEmails)}
            className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              onboardingEmails ? "bg-[var(--accent)]" : "bg-[var(--bg-elev)] border border-[var(--border)]"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                onboardingEmails ? "translate-x-3.5" : "translate-x-0.5"
              } mt-0.5`}
            />
          </button>
        </div>

        {/* Item 3: Follow @sprintsync */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[13px] font-medium text-[var(--text)]">
              Follow @sprintsync
            </h2>
          </div>
          <a
            href="https://x.com"
            target="_blank"
            rel="noreferrer"
            className="flex h-6 w-6 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] text-[var(--text-3)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors duration-100 ease-out"
          >
            {/* X Logo */}
            <svg
              className="h-3 w-3 fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        </div>
      </div>

      {/* Action (Finish) */}
      <div className="flex items-center justify-end pt-2">
        <button
          type="button"
          onClick={handleFinish}
          disabled={isFinishing}
          className="flex h-8 items-center justify-center rounded-full bg-[var(--bg-elev)] border border-[var(--border)] px-5 text-[13px] font-medium text-[var(--text)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-strong)] transition-colors duration-100 ease-out disabled:opacity-50 cursor-pointer"
        >
          {isFinishing ? (
            <Loader2 className="h-4 w-4 animate-spin text-[var(--text-3)]" strokeWidth={1.5} />
          ) : (
            "Finish"
          )}
        </button>
      </div>
    </div>
  );
}
