"use server";

import { connectDB } from "@/lib/db";
import { Election } from "@/models/Election";
import { getOrSyncDbUser } from "@/actions/user";

/**
 * Soft-deletes an election by setting deletedAt.
 * Only the election creator can delete.
 */
export async function deleteElection(electionId: string) {
  const dbUser = await getOrSyncDbUser();
  if (!dbUser) throw new Error("Unauthorized");

  await connectDB();

  const election = await Election.findOne({
    _id: electionId,
    deletedAt: null,
  });

  if (!election) throw new Error("Election not found");

  if (election.createdBy.toString() !== dbUser._id.toString()) {
    throw new Error("You do not have permission to delete this election");
  }

  election.deletedAt = new Date();
  await election.save();

  return { success: true };
}
