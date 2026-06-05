"use server";

import { connectDB } from "@/config";
import { Candidate, Election } from "@/models";
import { requireAuth } from "@/lib/api/server/require-auth";
import { serialize } from "@/lib";
import type { UpdateCandidateInput } from "@/types";

export async function updateCandidate(
  candidateId: string,
  data: UpdateCandidateInput
) {
  const user = await requireAuth();

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
  if (!election) throw new Error("Election not found");

  if (election.createdBy.toString() !== user.id) {
    throw new Error("Forbidden");
  }

  if (data.name !== undefined) candidate.name = data.name;
  if (data.description !== undefined) candidate.description = data.description;
  if (data.imageUrl !== undefined) {
    candidate.imageUrl =
      data.imageUrl === null || data.imageUrl === "" ? null : data.imageUrl;
  }

  await candidate.save();

  return serialize(candidate.toObject());
}
