"use server";

import { connectDB } from "@/config";
import { Candidate, Vote, Election } from "@/models";
import { requireAuth } from "@/lib/api/server/require-auth";
import { serialize } from "@/lib";

export async function getElectionById(electionId: string) {
  const user = await requireAuth();

  await connectDB();

  const election = await Election.findOne({
    _id: electionId,
    deletedAt: null,
  }).lean();

  if (!election) throw new Error("Election not found");

  if (election.createdBy.toString() !== user.id) {
    throw new Error("Election not found");
  }

  const candidates = await Candidate.find({
    election: electionId,
    deletedAt: null,
  })
    .sort({ position: 1 })
    .lean();

  const voteCounts = await Vote.aggregate([
    { $match: { election: election._id } },
    { $group: { _id: "$candidate", count: { $sum: 1 } } },
  ]);

  const voteCountMap = new Map(
    voteCounts.map((v: { _id: string; count: number }) => [
      v._id.toString(),
      v.count,
    ]),
  );

  const enrichedCandidates = candidates.map((c) => ({
    ...serialize(c),
    _id: c._id.toString(),
    election: c.election.toString(),
    voteCount: voteCountMap.get(c._id.toString()) || 0,
  }));

  const totalVotes = voteCounts.reduce(
    (sum: number, v: { count: number }) => sum + v.count,
    0,
  );

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
