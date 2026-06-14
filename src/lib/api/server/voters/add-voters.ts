"use server";

import { requireAuth } from "@/lib/api/server/require-auth";
import { getOwnedElection } from "@/lib/api/server/get-owned-election";
import { addVotersSchema } from "@/lib/api/server/validation/voters-schemas";
import { VoterToken } from "@/models";
import type { VoterEntry } from "@/types";

const MAX_ROSTER_SIZE = 2000;

export async function addVoters(electionId: string, entries: VoterEntry[]) {
  const user = await requireAuth();

  const parsed = addVotersSchema.safeParse({ electionId, entries });
  if (!parsed.success) throw new Error("Invalid voter list");

  const election = await getOwnedElection(parsed.data.electionId, user.id);

  // Dedupe within the payload (emails are normalized by the schema)
  const seen = new Set<string>();
  const unique = parsed.data.entries.filter((e) => {
    if (seen.has(e.email)) return false;
    seen.add(e.email);
    return true;
  });

  const existingCount = await VoterToken.countDocuments({
    election: election._id,
  });
  if (existingCount + unique.length > MAX_ROSTER_SIZE) {
    throw new Error(
      `Voter list is limited to ${MAX_ROSTER_SIZE} voters per election.`
    );
  }

  // ordered:false → existing emails are skipped via the unique index
  let added = 0;
  try {
    const result = await VoterToken.insertMany(
      unique.map((e) => ({
        election: election._id,
        email: e.email,
        name: e.name?.trim() || null,
      })),
      { ordered: false }
    );
    added = result.length;
  } catch (err: unknown) {
    // Partial success on duplicate keys: count what was inserted
    const e = err as { insertedDocs?: unknown[]; code?: number };
    if (e.insertedDocs) {
      added = e.insertedDocs.length;
    } else {
      throw new Error("Could not add voters");
    }
  }

  return {
    success: true,
    added,
    skippedDuplicates: unique.length - added,
  };
}
