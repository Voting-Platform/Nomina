"use server";

import { connectDB } from "@/lib/db";
import { Election } from "@/models/Election";
import { Candidate } from "@/models/Candidate";
import { getOrSyncDbUser } from "@/actions/user";

/**
 * Reorders candidates by updating their position field.
 * Accepts an array of candidate IDs in the desired order.
 */
export async function reorderCandidates(
  electionId: string,
  orderedIds: string[]
) {
  const dbUser = await getOrSyncDbUser();
  if (!dbUser) throw new Error("Unauthorized");

  await connectDB();

  // Verify election ownership
  const election = await Election.findOne({
    _id: electionId,
    deletedAt: null,
  });
  if (!election) throw new Error("Election not found");
  if (election.createdBy.toString() !== dbUser._id.toString()) {
    throw new Error("You do not have permission to modify this election");
  }

  // Batch update positions
  const bulkOps = orderedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id, election: electionId },
      update: { $set: { position: index } },
    },
  }));

  await Candidate.bulkWrite(bulkOps);

  return { success: true };
}
