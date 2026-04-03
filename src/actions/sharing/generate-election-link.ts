"use server";

import { connectDB } from "@/lib/db";
import { Election } from "@/models/Election";
import { getOrSyncDbUser } from "@/actions/user";

/**
 * Generates (or regenerates) a shareable election link.
 * Updates the election's slug and electionLink field.
 */
export async function generateElectionLink(electionId: string) {
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

  // Generate fresh link with current slug
  const link = `${process.env.APP_BASE_URL}/vote/${election.slug}`;
  election.electionLink = link;
  await election.save();

  return { link };
}
