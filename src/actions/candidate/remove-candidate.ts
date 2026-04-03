"use server";

import { connectDB } from "@/lib/db";
import { Election } from "@/models/Election";
import { Candidate } from "@/models/Candidate";
import { getOrSyncDbUser } from "@/actions/user";

/**
 * Soft-deletes a candidate by setting deletedAt.
 * Verifies the caller owns the parent election.
 */
export async function removeCandidate(candidateId: string) {
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

  candidate.deletedAt = new Date();
  await candidate.save();

  return { success: true };
}
