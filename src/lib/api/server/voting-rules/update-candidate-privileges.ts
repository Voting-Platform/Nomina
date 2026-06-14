"use server";

import { connectDB } from "@/config/db";
import { Election } from "@/models/Election";
import { Candidate } from "@/models/Candidate";
import { getOrSyncDbUser } from "@/lib/api/server/user";
import { serialize } from "@/lib/serialize";
import type { CandidatePrivilegesInput } from "@/types/election";

/**
 * Updates per-candidate voting privileges.
 * Sets max receivable votes and eligibility for a specific candidate.
 */
export async function updateCandidatePrivileges(
  candidateId: string,
  privileges: CandidatePrivilegesInput
) {
  const dbUser = await getOrSyncDbUser();
  if (!dbUser) throw new Error("Unauthorized");

  await connectDB();

  const candidate = await Candidate.findOne({
    _id: candidateId,
    deletedAt: null,
  });
  if (!candidate) throw new Error("Candidate not found");

  // Verify election ownership
  const election = await Election.findOne({
    _id: candidate.election,
    deletedAt: null,
  });
  if (!election) throw new Error("Election not found");
  if (election.createdBy.toString() !== dbUser._id.toString()) {
    throw new Error("You do not have permission to modify this election");
  }
  if (["open", "closed", "archived"].includes(election.status)) {
    throw new Error("Cannot modify candidate privileges once the election has started");
  }

  // Validate
  if (
    privileges.maxVotesReceivable !== null &&
    privileges.maxVotesReceivable < 1
  ) {
    throw new Error("Max votes receivable must be at least 1 or null (unlimited)");
  }

  candidate.maxVotesReceivable = privileges.maxVotesReceivable;
  candidate.isEligibleForVoting = privileges.isEligibleForVoting;

  await candidate.save();

  return serialize(candidate.toObject());
}
