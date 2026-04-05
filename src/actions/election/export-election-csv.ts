"use server";

import { connectDB } from "@/lib/db";
import { Election } from "@/models/Election";
import { Candidate } from "@/models/Candidate";
import { Vote } from "@/models/Vote";
import { User } from "@/models/User";
import { getOrSyncDbUser } from "@/actions/user";

/**
 * Exports election data as CSV string.
 * Returns CSV content that the client can trigger as a download.
 */
export async function exportElectionCsv(electionId: string) {
  const dbUser = await getOrSyncDbUser();
  if (!dbUser) throw new Error("Unauthorized");

  await connectDB();

  const election = await Election.findOne({
    _id: electionId,
    deletedAt: null,
  }).lean();

  if (!election) throw new Error("Election not found");

  if (election.createdBy.toString() !== dbUser._id.toString()) {
    throw new Error("You do not have permission to export this election");
  }

  // Fetch candidates
  const candidates = await Candidate.find({
    election: electionId,
    deletedAt: null,
  })
    .sort({ position: 1 })
    .lean();

  // Fetch all votes with voter info
  const votes = await Vote.find({ election: electionId }).lean();

  // Get unique voter IDs and fetch their info
  const voterIds = [...new Set(votes.map((v) => v.voter.toString()))];
  const voters = await User.find({ _id: { $in: voterIds } })
    .select("name email")
    .lean();
  const voterMap = new Map(
    voters.map((v) => [v._id.toString(), { name: v.name, email: v.email }])
  );

  // Build vote count per candidate
  const voteCountMap = new Map<string, number>();
  votes.forEach((v) => {
    const key = v.candidate.toString();
    voteCountMap.set(key, (voteCountMap.get(key) || 0) + 1);
  });

  // ─── Build CSV ───

  // Section 1: Election Summary
  const lines: string[] = [];
  lines.push("ELECTION SUMMARY");
  lines.push(`Title,${csvEscape(election.title)}`);
  lines.push(`Description,${csvEscape(election.description)}`);
  lines.push(`Status,${election.status}`);
  lines.push(`Created At,${election.createdAt}`);
  lines.push(`Total Votes,${votes.length}`);
  lines.push(`Unique Voters,${voterIds.length}`);
  lines.push("");

  // Section 2: Candidate Results
  lines.push("CANDIDATE RESULTS");
  lines.push("Rank,Name,Description,Votes,Percentage");
  const sortedCandidates = candidates
    .map((c) => ({
      ...c,
      voteCount: voteCountMap.get(c._id.toString()) || 0,
    }))
    .sort((a, b) => b.voteCount - a.voteCount);

  sortedCandidates.forEach((c, idx) => {
    const pct =
      votes.length > 0
        ? ((c.voteCount / votes.length) * 100).toFixed(1)
        : "0.0";
    lines.push(
      `${idx + 1},${csvEscape(c.name)},${csvEscape(c.description)},${c.voteCount},${pct}%`
    );
  });
  lines.push("");

  // Section 3: Vote Log (if voter visibility is enabled)
  if (election.allowVoterVisibility) {
    lines.push("VOTE LOG");
    lines.push("Voter Name,Voter Email,Candidate,Voted At");
    votes.forEach((v) => {
      const voter = voterMap.get(v.voter.toString());
      const candidate = candidates.find(
        (c) => c._id.toString() === v.candidate.toString()
      );
      lines.push(
        `${csvEscape(voter?.name || "Unknown")},${csvEscape(voter?.email || "Unknown")},${csvEscape(candidate?.name || "Unknown")},${v.castedAt}`
      );
    });
  }

  return {
    filename: `${election.slug}-results.csv`,
    content: lines.join("\n"),
  };
}

/** Escapes a string for CSV (wraps in quotes if it contains commas or quotes) */
function csvEscape(str: string): string {
  if (!str) return "";
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
