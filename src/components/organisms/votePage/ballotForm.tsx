"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button, CandidateBallotCard } from "@/components";
import { castVotes } from "@/lib/api/server";
import { VoteSuccess } from "./voteSuccess";
import type { PublicElectionData } from "@/types";

interface BallotFormProps {
  election: PublicElectionData;
  /** Personalized-link token (protected elections without a prior gate). */
  token?: string;
}

export function BallotForm({ election, token }: BallotFormProps) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const singleChoice =
    election.maxTotalVotesPerVoter === 1 && election.maxVotesPerCandidate === 1;

  const totalSelected = useMemo(
    () => Object.values(counts).reduce((sum, c) => sum + c, 0),
    [counts]
  );
  const remaining = election.maxTotalVotesPerVoter - totalSelected;

  const handleCountChange = (candidateId: string, count: number) => {
    setCounts((prev) => {
      if (singleChoice) {
        // Selecting a candidate replaces any previous selection
        return count > 0 ? { [candidateId]: 1 } : {};
      }
      const next = { ...prev, [candidateId]: Math.max(0, count) };
      if (next[candidateId] === 0) delete next[candidateId];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (submitting || totalSelected === 0) return;
    setSubmitting(true);
    const selections = Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([candidateId, count]) => ({ candidateId, count }));

    const result = await castVotes(election.slug, selections, token);
    if (result.ok) {
      try {
        localStorage.setItem(`voted:${election._id}`, "1");
      } catch {
        // localStorage unavailable (private mode) — cookie guard still applies
      }
      setSubmitted(true);
      return;
    }
    toast.error(result.error ?? "Could not record your vote.");
    setSubmitting(false);
  };

  if (submitted) {
    return <VoteSuccess electionTitle={election.title} />;
  }

  const sorted = [...election.candidates].sort((a, b) => a.position - b.position);

  return (
    <div className="px-6 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          {election.title}
        </h1>
        {election.description && (
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
            {election.description}
          </p>
        )}
        <p className="text-xs text-[var(--text-muted)] mt-3">
          {singleChoice
            ? "Select one candidate"
            : `You have ${election.maxTotalVotesPerVoter} votes — up to ${election.maxVotesPerCandidate} per candidate`}
        </p>
      </div>

      {/* Candidates */}
      <div
        role={singleChoice ? "radiogroup" : undefined}
        className="space-y-3 max-w-lg mx-auto"
      >
        {sorted.map((candidate) => {
          const current = counts[candidate._id] ?? 0;
          return (
            <CandidateBallotCard
              key={candidate._id}
              candidate={candidate}
              count={current}
              singleChoice={singleChoice}
              maxSelectable={Math.min(
                election.maxVotesPerCandidate,
                current + remaining
              )}
              onCountChange={handleCountChange}
              disabled={submitting}
            />
          );
        })}
      </div>

      {/* Submit */}
      <div className="max-w-lg mx-auto mt-8 space-y-3">
        {!singleChoice && (
          <p className="text-center text-xs text-[var(--text-muted)] tabular-nums">
            {totalSelected} of {election.maxTotalVotesPerVoter} votes used
          </p>
        )}
        <Button
          className="w-full"
          size="lg"
          disabled={submitting || totalSelected === 0}
          onClick={handleSubmit}
        >
          {submitting ? "Submitting..." : "Submit vote"}
        </Button>
        <p className="text-center text-xs text-[var(--text-muted)]">
          You can only submit your ballot once.
        </p>
      </div>
    </div>
  );
}
