"use server";

import { connectDB } from "@/config";
import { Candidate, Election, VoterToken } from "@/models/";
import { requireAuth } from "@/lib/api/server/require-auth";
import { createElectionSchema } from "@/lib/api/server/validation/election-schemas";
import { generateSixDigitCode } from "@/lib/api/server/voting/hash";
import type { CreateElectionInput } from "@/types";

export async function createElection(data: CreateElectionInput) {
  const user = await requireAuth();

  const parsed = createElectionSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid election data");
  const input = parsed.data;

  await connectDB();

  const baseSlug = input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const uniqueSuffix = Date.now().toString(36);
  const slug = `${baseSlug}-${uniqueSuffix}`;

  const access = input.voterAccess;
  const isPublic = access.accessType === "public";

  const election = await Election.create({
    title: input.title,
    description: input.description || "",
    slug,
    createdBy: user.id,
    status: "draft",

    maxTotalVotesPerVoter: input.votingRules.maxTotalVotesPerVoter,
    maxVotesPerCandidate: input.votingRules.maxVotesPerCandidate,

    accessType: access.accessType,
    pinEnabled: isPublic && access.pinEnabled,
    pin: isPublic && access.pinEnabled ? generateSixDigitCode() : null,
    otpRequired: !isPublic && access.otpRequired,
    collectVoterDetails: access.collectVoterDetails,
    revealVoterIdentities: access.revealVoterIdentities,

    schedulingMode: input.scheduling.mode,
    scheduledStartAt: input.scheduling.scheduledStartAt || null,
    scheduledEndAt: input.scheduling.scheduledEndAt || null,

    electionLink: `${process.env.APP_BASE_URL}/vote/${slug}`,
  });

  if (input.candidates.length > 0) {
    const candidateDocs = input.candidates.map((c, index) => ({
      election: election._id,
      name: c.name,
      description: c.description || "",
      imageUrl: c.imageUrl || null,
      position: index,
    }));
    await Candidate.insertMany(candidateDocs);
  }

  if (access.accessType === "protected" && access.voters.length > 0) {
    // Schema guarantees ≥1 voter and normalized emails; dedupe within payload
    const seen = new Set<string>();
    const voterDocs = access.voters
      .filter((v) => {
        if (seen.has(v.email)) return false;
        seen.add(v.email);
        return true;
      })
      .map((v) => ({
        election: election._id,
        email: v.email,
        name: v.name?.trim() || null,
      }));
    await VoterToken.insertMany(voterDocs);
  }

  if (input.scheduling.mode === "automatic" && input.scheduling.scheduledStartAt) {
    const startTime = new Date(input.scheduling.scheduledStartAt);
    if (startTime > new Date()) {
      election.status = "scheduled";
      await election.save();
    }
  }

  return { _id: election._id.toString() };
}
