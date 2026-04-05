"use server";

import { connectDB } from "@/lib/db";
import { Election } from "@/models/Election";
import { Candidate } from "@/models/Candidate";
import { getOrSyncDbUser } from "@/actions/user";

/**
 * Duplicates an election as a new draft.
 * Copies all settings and candidates but not votes.
 */
export async function duplicateElection(electionId: string) {
  const dbUser = await getOrSyncDbUser();
  if (!dbUser) throw new Error("Unauthorized");

  await connectDB();

  const original = await Election.findOne({
    _id: electionId,
    deletedAt: null,
  }).lean();

  if (!original) throw new Error("Election not found");

  if (original.createdBy.toString() !== dbUser._id.toString()) {
    throw new Error("You do not have permission to duplicate this election");
  }

  // Generate new slug
  const baseSlug = original.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const uniqueSuffix = Date.now().toString(36);
  const slug = `${baseSlug}-copy-${uniqueSuffix}`;

  // Create duplicate election
  const duplicate = await Election.create({
    title: `${original.title} (Copy)`,
    description: original.description,
    slug,
    createdBy: dbUser._id,
    status: "draft",
    schedulingMode: original.schedulingMode,
    maxTotalVotesPerVoter: original.maxTotalVotesPerVoter,
    maxVotesPerCandidate: original.maxVotesPerCandidate,
    allowVoterVisibility: original.allowVoterVisibility,
    voterBaseMode: original.voterBaseMode,
    allowedVoterEmails: original.allowedVoterEmails,
    allowedVoterDomains: original.allowedVoterDomains,
    electionLink: `${process.env.APP_BASE_URL}/vote/${slug}`,
  });

  // Copy candidates
  const originalCandidates = await Candidate.find({
    election: electionId,
    deletedAt: null,
  }).lean();

  if (originalCandidates.length > 0) {
    const candidateDocs = originalCandidates.map((c) => ({
      election: duplicate._id,
      name: c.name,
      description: c.description,
      imageUrl: c.imageUrl,
      position: c.position,
      maxVotesReceivable: c.maxVotesReceivable,
      isEligibleForVoting: c.isEligibleForVoting,
    }));
    await Candidate.insertMany(candidateDocs);
  }

  return { _id: duplicate._id.toString() };
}
