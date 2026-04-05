"use server";

import { connectDB } from "@/lib/db";
import { Election } from "@/models/Election";
import { Candidate } from "@/models/Candidate";
import { Vote } from "@/models/Vote";
import { getOrSyncDbUser } from "@/actions/user";
import type { ElectionSummary } from "@/types/election";

/**
 * Returns all elections created by the current user.
 * Includes candidate count and total votes for each.
 */
export async function getMyElections(): Promise<ElectionSummary[]> {
  const dbUser = await getOrSyncDbUser();
  if (!dbUser) throw new Error("Unauthorized");

  await connectDB();

  const elections = await Election.find({
    createdBy: dbUser._id,
    deletedAt: null,
  })
    .sort({ createdAt: -1 })
    .lean();

  // Batch fetch candidate counts and vote counts
  const electionIds = elections.map((e) => e._id);

  const candidateCounts = await Candidate.aggregate([
    { $match: { election: { $in: electionIds }, deletedAt: null } },
    { $group: { _id: "$election", count: { $sum: 1 } } },
  ]);

  const voteCounts = await Vote.aggregate([
    { $match: { election: { $in: electionIds } } },
    { $group: { _id: "$election", count: { $sum: 1 } } },
  ]);

  const candidateMap = new Map(
    candidateCounts.map((c: { _id: string; count: number }) => [c._id.toString(), c.count])
  );
  const voteMap = new Map(
    voteCounts.map((v: { _id: string; count: number }) => [v._id.toString(), v.count])
  );

  return elections.map((e) => ({
    _id: e._id.toString(),
    title: e.title,
    slug: e.slug,
    status: e.status,
    candidateCount: candidateMap.get(e._id.toString()) || 0,
    totalVotes: voteMap.get(e._id.toString()) || 0,
    createdAt: new Date(e.createdAt).toISOString(),
  }));
}
