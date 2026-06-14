import Link from "next/link";
import { Vote } from "lucide-react";

export default function VoteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      {/* Minimal public header */}
      <header className="flex items-center justify-center h-14 border-b border-[var(--border)] bg-[var(--surface)]">
        <Link href="/" className="flex items-center gap-2 text-[var(--text-primary)]">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary)] text-white">
            <Vote className="h-3.5 w-3.5" />
          </span>
          <span className="text-sm font-semibold tracking-wide">Nomina</span>
        </Link>
      </header>

      <main className="flex-1 flex flex-col justify-center max-w-2xl w-full mx-auto">
        {children}
      </main>

      <footer className="py-4 text-center text-xs text-[var(--text-muted)]">
        Powered by Nomina — secure online voting
      </footer>
    </div>
  );
}
