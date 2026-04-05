"use server";

import { connectDB } from "@/lib/db";
import { Election } from "@/models/Election";
import { Candidate } from "@/models/Candidate";
import { getOrSyncDbUser } from "@/actions/user";
import { serialize } from "@/lib/serialize";
import type { CreateCandidateInput } from "@/types/election";

/**
 * Adds a new candidate to an election.
 * Auto-assigns position at the end of the list.
 */
export async function addCandidate(
  electionId: string,
  data: CreateCandidateInput
) {
  const dbUser = await getOrSyncDbUser();
  if (!dbUser) throw new Error("Unauthorized");

  await connectDB();

  // Verify election ownership
  const election = await Election.findOne({
    _id: electionId,
    deletedAt: null,
  });
  if (!election) throw new Error("Election not found");
  if (election.createdBy.toString() !== dbUser._id.toString()) {
    throw new Error("You do not have permission to modify this election");
  }

  // Get next position
  const lastCandidate = await Candidate.findOne({
    election: electionId,
    deletedAt: null,
  })
    .sort({ position: -1 })
    .lean();

  const nextPosition = lastCandidate ? lastCandidate.position + 1 : 0;

  const candidate = await Candidate.create({
    election: electionId,
    name: data.name,
    description: data.description || "",
    imageUrl: data.imageUrl || null,
    position: nextPosition,
  });

  return serialize(candidate.toObject());
}
