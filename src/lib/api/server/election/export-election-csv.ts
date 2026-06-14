"use server";

import { z } from "zod";
import { requireAuth } from "@/lib/api/server/require-auth";
import { getOwnedElection } from "@/lib/api/server/get-owned-election";
import { objectIdSchema } from "@/lib/api/server/validation/common";
import { Candidate, Vote } from "@/models";
import { resolveVoterIdentities } from "./voter-identity";

const inputSchema = z.object({ electionId: objectIdSchema });

export async function exportElectionCsv(electionId: string) {
  const user = await requireAuth();

  const parsed = inputSchema.safeParse({ electionId });
  if (!parsed.success) throw new Error("Invalid input");

  const election = await getOwnedElection(parsed.data.electionId, user.id);

  const candidates = await Candidate.find({
    election: election._id,
    deletedAt: null,
  })
    .sort({ position: 1 })
    .lean();

  const votes = await Vote.find({ election: election._id }).lean();

  const uniqueVoters = new Set(votes.map((v) => v.voterKey)).size;

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
  lines.push(`Access Type,${election.accessType}`);
  lines.push(`Created At,${election.createdAt}`);
  lines.push(`Total Votes,${votes.length}`);
  lines.push(`Unique Voters,${uniqueVoters}`);
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

  if (election.revealVoterIdentities) {
    const identities = await resolveVoterIdentities(votes);
    const candidateNames = new Map(
      candidates.map((c) => [c._id.toString(), c.name])
    );

    lines.push("VOTE LOG");
    lines.push("Voter Name,Voter Email,Candidate,Voted At");
    votes.forEach((v) => {
      const identity = identities.get(v.voterKey) ?? {
        name: "Anonymous",
        email: "",
      };
      lines.push(
        `${csvEscape(identity.name)},${csvEscape(identity.email)},${csvEscape(
          candidateNames.get(v.candidate.toString()) || "Unknown"
        )},${v.castedAt}`
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
  let value = str;
  // Voter-supplied text enters this CSV: prefix formula-trigger characters
  // so spreadsheet apps don't execute them as formulas.
  if (/^[=+\-@\t\r]/.test(value)) {
    value = `'${value}`;
  }
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
