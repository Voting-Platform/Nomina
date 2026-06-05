"use server";

import { connectDB } from "@/config";
import { Election } from "@/models";
import { requireAuth } from "@/lib/api/server/require-auth";
import type { UpdateElectionInput } from "@/types";

export async function updateElection(
  electionId: string,
  data: UpdateElectionInput
) {
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

  if (data.title !== undefined) election.title = data.title;
  if (data.description !== undefined) election.description = data.description;
  if (data.voterBaseMode !== undefined)
    election.voterBaseMode = data.voterBaseMode;
  if (data.allowedVoterEmails !== undefined)
    election.allowedVoterEmails = data.allowedVoterEmails;
  if (data.allowedVoterDomains !== undefined)
    election.allowedVoterDomains = data.allowedVoterDomains;

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
