"use server";

import { connectDB } from "@/config";
import { Election } from "@/models";
import { requireAuth } from "@/lib/api/server/require-auth";

export async function deleteElection(electionId: string) {
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

  election.deletedAt = new Date();
  await election.save();

  return { success: true };
}
