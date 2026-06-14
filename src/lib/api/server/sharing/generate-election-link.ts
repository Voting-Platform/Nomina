"use server";

import { requireAuth } from "@/lib/api/server/require-auth";
import { getOwnedElection } from "@/lib/api/server/get-owned-election";

export async function generateElectionLink(electionId: string) {
  const user = await requireAuth();

  const election = await getOwnedElection(electionId, user.id);

  const link = `${process.env.APP_BASE_URL}/vote/${election.slug}`;
  election.electionLink = link;
  await election.save();

  return { link };
}
