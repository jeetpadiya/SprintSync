"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { getPostAuthPath } from "@/lib/auth-routing";
import { WorkspaceDashboard } from "@/features/workspaces/components/workspace-dashboard";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ArrowRight, CheckCircle2, Terminal, Cpu, Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const target = getPostAuthPath(user);
      if (target !== "/") {
        router.push(target);
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Prevent landing-page flash while AuthHydration checks/refreshes the cookie session
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] text-[var(--text-3)]">
        <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.5} />
      </div>
    );
  }

  // If user is authenticated and setup is completed, render the full workspace dashboard
  if (isAuthenticated) {
    return <WorkspaceDashboard />;
  }

  // Public Landing Page for unauthenticated visitors
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        {/* Version Tag */}
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] px-2.5 py-1 text-[12px] text-[var(--text-3)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
          <span>SprintSync 1.0</span>
        </div>

        {/* Headline */}
        <h1 className="max-w-2xl text-[28px] font-medium leading-snug tracking-tight text-[var(--text)] sm:text-[34px]">
          Issue tracking built for velocity
        </h1>

        {/* Subhead */}
        <p className="mt-2.5 max-w-lg text-[13px] text-[var(--text-3)]">
          Keyboard-centric issue tracking, automated cycles, and real-time collaboration with sub-50ms latency.
        </p>

        {/* Primary / Secondary CTAs */}
        <div className="mt-6 flex items-center gap-2">
          <Link
            href="/register"
            className="flex h-8 items-center gap-1.5 rounded-[var(--radius)] bg-[var(--accent)] px-3 text-[13px] font-medium text-[var(--text)] transition-colors duration-100 ease-out hover:bg-[var(--accent-hover)]"
          >
            Get started
            <ArrowRight className="h-3.5 w-3.5 text-[var(--text)]" strokeWidth={1.5} />
          </Link>
          <Link
            href="/login"
            className="flex h-8 items-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] px-3 text-[13px] font-normal text-[var(--text-2)] transition-colors duration-100 ease-out hover:bg-[var(--bg-hover)] hover:border-[var(--border-strong)]"
          >
            Log in
          </Link>
        </div>

        {/* Dense Technical Features Grid */}
        <div className="mt-14 grid w-full max-w-4xl grid-cols-1 gap-3 sm:grid-cols-3 text-left">
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] p-4">
            <div className="mb-2.5 flex h-7 w-7 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)]">
              <Terminal className="h-4 w-4 text-[var(--text-3)]" strokeWidth={1.5} />
            </div>
            <h2 className="text-[13px] font-medium text-[var(--text)]">Keyboard navigation</h2>
            <p className="mt-1 text-[12px] text-[var(--text-3)] leading-relaxed">
              Global shortcuts and command menu for all issue operations without touching a mouse.
            </p>
          </div>

          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] p-4">
            <div className="mb-2.5 flex h-7 w-7 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)]">
              <Cpu className="h-4 w-4 text-[var(--text-3)]" strokeWidth={1.5} />
            </div>
            <h2 className="text-[13px] font-medium text-[var(--text)]">Optimistic mutations</h2>
            <p className="mt-1 text-[12px] text-[var(--text-3)] leading-relaxed">
              Updates render immediately on the client and synchronize in the background.
            </p>
          </div>

          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] p-4">
            <div className="mb-2.5 flex h-7 w-7 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)]">
              <CheckCircle2 className="h-4 w-4 text-[var(--text-3)]" strokeWidth={1.5} />
            </div>
            <h2 className="text-[13px] font-medium text-[var(--text)]">Automated cycles</h2>
            <p className="mt-1 text-[12px] text-[var(--text-3)] leading-relaxed">
              Two-week sprint cadences with automated backlog rollover and burndown metrics.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
