"use server";

import { randomUUID } from "crypto";
import { connectDB } from "@/config";
import { Election } from "@/models";
import { checkRateLimit, getClientIp } from "@/lib/api/server/rate-limit";
import { verifyPinSchema } from "@/lib/api/server/validation/voting-schemas";
import { safeEqual } from "./hash";
import { setVoterSession } from "./voter-session";

export interface VerifyPinResult {
  ok: boolean;
  error?: string;
  retryAfterMs?: number;
}

export async function verifyElectionPin(
  slug: string,
  pin: string
): Promise<VerifyPinResult> {
  const parsed = verifyPinSchema.safeParse({ slug, pin });
  if (!parsed.success) return { ok: false, error: "Incorrect PIN" };

  await connectDB();

  const election = await Election.findOne({
    slug: parsed.data.slug,
    deletedAt: null,
  })
    .select("_id accessType pinEnabled pin status")
    .lean();

  if (!election || election.accessType !== "public" || !election.pinEnabled) {
    return { ok: false, error: "Incorrect PIN" };
  }

  const electionId = election._id.toString();
  const ip = await getClientIp();

  const perIp = checkRateLimit(`pin:${electionId}:${ip}`, 5, 10 * 60 * 1000);
  if (!perIp.ok) {
    return {
      ok: false,
      error: "Too many attempts. Please try again later.",
      retryAfterMs: perIp.retryAfterMs,
    };
  }
  // Global per-election cap to slow distributed guessing
  const perElection = checkRateLimit(`pin-all:${electionId}`, 100, 10 * 60 * 1000);
  if (!perElection.ok) {
    return {
      ok: false,
      error: "Too many attempts. Please try again later.",
      retryAfterMs: perElection.retryAfterMs,
    };
  }

  if (!election.pin || !safeEqual(election.pin, parsed.data.pin)) {
    return { ok: false, error: "Incorrect PIN" };
  }

  await setVoterSession({
    electionId,
    voterId: randomUUID(),
    method: "pin",
  });

  return { ok: true };
}
