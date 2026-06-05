"use server";

import { connectDB } from "@/config";
import { Candidate, Election } from "@/models";
import { requireAuth } from "@/lib/api/server/require-auth";

export async function reorderCandidates(
  electionId: string,
  orderedIds: string[]
) {
  const user = await requireAuth();

  await connectDB();

  const election = await Election.findOne({
    _id: electionId,
    deletedAt: null,
  });
  if (!election) throw new Error("Election not found");

  if (election.createdBy.toString() !== user.id) {
    throw new Error("Forbidden");
  }

  const bulkOps = orderedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id, election: electionId },
      update: { $set: { position: index } },
    },
  }));

  await Candidate.bulkWrite(bulkOps);

  return { success: true };
}
