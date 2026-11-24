"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { workspaceApi } from "@/features/workspaces/api/workspace-api";
import { useAuthStore } from "@/store/useAuthStore";
import { ApiError } from "@/lib/api-client";
import { createWorkspaceSchema } from "@/lib/schemas/workspace.schema";
import { ChevronDown, Loader2 } from "lucide-react";

export function CreateWorkspaceForm() {
  const router = useRouter();
  const { user, setUser, isAuthenticated, isLoading } = useAuthStore();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [region, setRegion] = useState<"europe" | "asia">("europe");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user already has a workspace and hasn't finished onboarding, forward to /onboarding
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const hasWorkspaces = (user.workspaces?.length ?? 0) > 0;
      if (hasWorkspaces && (user.title === null || user.title === undefined)) {
        router.replace("/onboarding");
      }
    }
  }, [user, isAuthenticated, isLoading, router]);

  // Auto-generate URL slug as the user types the name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);

    if (!isSlugCustomized) {
      const generatedSlug = newName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generatedSlug);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugCustomized(true);
    const cleanedSlug = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "");
    setSlug(cleanedSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parseResult = createWorkspaceSchema.safeParse({
      name: name.trim(),
      slug: slug.trim(),
      region,
    });

    if (!parseResult.success) {
      const firstError = Object.values(parseResult.error.flatten().fieldErrors)[0]?.[0];
      toast.error(firstError || "Please check your workspace details");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await workspaceApi.create(parseResult.data);

      toast.success("Workspace created", {
        description: res.workspace.name,
      });

      if (user) {
        setUser({
          ...user,
          workspaces: [
            ...(user.workspaces || []),
            { ...res.workspace, role: "ADMIN" },
          ],
        });
      }

      // Redirect to onboarding profile setup
      router.replace("/onboarding");
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create workspace");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = name.trim().length >= 2 && slug.trim().length >= 2;
  const existingWorkspace = user?.workspaces?.[0];

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-[var(--bg)] px-4 py-12 text-[var(--text)]">
      {/* Top spacer */}
      <div />

      {/* Main Workspace Card */}
      <main className="w-full max-w-[340px]">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-[16px] font-medium text-[var(--text)] tracking-tight">
            Create a workspace
          </h1>
          <p className="mt-1 text-[13px] text-[var(--text-3)]">
            Move work forward across teams and agents
          </p>
        </div>

        {/* Existing Workspace Callout (if user already created one) */}
        {existingWorkspace && (
          <div className="mb-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] p-3 text-left">
            <div className="flex items-center justify-between">
              <div className="truncate mr-2">
                <p className="text-[11px] text-[var(--text-4)] uppercase tracking-wider font-medium">
                  Existing workspace
                </p>
                <p className="text-[13px] font-medium text-[var(--text)] truncate">
                  {existingWorkspace.name}
                </p>
              </div>
              <Link
                href={existingWorkspace && !user?.title ? "/onboarding" : "/"}
                className="shrink-0 flex h-7 items-center gap-1 rounded-[var(--radius)] bg-[var(--bg-elev)] border border-[var(--border)] px-2.5 text-[12px] font-medium text-[var(--text-2)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors duration-100 ease-out"
              >
                {!user?.title ? "Continue setup" : "Open"} &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Workspace Name */}
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-3)] mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="Acme Corp"
              autoFocus
              disabled={isSubmitting}
              className="h-8 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-2.5 text-[13px] text-[var(--text)] placeholder:text-[var(--text-4)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors duration-100 ease-out disabled:opacity-50"
            />
          </div>

          {/* Workspace URL (Slug) */}
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-3)] mb-1">
              URL
            </label>
            <div className="flex h-8 w-full items-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-2.5 text-[13px] focus-within:border-[var(--accent)] focus-within:ring-1 focus-within:ring-[var(--accent)] transition-colors duration-100 ease-out">
              <span className="text-[13px] text-[var(--text-4)] select-none">
                sprintsync.app/
              </span>
              <input
                type="text"
                value={slug}
                onChange={handleSlugChange}
                placeholder="acme"
                disabled={isSubmitting}
                className="ml-0.5 flex-1 bg-transparent text-[13px] text-[var(--text)] placeholder:text-[var(--text-4)] focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>

          {/* Region Selector */}
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-3)] mb-1">
              Region
            </label>
            <div className="relative">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as "europe" | "asia")}
                disabled={isSubmitting}
                className="h-8 w-full appearance-none rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-2.5 pr-8 text-[13px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors duration-100 ease-out disabled:opacity-50 cursor-pointer"
              >
                <option value="europe" className="bg-[var(--bg-elev)] text-[var(--text)]">
                  European Union
                </option>
                <option value="asia" className="bg-[var(--bg-elev)] text-[var(--text)]">
                  Asia
                </option>
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-3)]"
                strokeWidth={1.5}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={`mt-2 flex h-8 w-full items-center justify-center rounded-[var(--radius)] text-[13px] font-medium transition-colors duration-100 ease-out ${
              isFormValid && !isSubmitting
                ? "bg-[var(--accent)] text-[var(--text)] hover:bg-[var(--accent-hover)] cursor-pointer"
                : "border border-[var(--border)] bg-[var(--bg-elev)] text-[var(--text-4)] cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin text-[var(--text-3)]" strokeWidth={1.5} />
            ) : (
              "Create workspace"
            )}
          </button>
        </form>
      </main>

      {/* Footer Info */}
      <footer className="text-center text-[12px] leading-relaxed text-[var(--text-4)]">
        <p>Using {user?.email || "jeetpadlya4@gmail.com"}</p>
        <Link
          href="/login"
          className="text-[var(--text-4)] hover:text-[var(--text-2)] transition-colors duration-100 ease-out block mt-0.5"
        >
          Use a different email
        </Link>
      </footer>
    </div>
  );
}
