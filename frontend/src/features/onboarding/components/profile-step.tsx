"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { profileApi } from "@/features/onboarding/api/profile-api";
import { useAuthStore } from "@/store/useAuthStore";
import { ApiError } from "@/lib/api-client";
import { profileSchema } from "@/lib/schemas/profile.schema";
import { Loader2 } from "lucide-react";

interface ProfileStepProps {
  onNext?: () => void;
  onSkip?: () => void;
}

export function ProfileStep({ onNext, onSkip }: ProfileStepProps) {
  const router = useRouter();
  const { user, setUser, isAuthenticated, isLoading } = useAuthStore();

  const [name, setName] = useState(user?.name || "");
  const [title, setTitle] = useState(user?.title || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auth guard: redirect to login if unauthenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Sync state once user is hydrated from backend cookie session
  useEffect(() => {
    if (user?.name && !name) {
      setName(user.name);
    }
    if (user?.title && !title) {
      setTitle(user.title);
    }
  }, [user]);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();

    const parseResult = profileSchema.safeParse({
      name: name.trim(),
      title: title.trim(),
    });

    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues[0]?.message || "Please enter a valid name";
      toast.error(errorMsg);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await profileApi.update({
        name: name.trim(),
        title: title.trim() || "",
      });

      if (res.user) {
        setUser(res.user);
      }

      toast.success("Profile updated");
      if (onNext) {
        onNext();
      } else {
        router.replace("/");
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update profile");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      // Mark profile step passed so user is not stuck on onboarding
      const res = await profileApi.update({
        name: (name || user?.name || "User").trim(),
        title: "",
      });
      if (res.user) {
        setUser(res.user);
      }
      if (onSkip) {
        onSkip();
      } else if (onNext) {
        onNext();
      } else {
        router.replace("/");
      }
    } catch {
      if (onSkip) {
        onSkip();
      } else if (onNext) {
        onNext();
      } else {
        router.replace("/");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--text-3)]" strokeWidth={1.5} />
      </div>
    );
  }

  const userInitial = (name || user?.name || "U").charAt(0).toUpperCase();

  return (
    <div>
      {/* Title & Subtitle */}
      <div className="mb-6">
        <h1 className="text-[16px] font-medium text-[var(--text)] tracking-tight">
          Set up your profile
        </h1>
        <p className="mt-1 text-[13px] text-[var(--text-3)]">
          Choose how you&apos;ll appear in SprintSync
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleContinue} className="space-y-4">
        {/* Field 1: Name & Initial badge (No picture upload) */}
        <div>
          <label className="block text-[12px] font-medium text-[var(--text-3)] mb-1">
            Name &amp; picture
          </label>
          <div className="flex h-8 w-full items-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-2 focus-within:border-[var(--accent)] focus-within:ring-1 focus-within:ring-[var(--accent)] transition-colors duration-100 ease-out">
            {/* Visual avatar circle matching screenshot */}
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f59e0b] text-[11px] font-medium text-[#08090a] select-none mr-2">
              {userInitial}
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              disabled={isSubmitting}
              className="flex-1 bg-transparent text-[13px] text-[var(--text)] placeholder:text-[var(--text-4)] focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>

        {/* Field 2: Title */}
        <div>
          <label className="block text-[12px] font-medium text-[var(--text-3)] mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Software engineer"
            disabled={isSubmitting}
            className="h-8 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-2.5 text-[13px] text-[var(--text)] placeholder:text-[var(--text-4)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors duration-100 ease-out disabled:opacity-50"
          />
        </div>

        {/* Actions (Skip & Continue) */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="h-8 px-3 text-[13px] font-normal text-[var(--text-4)] transition-colors duration-100 ease-out hover:text-[var(--text-2)] disabled:opacity-50 cursor-pointer"
          >
            Skip
          </button>
          <button
            type="submit"
            disabled={!name.trim() || isSubmitting}
            className={`flex h-8 items-center justify-center rounded-[var(--radius)] px-4 text-[13px] font-medium transition-colors duration-100 ease-out ${
              name.trim() && !isSubmitting
                ? "bg-[var(--accent)] text-[var(--text)] hover:bg-[var(--accent-hover)] cursor-pointer"
                : "border border-[var(--border)] bg-[var(--bg-elev)] text-[var(--text-4)] cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin text-[var(--text-3)]" strokeWidth={1.5} />
            ) : (
              "Continue"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
