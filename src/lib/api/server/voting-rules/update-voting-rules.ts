"use server";

import { connectDB } from "@/config";
import { Election } from "@/models";
import { requireAuth, assertObjectId } from "@/lib/api/server/require-auth";
import type { VotingRulesInput } from "@/types";

export async function updateVotingRules(
  electionId: string,
  rules: VotingRulesInput
) {
  const user = await requireAuth();
  assertObjectId(electionId, "Election");

  await connectDB();

  const election = await Election.findOne({
    _id: electionId,
    deletedAt: null,
  });
  if (!election || election.createdBy.toString() !== user.id) {
    throw new Error("Election not found");
  }

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
