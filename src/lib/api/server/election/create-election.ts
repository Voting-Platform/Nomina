"use server";

import { connectDB } from "@/config/db";
import { Election } from "@/models/Election";
import { Candidate } from "@/models/Candidate";
import { getOrSyncDbUser } from "@/lib/api/server/user";
import type { CreateElectionInput } from "@/types/election";

/**
 * Creates a new election with candidates in a single operation.
 * Generates a unique slug and shareable link.
 */
export async function createElection(data: CreateElectionInput) {
  const dbUser = await getOrSyncDbUser();
  if (!dbUser) throw new Error("Unauthorized");

  await connectDB();

  // Generate URL-friendly slug from title
  const baseSlug = data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const uniqueSuffix = Date.now().toString(36);
  const slug = `${baseSlug}-${uniqueSuffix}`;

  // Create the election
  const election = await Election.create({
    title: data.title,
    description: data.description || "",
    slug,
    createdBy: dbUser._id,
    status: "draft",

    // Voting rules
    maxTotalVotesPerVoter: data.votingRules.maxTotalVotesPerVoter,
    maxVotesPerCandidate: data.votingRules.maxVotesPerCandidate,
    allowVoterVisibility: data.votingRules.allowVoterVisibility,

    // Voter base
    voterBaseMode: data.voterBase.mode,
    allowedVoterEmails: data.voterBase.emails || [],
    allowedVoterDomains: data.voterBase.domains || [],

    // Scheduling
    schedulingMode: data.scheduling.mode,
    scheduledStartAt: data.scheduling.scheduledStartAt ? new Date(data.scheduling.scheduledStartAt) : null,
    scheduledEndAt: data.scheduling.scheduledEndAt ? new Date(data.scheduling.scheduledEndAt) : null,

    // Generate election link
    electionLink: `${process.env.APP_BASE_URL}/vote/${slug}`,
  });

  // Create candidates in bulk
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

  // If scheduling mode is automatic, set status based on timing
  if (
    data.scheduling.mode === "automatic" &&
    data.scheduling.scheduledStartAt &&
    data.scheduling.scheduledEndAt
  ) {
    const startAt = new Date(data.scheduling.scheduledStartAt);
    const endAt = new Date(data.scheduling.scheduledEndAt);
    const now = new Date();

    if (startAt.getTime() < now.getTime() - 60 * 1000) {
      throw new Error("Start time cannot be in the past");
    }

    if (startAt >= endAt) {
      throw new Error("Start time must be before end time");
    }

    if (startAt > now) {
      election.status = "scheduled";
    } else if (endAt > now) {
      election.status = "open";
      election.manuallyOpenedAt = now;
    } else {
      election.status = "closed";
      election.manuallyClosedAt = now;
    }
    await election.save();
  }

  return { _id: election._id.toString() };
}
