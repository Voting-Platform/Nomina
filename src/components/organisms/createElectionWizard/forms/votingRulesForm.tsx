"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { VotingRulesInput } from "@/types/election";

interface VotingRulesFormProps {
  rules: VotingRulesInput;
  onRulesChange: (rules: VotingRulesInput) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

export function VotingRulesForm({ rules, onRulesChange, errors, disabled }: VotingRulesFormProps) {
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
          value={rules.maxTotalVotesPerVoter === 0 ? "" : rules.maxTotalVotesPerVoter}
          onChange={(e) => {
            const val = e.target.value;
            onRulesChange({
              ...rules,
              maxTotalVotesPerVoter: val === "" ? 0 : (parseInt(val) || 0),
            });
          }}
          disabled={disabled}
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
          max={rules.maxTotalVotesPerVoter || 1}
          value={rules.maxVotesPerCandidate === 0 ? "" : rules.maxVotesPerCandidate}
          onChange={(e) => {
            const val = e.target.value;
            onRulesChange({
              ...rules,
              maxVotesPerCandidate: val === "" ? 0 : (parseInt(val) || 0),
            });
          }}
          disabled={disabled}
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
