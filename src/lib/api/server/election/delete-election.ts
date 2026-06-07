"use server";

import { connectDB } from "@/config";
import { Election } from "@/models";
import { requireAuth, assertObjectId } from "@/lib/api/server/require-auth";

export async function deleteElection(electionId: string) {
  const user = await requireAuth();
  assertObjectId(electionId, "Election");

  await connectDB();

  const election = await Election.findOne({
    _id: electionId,
    deletedAt: null,
  });

  if (!election || election.createdBy.toString() !== user.id) {
    throw new Error("Election not found");
  }

  election.deletedAt = new Date();
  await election.save();

  return { success: true };
}
