"use server";

import { connectDB } from "@/config";
import { Election, Candidate } from "@/models";
import { requireAuth, assertObjectId } from "@/lib/api/server/require-auth";
import { CreateCandidateSchema } from "@/lib/api/server/schemas";
import { serialize } from "@/lib";
import type { CreateCandidateInput } from "@/types";

export async function addCandidate(
  electionId: string,
  data: CreateCandidateInput
) {
  const user = await requireAuth();
  assertObjectId(electionId, "Election");
  CreateCandidateSchema.parse(data);

  await connectDB();

  const election = await Election.findOne({
    _id: electionId,
    deletedAt: null,
  });
  if (!election || election.createdBy.toString() !== user.id) {
    throw new Error("Election not found");
  }

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
