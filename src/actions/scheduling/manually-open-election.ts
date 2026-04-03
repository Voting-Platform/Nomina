"use server";

import { connectDB } from "@/lib/db";
import { Election } from "@/models/Election";
import { getOrSyncDbUser } from "@/actions/user";

/**
 * Manually opens an election for voting.
 * Only works in manual scheduling mode when election is in draft/scheduled status.
 */
export async function manuallyOpenElection(electionId: string) {
  const dbUser = await getOrSyncDbUser();
  if (!dbUser) throw new Error("Unauthorized");

  await connectDB();

  const election = await Election.findOne({
    _id: electionId,
    deletedAt: null,
  });
  if (!election) throw new Error("Election not found");
  if (election.createdBy.toString() !== dbUser._id.toString()) {
    throw new Error("You do not have permission to modify this election");
  }

  if (election.schedulingMode !== "manual") {
    throw new Error("This election uses automatic scheduling");
  }

  if (!["draft", "scheduled"].includes(election.status)) {
    throw new Error("Election is already open or closed");
  }

  election.status = "open";
  election.manuallyOpenedAt = new Date();

  await election.save();

  const result = election.toObject();
  result._id = result._id.toString();
  return result;
}
