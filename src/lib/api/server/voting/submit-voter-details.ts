"use server";

import { randomUUID } from "crypto";
import { connectDB } from "@/config";
import { Election } from "@/models";
import { checkRateLimit, getClientIp } from "@/lib/api/server/rate-limit";
import { voterDetailsSchema } from "@/lib/api/server/validation/voting-schemas";
import { getVoterSession, setVoterSession } from "./voter-session";
import { getVoterTokenStatus } from "./token-status";

export interface SubmitVoterDetailsResult {
  ok: boolean;
  error?: string;
}

/**
 * Stores the voter's name + email inside their signed session cookie.
 * Nothing touches the database until the ballot is cast.
 */
export async function submitVoterDetails(
  slug: string,
  details: { name: string; email: string },
  rawToken?: string
): Promise<SubmitVoterDetailsResult> {
  const parsed = voterDetailsSchema.safeParse({
    slug,
    ...details,
    token: rawToken || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Please enter a valid name and email." };
  }

  await connectDB();

  const election = await Election.findOne({
    slug: parsed.data.slug,
    deletedAt: null,
  })
    .select("_id accessType pinEnabled otpRequired collectVoterDetails status")
    .lean();

  if (!election || !election.collectVoterDetails) {
    return { ok: false, error: "Invalid request" };
  }

  const electionId = election._id.toString();
  const ip = await getClientIp();
  const limit = checkRateLimit(`details:${electionId}:${ip}`, 20, 10 * 60 * 1000);
  if (!limit.ok) return { ok: false, error: "Too many attempts. Try again later." };

  const session = await getVoterSession(electionId);
  const collected = { name: parsed.data.name, email: parsed.data.email };

  if (session) {
    await setVoterSession({ ...session, details: collected });
    return { ok: true };
  }

  // No session yet. Protected elections without OTP reach the details form
  // directly from their personalized link — validate the token here.
  if (election.accessType === "protected") {
    if (election.otpRequired || !parsed.data.token) {
      return { ok: false, error: "Session expired. Reload the page." };
    }
    const status = await getVoterTokenStatus(electionId, {
      rawToken: parsed.data.token,
    });
    if (status.status !== "valid") {
      return { ok: false, error: "Session expired. Reload the page." };
    }
    await setVoterSession({
      electionId,
      voterId: status.tokenId,
      method: "token",
      tokenId: status.tokenId,
      details: collected,
    });
    return { ok: true };
  }

  // Public elections: only allowed without a PIN (the PIN gate sets a session).
  if (election.pinEnabled) {
    return { ok: false, error: "Session expired. Reload the page." };
  }

  await setVoterSession({
    electionId,
    voterId: randomUUID(),
    method: "open",
    details: collected,
  });

  return { ok: true };
}
