"use server";

import { z } from "zod";
import { requireAuth } from "@/lib/api/server/require-auth";
import { getOwnedElection } from "@/lib/api/server/get-owned-election";
import { objectIdSchema } from "@/lib/api/server/validation/common";
import { Candidate, Vote } from "@/models";
import { resolveVoterIdentities } from "./voter-identity";
import type { VoterLogRow } from "@/types";

const inputSchema = z.object({ electionId: objectIdSchema });

export interface VoterLogResult {
  enabled: boolean;
  rows: VoterLogRow[];
}

/**
 * Owner-only voter log (who voted for whom). Hard-gated server-side on
 * the election's revealVoterIdentities setting.
 */
export async function getVoterLog(electionId: string): Promise<VoterLogResult> {
  const user = await requireAuth();

  const parsed = inputSchema.safeParse({ electionId });
  if (!parsed.success) throw new Error("Invalid input");

  const election = await getOwnedElection(parsed.data.electionId, user.id);

  if (!election.revealVoterIdentities) {
    return { enabled: false, rows: [] };
  }

  const votes = await Vote.find({ election: election._id })
    .select("candidate voterKey voterDetails castedAt")
    .sort({ castedAt: -1 })
    .lean();

  if (votes.length === 0) return { enabled: true, rows: [] };

  const candidates = await Candidate.find({ election: election._id })
    .select("_id name")
    .lean();
  const candidateNames = new Map(
    candidates.map((c) => [c._id.toString(), c.name])
  );

  const identities = await resolveVoterIdentities(votes);

  // Group consecutive votes by (voterKey, candidate) into one row with count
  const grouped = new Map<
    string,
    { voterKey: string; candidateId: string; votes: number; castedAt: Date }
  >();
  for (const v of votes) {
    const key = `${v.voterKey}|${v.candidate.toString()}`;
    const entry = grouped.get(key);
    if (entry) {
      entry.votes++;
      if (v.castedAt > entry.castedAt) entry.castedAt = v.castedAt;
    } else {
      grouped.set(key, {
        voterKey: v.voterKey,
        candidateId: v.candidate.toString(),
        votes: 1,
        castedAt: v.castedAt,
      });
    }
  }

  const rows: VoterLogRow[] = [...grouped.values()].map((g) => {
    const identity = identities.get(g.voterKey) ?? {
      name: "Anonymous",
      email: "",
    };
    return {
      voterName: identity.name,
      voterEmail: identity.email,
      candidateName: candidateNames.get(g.candidateId) ?? "Unknown",
      votes: g.votes,
      castedAt: g.castedAt.toISOString(),
    };
  });

  return { enabled: true, rows };
}
