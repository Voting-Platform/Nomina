"use server";

import { z } from "zod";
import { requireAuth } from "@/lib/api/server/require-auth";
import { getOwnedElection } from "@/lib/api/server/get-owned-election";
import { objectIdSchema } from "@/lib/api/server/validation/common";
import { generateSixDigitCode } from "@/lib/api/server/voting/hash";

const inputSchema = z.object({ electionId: objectIdSchema });

export async function regeneratePin(electionId: string) {
  const user = await requireAuth();

  const parsed = inputSchema.safeParse({ electionId });
  if (!parsed.success) throw new Error("Invalid input");

  const election = await getOwnedElection(parsed.data.electionId, user.id);

  election.pin = generateSixDigitCode();
  election.pinEnabled = true;
  await election.save();

  return { success: true, pin: election.pin as string };
}
