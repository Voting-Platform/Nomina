"use server";

import { requireAuth } from "@/lib/api/server/require-auth";
import { getOwnedElection } from "@/lib/api/server/get-owned-election";

export async function deleteElection(electionId: string) {
  const user = await requireAuth();

  const election = await getOwnedElection(electionId, user.id);

  election.deletedAt = new Date();
  await election.save();

  return { success: true };
}
