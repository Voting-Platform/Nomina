"use server";

import { requireAuth } from "@/lib/api/server/require-auth";
import { getOwnedElection } from "@/lib/api/server/get-owned-election";
import { votingRulesSchema } from "@/lib/api/server/validation/election-schemas";
import { serialize } from "@/lib";
import type { VotingRulesInput } from "@/types";

export async function updateVotingRules(
  electionId: string,
  rules: VotingRulesInput
) {
  const user = await requireAuth();

  const parsed = votingRulesSchema.safeParse(rules);
  if (!parsed.success) throw new Error("Invalid voting rules");

  if (parsed.data.maxVotesPerCandidate > parsed.data.maxTotalVotesPerVoter) {
    throw new Error(
      "Max votes per candidate cannot exceed max total votes per voter"
    );
  }

  const election = await getOwnedElection(electionId, user.id);

  election.maxTotalVotesPerVoter = parsed.data.maxTotalVotesPerVoter;
  election.maxVotesPerCandidate = parsed.data.maxVotesPerCandidate;

  await election.save();

  const result = serialize(election.toObject());
  result._id = election._id.toString();
  return result;
}
