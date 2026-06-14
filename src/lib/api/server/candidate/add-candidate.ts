"use server";

import { connectDB } from "@/config";
import { Candidate } from "@/models";
import { requireAuth } from "@/lib/api/server/require-auth";
import { getOwnedElection } from "@/lib/api/server/get-owned-election";
import { addCandidateSchema } from "@/lib/api/server/validation/candidate-schemas";
import { serialize } from "@/lib";
import type { CreateCandidateInput } from "@/types";

export async function addCandidate(
  electionId: string,
  data: CreateCandidateInput
) {
  const user = await requireAuth();

  const parsed = addCandidateSchema.safeParse({ electionId, ...data });
  if (!parsed.success) throw new Error("Invalid candidate data");

  await connectDB();
  const election = await getOwnedElection(parsed.data.electionId, user.id);

  const lastCandidate = await Candidate.findOne({
    election: election._id,
    deletedAt: null,
  })
    .sort({ position: -1 })
    .lean();

  const nextPosition = lastCandidate ? lastCandidate.position + 1 : 0;

  const candidate = await Candidate.create({
    election: election._id,
    name: parsed.data.name,
    description: parsed.data.description || "",
    imageUrl: parsed.data.imageUrl || null,
    position: nextPosition,
  });

  return serialize(candidate.toObject());
}
