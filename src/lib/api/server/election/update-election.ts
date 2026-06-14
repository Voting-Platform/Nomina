"use server";

import { requireAuth } from "@/lib/api/server/require-auth";
import { getOwnedElection } from "@/lib/api/server/get-owned-election";
import { updateElectionSchema } from "@/lib/api/server/validation/election-schemas";
import type { UpdateElectionInput } from "@/types";

export async function updateElection(
  electionId: string,
  data: UpdateElectionInput
) {
  const user = await requireAuth();

  const parsed = updateElectionSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid election data");

  const election = await getOwnedElection(electionId, user.id);

  if (parsed.data.title !== undefined) election.title = parsed.data.title;
  if (parsed.data.description !== undefined) {
    election.description = parsed.data.description;
  }

  if (parsed.data.title !== undefined) {
    const baseSlug = parsed.data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const uniqueSuffix = Date.now().toString(36);
    election.slug = `${baseSlug}-${uniqueSuffix}`;
    election.electionLink = `${process.env.APP_BASE_URL}/vote/${election.slug}`;
  }

  await election.save();

  return { _id: election._id.toString() };
}
