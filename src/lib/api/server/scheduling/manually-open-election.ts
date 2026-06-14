"use server";

import { requireAuth } from "@/lib/api/server/require-auth";
import { getOwnedElection } from "@/lib/api/server/get-owned-election";
import { serialize } from "@/lib";

export async function manuallyOpenElection(electionId: string) {
  const user = await requireAuth();

  const election = await getOwnedElection(electionId, user.id);

  if (election.schedulingMode !== "manual") {
    throw new Error("This election uses automatic scheduling");
  }

  if (!["draft", "scheduled"].includes(election.status)) {
    throw new Error("Election is already open or closed");
  }

  election.status = "open";
  election.manuallyOpenedAt = new Date();

  await election.save();

  return serialize(election.toObject());
}
