import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-[var(--border)] bg-[var(--bg)] py-3 text-[12px] text-[var(--text-4)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4">
        <p className="text-[12px]">
          SprintSync. Issue tracking for high-velocity teams.
        </p>
        <div className="flex items-center gap-4">
          <Link href="#" className="transition-colors duration-100 ease-out hover:text-[var(--text-2)]">
            Privacy
          </Link>
          <Link href="#" className="transition-colors duration-100 ease-out hover:text-[var(--text-2)]">
            Terms
          </Link>
          <Link href="#" className="transition-colors duration-100 ease-out hover:text-[var(--text-2)]">
            Docs
          </Link>
        </div>
      </div>
    </footer>
  );
}
