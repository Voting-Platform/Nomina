"use server";

import { connectDB } from "@/lib/db";
import { Election } from "@/models/Election";
import { getOrSyncDbUser } from "@/actions/user";
import type { UpdateElectionInput } from "@/types/election";

/**
 * Updates core election fields (title, description, voter base).
 * Only the election creator can update.
 */
export async function updateElection(
  electionId: string,
  data: UpdateElectionInput
) {
  const dbUser = await getOrSyncDbUser();
  if (!dbUser) throw new Error("Unauthorized");

  await connectDB();

  const election = await Election.findOne({
    _id: electionId,
    deletedAt: null,
  });

  if (!election) throw new Error("Election not found");

  if (election.createdBy.toString() !== dbUser._id.toString()) {
    throw new Error("You do not have permission to edit this election");
  }

  // Apply updates
  if (data.title !== undefined) election.title = data.title;
  if (data.description !== undefined) election.description = data.description;
  if (data.voterBaseMode !== undefined)
    election.voterBaseMode = data.voterBaseMode;
  if (data.allowedVoterEmails !== undefined)
    election.allowedVoterEmails = data.allowedVoterEmails;
  if (data.allowedVoterDomains !== undefined)
    election.allowedVoterDomains = data.allowedVoterDomains;

  // Regenerate slug if title changed
  if (data.title !== undefined) {
    const baseSlug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const uniqueSuffix = Date.now().toString(36);
    election.slug = `${baseSlug}-${uniqueSuffix}`;
    election.electionLink = `${process.env.APP_BASE_URL}/vote/${election.slug}`;
  }

  await election.save();

  return { _id: election._id.toString() };
}
