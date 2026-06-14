"use server";

import { connectDB } from "@/config";
import { Candidate } from "@/models";
import { requireAuth } from "@/lib/api/server/require-auth";
import { getOwnedElection } from "@/lib/api/server/get-owned-election";
import { candidatePrivilegesSchema } from "@/lib/api/server/validation/candidate-schemas";
import { serialize } from "@/lib";
import type { CandidatePrivilegesInput } from "@/types";

export async function updateCandidatePrivileges(
  candidateId: string,
  privileges: CandidatePrivilegesInput
) {
  const user = await requireAuth();

  const parsed = candidatePrivilegesSchema.safeParse({
    candidateId,
    ...privileges,
  });
  if (!parsed.success) throw new Error("Invalid candidate privileges");

  await connectDB();

  const candidate = await Candidate.findOne({
    _id: parsed.data.candidateId,
    deletedAt: null,
  });
  if (!candidate) throw new Error("Candidate not found");

  await getOwnedElection(candidate.election.toString(), user.id);

  candidate.maxVotesReceivable = parsed.data.maxVotesReceivable;
  candidate.isEligibleForVoting = parsed.data.isEligibleForVoting;

  await candidate.save();

  return serialize(candidate.toObject());
}
