import "server-only";
import { connectDB } from "@/config";
import { Candidate, Election, Vote } from "@/models";
import type { PublicElectionData, PublicCandidateData } from "@/types";

/**
 * Loads the voter-facing view of an election by slug.
 * The returned shape is sanitized: it never includes the PIN, the owner,
 * voter emails, or any other owner-only data.
 */
export async function getPublicElection(
  slug: string
): Promise<PublicElectionData | null> {
  await connectDB();

  const election = await Election.findOne({ slug, deletedAt: null }).lean();
  if (!election) return null;

  const candidates = await Candidate.find({
    election: election._id,
    deletedAt: null,
  })
    .sort({ position: 1 })
    .lean();

  // Vote counts are only needed to compute "isFull" for capped candidates.
  const cappedIds = candidates
    .filter((c) => c.maxVotesReceivable !== null)
    .map((c) => c._id);

  const countMap = new Map<string, number>();
  if (cappedIds.length > 0) {
    const counts = await Vote.aggregate([
      { $match: { election: election._id, candidate: { $in: cappedIds } } },
      { $group: { _id: "$candidate", count: { $sum: 1 } } },
    ]);
    for (const c of counts) countMap.set(c._id.toString(), c.count);
  }

  const publicCandidates: PublicCandidateData[] = candidates.map((c) => ({
    _id: c._id.toString(),
    name: c.name,
    description: c.description ?? "",
    imageUrl: c.imageUrl ?? null,
    position: c.position ?? 0,
    isEligibleForVoting: c.isEligibleForVoting !== false,
    isFull:
      c.maxVotesReceivable !== null &&
      (countMap.get(c._id.toString()) ?? 0) >= c.maxVotesReceivable,
  }));

  return {
    _id: election._id.toString(),
    title: election.title,
    description: election.description ?? "",
    slug: election.slug,
    status: election.status,
    scheduledStartAt: election.scheduledStartAt
      ? new Date(election.scheduledStartAt).toISOString()
      : null,
    scheduledEndAt: election.scheduledEndAt
      ? new Date(election.scheduledEndAt).toISOString()
      : null,
    maxTotalVotesPerVoter: election.maxTotalVotesPerVoter ?? 1,
    maxVotesPerCandidate: election.maxVotesPerCandidate ?? 1,
    accessType: election.accessType ?? "public",
    pinEnabled: election.pinEnabled ?? false,
    otpRequired: election.otpRequired ?? false,
    collectVoterDetails: election.collectVoterDetails ?? false,
    candidates: publicCandidates,
  };
}
