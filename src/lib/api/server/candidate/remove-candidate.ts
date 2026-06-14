"use server";

import { connectDB } from "@/config";
import { Candidate } from "@/models";
import { requireAuth } from "@/lib/api/server/require-auth";
import { getOwnedElection } from "@/lib/api/server/get-owned-election";
import { removeCandidateSchema } from "@/lib/api/server/validation/candidate-schemas";

export async function removeCandidate(candidateId: string) {
  const user = await requireAuth();

  const parsed = removeCandidateSchema.safeParse({ candidateId });
  if (!parsed.success) throw new Error("Invalid input");

  await connectDB();

  const candidate = await Candidate.findOne({
    _id: parsed.data.candidateId,
    deletedAt: null,
  });
  if (!candidate) throw new Error("Candidate not found");

  await getOwnedElection(candidate.election.toString(), user.id);

  candidate.deletedAt = new Date();
  await candidate.save();

  return { success: true };
}
