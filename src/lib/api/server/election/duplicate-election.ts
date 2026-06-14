"use server";

import { connectDB } from "@/config";
import { Candidate, Election } from "@/models";
import { requireAuth } from "@/lib/api/server/require-auth";
import { generateSixDigitCode } from "@/lib/api/server/voting/hash";

export async function duplicateElection(electionId: string) {
  const user = await requireAuth();

  await connectDB();

  const original = await Election.findOne({
    _id: electionId,
    deletedAt: null,
  }).lean();

  if (!original || original.createdBy.toString() !== user.id) {
    throw new Error("Election not found");
  }

  const baseSlug = original.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const uniqueSuffix = Date.now().toString(36);
  const slug = `${baseSlug}-copy-${uniqueSuffix}`;

  const duplicate = await Election.create({
    title: `${original.title} (Copy)`,
    description: original.description,
    slug,
    createdBy: user.id,
    status: "draft",
    schedulingMode: original.schedulingMode,
    maxTotalVotesPerVoter: original.maxTotalVotesPerVoter,
    maxVotesPerCandidate: original.maxVotesPerCandidate,
    accessType: original.accessType,
    pinEnabled: original.pinEnabled,
    // The copy gets its own PIN; the voter roster/tokens are NOT copied
    pin: original.pinEnabled ? generateSixDigitCode() : null,
    otpRequired: original.otpRequired,
    collectVoterDetails: original.collectVoterDetails,
    revealVoterIdentities: original.revealVoterIdentities,
    emailTemplate: original.emailTemplate,
    electionLink: `${process.env.APP_BASE_URL}/vote/${slug}`,
  });

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
