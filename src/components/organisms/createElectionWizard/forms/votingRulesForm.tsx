"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { VotingRulesInput } from "@/types/election";

interface VotingRulesFormProps {
  rules: VotingRulesInput;
  onRulesChange: (rules: VotingRulesInput) => void;
  errors?: Record<string, string>;
}

export function VotingRulesForm({ rules, onRulesChange, errors }: VotingRulesFormProps) {
  return (
    <div className="space-y-6">
      {errors?.votingRules && (
        <p className="text-xs text-[var(--destructive)] bg-[var(--destructive-light)] px-3 py-2 rounded-lg">
          {errors.votingRules}
        </p>
      )}
      {/* Max total votes per voter */}
      <div className="space-y-2">
        <Label htmlFor="max-total-votes">Max total votes per voter</Label>
        <p className="text-xs text-[var(--text-muted)]">
          How many total votes can each voter cast across all candidates?
        </p>
        <Input
          id="max-total-votes"
          type="number"
          min={1}
          max={100}
          value={rules.maxTotalVotesPerVoter}
          onChange={(e) =>
            onRulesChange({
              ...rules,
              maxTotalVotesPerVoter: Math.max(1, parseInt(e.target.value) || 1),
            })
          }
          className="w-32"
        />
      </div>

      {/* Max votes per candidate */}
      <div className="space-y-2">
        <Label htmlFor="max-votes-candidate">Max votes per candidate</Label>
        <p className="text-xs text-[var(--text-muted)]">
          How many votes can a single voter give to one candidate?
        </p>
        <Input
          id="max-votes-candidate"
          type="number"
          min={1}
          max={rules.maxTotalVotesPerVoter}
          value={rules.maxVotesPerCandidate}
          onChange={(e) =>
            onRulesChange({
              ...rules,
              maxVotesPerCandidate: Math.max(1, parseInt(e.target.value) || 1),
            })
          }
          className="w-32"
        />
      </div>

      <p className="text-xs text-[var(--text-muted)]">
        Voter privacy options (anonymity, collecting details) are configured in
        the next step.
      </p>
    </div>
  );
}
