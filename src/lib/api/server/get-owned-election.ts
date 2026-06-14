import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/config";
import { Election } from "@/models";

/**
 * Loads an election owned by `userId`, or throws "Election not found".
 * Ownership failures intentionally return the same error as missing
 * elections so the API never reveals that an id exists.
 */
export async function getOwnedElection(electionId: string, userId: string) {
  if (!Types.ObjectId.isValid(electionId)) {
    throw new Error("Election not found");
  }

  await connectDB();

  const election = await Election.findOne({
    _id: electionId,
    deletedAt: null,
  });

  if (!election || election.createdBy.toString() !== userId) {
    throw new Error("Election not found");
  }

  return election;
}
