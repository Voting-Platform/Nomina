import { CheckCircle2 } from "lucide-react";

interface VoteSuccessProps {
  electionTitle: string;
}

export function VoteSuccess({ electionTitle }: VoteSuccessProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--secondary)]/10 mb-6">
        <CheckCircle2 className="h-8 w-8 text-[var(--secondary)]" />
      </div>
      <p className="text-sm font-medium text-[var(--text-muted)] mb-2">
        {electionTitle}
      </p>
      <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
        Vote recorded!
      </h1>
      <p className="text-sm text-[var(--text-secondary)] max-w-sm">
        Thank you for participating. Your vote has been securely recorded.
      </p>
    </div>
  );
}
