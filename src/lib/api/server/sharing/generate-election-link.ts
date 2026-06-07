"use server";

import { connectDB } from "@/config/db";
import { Election } from "@/models/Election";
import { requireAuth, assertObjectId } from "@/lib/api/server/require-auth";

export async function generateElectionLink(electionId: string) {
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

  const link = `${process.env.APP_BASE_URL}/vote/${election.slug}`;
  election.electionLink = link;
  await election.save();

  return { link };
}
