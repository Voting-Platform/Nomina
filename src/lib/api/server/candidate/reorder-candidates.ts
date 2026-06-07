"use server";

import { connectDB } from "@/config";
import { Candidate, Election } from "@/models";
import { requireAuth, assertObjectId } from "@/lib/api/server/require-auth";
import { Types } from "mongoose";

export async function reorderCandidates(
  electionId: string,
  orderedIds: string[]
) {
  const user = await requireAuth();
  assertObjectId(electionId, "Election");

  if (!Array.isArray(orderedIds) || orderedIds.length > 100) {
    throw new Error("Invalid candidate list");
  }
  if (orderedIds.some((id) => !Types.ObjectId.isValid(id))) {
    throw new Error("Invalid candidate list");
  }

  await connectDB();

  const election = await Election.findOne({
    _id: electionId,
    deletedAt: null,
  });
  if (!election || election.createdBy.toString() !== user.id) {
    throw new Error("Election not found");
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
