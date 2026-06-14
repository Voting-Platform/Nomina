"use server";

import { requireAuth } from "@/lib/api/server/require-auth";
import { getOwnedElection } from "@/lib/api/server/get-owned-election";
import { serialize } from "@/lib";

export async function manuallyCloseElection(electionId: string) {
  const user = await requireAuth();

  const election = await getOwnedElection(electionId, user.id);

  if (election.schedulingMode !== "manual") {
    throw new Error("This election uses automatic scheduling");
  }

  if (election.status !== "open") {
    throw new Error("Election is not currently open");
  }

  election.status = "closed";
  election.manuallyClosedAt = new Date();

  await election.save();

  return serialize(election.toObject());
}
