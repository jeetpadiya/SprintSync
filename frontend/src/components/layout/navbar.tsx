"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { Layers } from "lucide-react";

export function Navbar() {
  const { user, isAuthenticated } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--bg)]">
      <div className="mx-auto flex h-11 max-w-6xl items-center justify-between px-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 text-[var(--text)] transition-colors duration-100 ease-out hover:text-white">
          <Layers className="h-4 w-4 text-[var(--text-3)]" strokeWidth={1.5} />
          <span className="text-[13px] font-medium tracking-tight">
            SprintSync
          </span>
        </Link>

        {/* Actions */}
        <nav className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2.5">
              <span className="text-[13px] text-[var(--text-3)]">
                {user.email}
              </span>
              <div className="flex h-6 w-6 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] text-[12px] font-medium text-[var(--text-2)]">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                href="/login"
                className="h-7 px-2.5 text-[13px] font-normal text-[var(--text-3)] transition-colors duration-100 ease-out hover:text-[var(--text)] flex items-center"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="h-7 px-3 text-[13px] font-medium text-[var(--text)] bg-[var(--accent)] hover:bg-[var(--accent-hover)] rounded-[var(--radius)] transition-colors duration-100 ease-out flex items-center"
              >
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
