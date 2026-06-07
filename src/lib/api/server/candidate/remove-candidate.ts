"use server";

import { connectDB } from "@/config";
import { Candidate, Election } from "@/models";
import { requireAuth, assertObjectId } from "@/lib/api/server/require-auth";

export async function removeCandidate(candidateId: string) {
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

  candidate.deletedAt = new Date();
  await candidate.save();

  return { success: true };
}
