"use server";

import { z } from "zod";
import { requireAuth } from "@/lib/api/server/require-auth";
import { getOwnedElection } from "@/lib/api/server/get-owned-election";
import { objectIdSchema } from "@/lib/api/server/validation/common";
import { VoterToken } from "@/models";
import type { VoterTokenDocument } from "@/types";

const inputSchema = z.object({ electionId: objectIdSchema });

export async function getVoters(
  electionId: string
): Promise<VoterTokenDocument[]> {
  const user = await requireAuth();

  const parsed = inputSchema.safeParse({ electionId });
  if (!parsed.success) throw new Error("Invalid input");

  const election = await getOwnedElection(parsed.data.electionId, user.id);

  const voters = await VoterToken.find({ election: election._id })
    .select(
      "_id email name votesUsed exhaustedAt invitationStatus invitationSentAt createdAt updatedAt"
    )
    .sort({ createdAt: 1 })
    .lean();

  return voters.map((v) => ({
    _id: v._id.toString(),
    election: election._id.toString(),
    email: v.email,
    name: v.name ?? null,
    votesUsed: v.votesUsed ?? 0,
    exhaustedAt: v.exhaustedAt ? new Date(v.exhaustedAt).toISOString() : null,
    invitationStatus: v.invitationStatus ?? "pending",
    invitationSentAt: v.invitationSentAt
      ? new Date(v.invitationSentAt).toISOString()
      : null,
    createdAt: new Date(v.createdAt).toISOString(),
    updatedAt: new Date(v.updatedAt).toISOString(),
  }));
}
