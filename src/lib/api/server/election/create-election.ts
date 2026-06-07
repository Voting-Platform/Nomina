"use server";

import { connectDB } from "@/config";
import { Candidate, Election } from "@/models/";
import { requireAuth } from "@/lib/api/server/require-auth";
import { CreateElectionSchema } from "@/lib/api/server/schemas";
import type { CreateElectionInput } from "@/types";

export async function createElection(data: CreateElectionInput) {
  const user = await requireAuth();
  CreateElectionSchema.parse(data);

  await connectDB();

  const baseSlug = data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const uniqueSuffix = Date.now().toString(36);
  const slug = `${baseSlug}-${uniqueSuffix}`;

  const election = await Election.create({
    title: data.title,
    description: data.description || "",
    slug,
    createdBy: user.id,
    status: "draft",

    maxTotalVotesPerVoter: data.votingRules.maxTotalVotesPerVoter,
    maxVotesPerCandidate: data.votingRules.maxVotesPerCandidate,
    allowVoterVisibility: data.votingRules.allowVoterVisibility,

    voterBaseMode: data.voterBase.mode,
    allowedVoterEmails: data.voterBase.emails || [],
    allowedVoterDomains: data.voterBase.domains || [],

    schedulingMode: data.scheduling.mode,
    scheduledStartAt: data.scheduling.scheduledStartAt || null,
    scheduledEndAt: data.scheduling.scheduledEndAt || null,

    electionLink: `${process.env.APP_BASE_URL}/vote/${slug}`,
  });

  if (data.candidates.length > 0) {
    const candidateDocs = data.candidates.map((c, index) => ({
      election: election._id,
      name: c.name,
      description: c.description || "",
      imageUrl: c.imageUrl || null,
      position: index,
    }));
    await Candidate.insertMany(candidateDocs);
  }

  if (
    data.scheduling.mode === "automatic" &&
    data.scheduling.scheduledStartAt
  ) {
    const startTime = new Date(data.scheduling.scheduledStartAt);
    if (startTime > new Date()) {
      election.status = "scheduled";
      await election.save();
    }
  }

  return { _id: election._id.toString() };
}
