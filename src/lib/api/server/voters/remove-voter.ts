"use server";

import { requireAuth } from "@/lib/api/server/require-auth";
import { getOwnedElection } from "@/lib/api/server/get-owned-election";
import { removeVoterSchema } from "@/lib/api/server/validation/voters-schemas";
import { VoterToken } from "@/models";

export async function removeVoter(electionId: string, voterId: string) {
  const user = await requireAuth();

  const parsed = removeVoterSchema.safeParse({ electionId, voterId });
  if (!parsed.success) throw new Error("Invalid input");

  const election = await getOwnedElection(parsed.data.electionId, user.id);

  const voter = await VoterToken.findOne({
    _id: parsed.data.voterId,
    election: election._id,
  });

  if (!voter) throw new Error("Voter not found");
  if (voter.exhaustedAt) {
    throw new Error("This voter has already voted and cannot be removed.");
  }

  await voter.deleteOne();

  return { success: true };
}
