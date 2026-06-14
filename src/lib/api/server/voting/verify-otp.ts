"use server";

import { connectDB } from "@/config";
import { Election, VoterToken } from "@/models";
import { verifyOtpSchema } from "@/lib/api/server/validation/voting-schemas";
import { sha256 } from "./hash";
import { setVoterSession } from "./voter-session";

export interface VerifyOtpResult {
  ok: boolean;
  error?: string;
}

export async function verifyVoterOtp(
  slug: string,
  rawToken: string,
  code: string
): Promise<VerifyOtpResult> {
  const parsed = verifyOtpSchema.safeParse({ slug, token: rawToken, code });
  if (!parsed.success) return { ok: false, error: "Incorrect code" };

  await connectDB();

  const election = await Election.findOne({
    slug: parsed.data.slug,
    deletedAt: null,
  })
    .select("_id accessType otpRequired")
    .lean();

  if (!election || election.accessType !== "protected") {
    return { ok: false, error: "Incorrect code" };
  }

  // Atomically consume one attempt; conditions guard expiry and attempt cap
  // so concurrent guesses cannot exceed the limit.
  const voterToken = await VoterToken.findOneAndUpdate(
    {
      election: election._id,
      tokenHash: sha256(parsed.data.token),
      exhaustedAt: null,
      otpHash: { $ne: null },
      otpExpiresAt: { $gt: new Date() },
      otpAttempts: { $lt: 5 },
    },
    { $inc: { otpAttempts: 1 } },
    { new: true }
  )
    .select("_id otpHash")
    .lean();

  if (!voterToken) {
    return {
      ok: false,
      error: "Code expired or too many attempts. Request a new code.",
    };
  }

  if (voterToken.otpHash !== sha256(parsed.data.code)) {
    return { ok: false, error: "Incorrect code" };
  }

  await VoterToken.updateOne(
    { _id: voterToken._id },
    { $set: { otpHash: null, otpExpiresAt: null, otpAttempts: 0 } }
  );

  await setVoterSession({
    electionId: election._id.toString(),
    voterId: voterToken._id.toString(),
    method: "otp",
    tokenId: voterToken._id.toString(),
  });

  return { ok: true };
}
