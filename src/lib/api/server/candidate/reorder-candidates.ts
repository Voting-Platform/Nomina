"use server";

import { connectDB } from "@/config";
import { Candidate } from "@/models";
import { requireAuth } from "@/lib/api/server/require-auth";
import { getOwnedElection } from "@/lib/api/server/get-owned-election";
import { reorderCandidatesSchema } from "@/lib/api/server/validation/candidate-schemas";

export async function reorderCandidates(
  electionId: string,
  orderedIds: string[]
) {
  const user = await requireAuth();

  const parsed = reorderCandidatesSchema.safeParse({ electionId, orderedIds });
  if (!parsed.success) throw new Error("Invalid input");

  await connectDB();
  const election = await getOwnedElection(parsed.data.electionId, user.id);

  const bulkOps = parsed.data.orderedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id, election: election._id },
      update: { $set: { position: index } },
    },
  }));

  await Candidate.bulkWrite(bulkOps);

  return { success: true };
}
