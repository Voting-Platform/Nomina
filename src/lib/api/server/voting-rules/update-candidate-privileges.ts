"use server";

import { connectDB } from "@/config";
import { Candidate, Election } from "@/models";
import { requireAuth, assertObjectId } from "@/lib/api/server/require-auth";
import type { CandidatePrivilegesInput } from "@/types";

export async function updateCandidatePrivileges(
  candidateId: string,
  privileges: CandidatePrivilegesInput
) {
  const user = await requireAuth();
  assertObjectId(candidateId, "Candidate");

  await connectDB();

  const candidate = await Candidate.findOne({
    _id: candidateId,
    deletedAt: null,
  });
  if (!candidate) throw new Error("Candidate not found");

  const election = await Election.findOne({
    _id: candidate.election,
    deletedAt: null,
  });
  if (!election || election.createdBy.toString() !== user.id) {
    throw new Error("Election not found");
  }

  if (
    privileges.maxVotesReceivable !== null &&
    privileges.maxVotesReceivable < 1
  ) {
    throw new Error("Max votes receivable must be at least 1 or null (unlimited)");
  }

  candidate.maxVotesReceivable = privileges.maxVotesReceivable;
  candidate.isEligibleForVoting = privileges.isEligibleForVoting;

  await candidate.save();

  const result = candidate.toObject();
  result._id = result._id.toString();
  result.election = result.election.toString();
  return result;
}
