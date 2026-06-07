"use server";

import { connectDB } from "@/config";
import { Candidate, User, Vote, Election } from "@/models";
import { requireAuth, assertObjectId } from "@/lib/api/server/require-auth";

export async function exportElectionCsv(electionId: string) {
  const user = await requireAuth();
  assertObjectId(electionId, "Election");

  await connectDB();

  const election = await Election.findOne({
    _id: electionId,
    deletedAt: null,
  }).lean();

  if (!election || election.createdBy.toString() !== user.id) {
    throw new Error("Election not found");
  }

  const candidates = await Candidate.find({
    election: electionId,
    deletedAt: null,
  })
    .sort({ position: 1 })
    .lean();

  const votes = await Vote.find({ election: electionId }).lean();

  const voterIds = [...new Set(votes.map((v) => v.voter.toString()))];
  const voters = await User.find({ _id: { $in: voterIds } })
    .select("name email")
    .lean();
  const voterMap = new Map(
    voters.map((v) => [v._id.toString(), { name: v.name, email: v.email }])
  );

  const voteCountMap = new Map<string, number>();
  votes.forEach((v) => {
    const key = v.candidate.toString();
    voteCountMap.set(key, (voteCountMap.get(key) || 0) + 1);
  });

  const lines: string[] = [];
  lines.push("ELECTION SUMMARY");
  lines.push(`Title,${csvEscape(election.title)}`);
  lines.push(`Description,${csvEscape(election.description)}`);
  lines.push(`Status,${election.status}`);
  lines.push(`Created At,${election.createdAt}`);
  lines.push(`Total Votes,${votes.length}`);
  lines.push(`Unique Voters,${voterIds.length}`);
  lines.push("");

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

function csvEscape(str: string): string {
  if (!str) return "";
  // Neutralise spreadsheet formula injection (Excel, Google Sheets).
  // A leading =, +, -, @, tab, or carriage-return triggers formula execution.
  if (/^[=+\-@\t\r]/.test(str)) str = `\t${str}`;
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
