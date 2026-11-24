"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Link2, Loader2 } from "lucide-react";
import { onboardingApi } from "../api/onboarding-api";
import { useAuthStore } from "@/store/useAuthStore";

interface InviteStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export function InviteStep({ onNext, onSkip }: InviteStepProps) {
  const { user } = useAuthStore();
  const [emailsText, setEmailsText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const workspaceSlug = user?.workspaces?.[0]?.slug || "workspace";

  const handleCopyLink = async () => {
    try {
      const inviteUrl = `${window.location.origin}/invite/${workspaceSlug}`;
      await navigator.clipboard.writeText(inviteUrl);
      toast.success("Invite link copied to clipboard");
    } catch {
      toast.error("Failed to copy invite link");
    }
  };

  const handleSendInvitations = async (e: React.FormEvent) => {
    e.preventDefault();

    const emails = emailsText
      .split(/[\s,]+/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0 && e.includes("@"));

    if (emails.length === 0) {
      onSkip();
      return;
    }

    setIsSubmitting(true);
    try {
      await onboardingApi.sendInvites({
        emails,
        workspaceId: user?.workspaces?.[0]?.id,
      });
      toast.success(
        emails.length === 1
          ? "Invitation sent"
          : `${emails.length} invitations sent`
      );
      onNext();
    } catch {
      toast.error("Failed to send invitations");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Title & Subtitle */}
      <div className="mb-6">
        <h1 className="text-[16px] font-medium text-[var(--text)] tracking-tight">
          Invite teammates
        </h1>
        <p className="mt-1 text-[13px] text-[var(--text-3)]">
          Get your team on SprintSync to start working
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSendInvitations} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[12px] font-medium text-[var(--text-3)]">
              Invitations
            </label>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1 text-[12px] text-[var(--text-3)] hover:text-[var(--text)] transition-colors duration-100 ease-out cursor-pointer"
            >
              <Link2 className="h-3 w-3 rotate-45 text-[var(--text-4)]" strokeWidth={1.5} />
              <span>Copy invite link</span>
            </button>
          </div>

          <textarea
            value={emailsText}
            onChange={(e) => setEmailsText(e.target.value)}
            placeholder="email@gmail.com, email2@gmail.com"
            rows={3}
            disabled={isSubmitting}
            className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] p-2.5 text-[13px] text-[var(--text)] placeholder:text-[var(--text-4)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors duration-100 ease-out resize-none disabled:opacity-50"
          />
        </div>

        {/* Actions (Skip & Send invitations) */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onSkip}
            disabled={isSubmitting}
            className="h-8 px-3 text-[13px] font-normal text-[var(--text-4)] transition-colors duration-100 ease-out hover:text-[var(--text-2)] disabled:opacity-50 cursor-pointer"
          >
            Skip
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-8 items-center justify-center rounded-full bg-[var(--bg-elev)] border border-[var(--border)] px-4 text-[13px] font-medium text-[var(--text)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-strong)] transition-colors duration-100 ease-out disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin text-[var(--text-3)]" strokeWidth={1.5} />
            ) : (
              "Send invitations"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
