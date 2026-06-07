"use server";

import { connectDB } from "@/config";
import { Election } from "@/models";
import { requireAuth, assertObjectId } from "@/lib/api/server/require-auth";

export async function manuallyCloseElection(electionId: string) {
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

  if (election.schedulingMode !== "manual") {
    throw new Error("This election uses automatic scheduling");
  }

  if (election.status !== "open") {
    throw new Error("Election is not currently open");
  }

  election.status = "closed";
  election.manuallyClosedAt = new Date();

  await election.save();

  const result = election.toObject();
  result._id = result._id.toString();
  return result;
}
