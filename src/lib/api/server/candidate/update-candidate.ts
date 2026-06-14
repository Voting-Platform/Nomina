"use server";

import { connectDB } from "@/config";
import { Candidate } from "@/models";
import { requireAuth } from "@/lib/api/server/require-auth";
import { getOwnedElection } from "@/lib/api/server/get-owned-election";
import { updateCandidateSchema } from "@/lib/api/server/validation/candidate-schemas";
import { serialize } from "@/lib";
import type { UpdateCandidateInput } from "@/types";

export async function updateCandidate(
  candidateId: string,
  data: UpdateCandidateInput
) {
  const user = await requireAuth();

  const parsed = updateCandidateSchema.safeParse({ candidateId, ...data });
  if (!parsed.success) throw new Error("Invalid candidate data");

  await connectDB();

  const candidate = await Candidate.findOne({
    _id: parsed.data.candidateId,
    deletedAt: null,
  });
  if (!candidate) throw new Error("Candidate not found");

  // Ownership check (throws "Election not found" on foreign elections)
  await getOwnedElection(candidate.election.toString(), user.id);

  if (parsed.data.name !== undefined) candidate.name = parsed.data.name;
  if (parsed.data.description !== undefined) {
    candidate.description = parsed.data.description;
  }
  if (parsed.data.imageUrl !== undefined) {
    candidate.imageUrl =
      parsed.data.imageUrl === null || parsed.data.imageUrl === ""
        ? null
        : parsed.data.imageUrl;
  }

  await candidate.save();

  return serialize(candidate.toObject());
}
