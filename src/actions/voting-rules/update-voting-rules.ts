"use server";

import { connectDB } from "@/lib/db";
import { Election } from "@/models/Election";
import { getOrSyncDbUser } from "@/actions/user";
import type { VotingRulesInput } from "@/types/election";

/**
 * Updates election-level voting rules.
 * Controls max votes per voter, per candidate, and voter visibility.
 */
export async function updateVotingRules(
  electionId: string,
  rules: VotingRulesInput
) {
  const dbUser = await getOrSyncDbUser();
  if (!dbUser) throw new Error("Unauthorized");

  await connectDB();

  const election = await Election.findOne({
    _id: electionId,
    deletedAt: null,
  });
  if (!election) throw new Error("Election not found");
  if (election.createdBy.toString() !== dbUser._id.toString()) {
    throw new Error("You do not have permission to modify this election");
  }

  // Validate rules
  if (rules.maxTotalVotesPerVoter < 1) {
    throw new Error("Max total votes per voter must be at least 1");
  }
  if (rules.maxVotesPerCandidate < 1) {
    throw new Error("Max votes per candidate must be at least 1");
  }
  if (rules.maxVotesPerCandidate > rules.maxTotalVotesPerVoter) {
    throw new Error(
      "Max votes per candidate cannot exceed max total votes per voter"
    );
  }

  election.maxTotalVotesPerVoter = rules.maxTotalVotesPerVoter;
  election.maxVotesPerCandidate = rules.maxVotesPerCandidate;
  election.allowVoterVisibility = rules.allowVoterVisibility;

  await election.save();

  const result = election.toObject();
  result._id = result._id.toString();
  return result;
}
