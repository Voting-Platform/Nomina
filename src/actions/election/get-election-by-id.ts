"use server";

import { connectDB } from "@/lib/db";
import { Election } from "@/models/Election";
import { Candidate } from "@/models/Candidate";
import { Vote } from "@/models/Vote";
import { getOrSyncDbUser } from "@/actions/user";
import { serialize } from "@/lib/serialize";

/**
 * Fetches a single election by ID with its candidates and vote counts.
 * Only the election creator can access it.
 */
export async function getElectionById(electionId: string) {
  const dbUser = await getOrSyncDbUser();
  if (!dbUser) throw new Error("Unauthorized");

  await connectDB();

  const election = await Election.findOne({
    _id: electionId,
    deletedAt: null,
  }).lean();

  if (!election) throw new Error("Election not found");

  // Verify ownership
  if (election.createdBy.toString() !== dbUser._id.toString()) {
    throw new Error("You do not have permission to view this election");
  }

  // Fetch candidates
  const candidates = await Candidate.find({
    election: electionId,
    deletedAt: null,
  })
    .sort({ position: 1 })
    .lean();

  // Fetch vote counts per candidate
  const voteCounts = await Vote.aggregate([
    { $match: { election: election._id } },
    { $group: { _id: "$candidate", count: { $sum: 1 } } },
  ]);

  const voteCountMap = new Map(
    voteCounts.map((v: { _id: string; count: number }) => [v._id.toString(), v.count])
  );

  // Enrich candidates with vote counts — fully serialized
  const enrichedCandidates = candidates.map((c) => ({
    ...serialize(c),
    _id: c._id.toString(),
    election: c.election.toString(),
    voteCount: voteCountMap.get(c._id.toString()) || 0,
  }));

  // Total votes for the election
  const totalVotes = voteCounts.reduce(
    (sum: number, v: { count: number }) => sum + v.count,
    0
  );

  // Unique voter count (using aggregation instead of distinct for apiStrict compatibility)
  const uniqueVoterResult = await Vote.aggregate([
    { $match: { election: election._id } },
    { $group: { _id: "$voter" } },
    { $count: "count" },
  ]);

  return {
    ...serialize(election),
    _id: election._id.toString(),
    createdBy: election.createdBy.toString(),
    candidates: enrichedCandidates,
    totalVotes,
    uniqueVoterCount: uniqueVoterResult[0]?.count ?? 0,
  };
}
