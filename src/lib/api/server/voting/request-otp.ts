"use server";

import { connectDB } from "@/config";
import { Election, VoterToken } from "@/models";
import { checkRateLimit } from "@/lib/api/server/rate-limit";
import { requestOtpSchema } from "@/lib/api/server/validation/voting-schemas";
import { renderOtpEmail, OTP_EXPIRES_MINUTES } from "@/lib/email/render";
import { sendMail } from "@/lib/email/transport";
import { sha256, generateSixDigitCode } from "./hash";

export interface RequestOtpResult {
  ok: boolean;
  error?: string;
  retryAfterMs?: number;
}

export async function requestVoterOtp(
  slug: string,
  rawToken: string
): Promise<RequestOtpResult> {
  const parsed = requestOtpSchema.safeParse({ slug, token: rawToken });
  if (!parsed.success) return { ok: false, error: "Invalid link" };

  await connectDB();

  const election = await Election.findOne({
    slug: parsed.data.slug,
    deletedAt: null,
  })
    .select("_id title accessType otpRequired")
    .lean();

  if (!election || election.accessType !== "protected" || !election.otpRequired) {
    return { ok: false, error: "Invalid link" };
  }

  const voterToken = await VoterToken.findOne({
    election: election._id,
    tokenHash: sha256(parsed.data.token),
  }).select("_id email exhaustedAt otpLastSentAt");

  if (!voterToken || voterToken.exhaustedAt) {
    return { ok: false, error: "Invalid link" };
  }

  // Resend throttling: 60s between sends, 3 per 10 minutes
  if (
    voterToken.otpLastSentAt &&
    Date.now() - voterToken.otpLastSentAt.getTime() < 60 * 1000
  ) {
    return {
      ok: false,
      error: "Please wait before requesting another code.",
      retryAfterMs:
        60 * 1000 - (Date.now() - voterToken.otpLastSentAt.getTime()),
    };
  }
  const limit = checkRateLimit(
    `otp-send:${voterToken._id.toString()}`,
    3,
    10 * 60 * 1000
  );
  if (!limit.ok) {
    return {
      ok: false,
      error: "Too many codes requested. Please try again later.",
      retryAfterMs: limit.retryAfterMs,
    };
  }

  const code = generateSixDigitCode();
  voterToken.otpHash = sha256(code);
  voterToken.otpExpiresAt = new Date(
    Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000
  );
  voterToken.otpAttempts = 0;
  voterToken.otpLastSentAt = new Date();
  await voterToken.save();

  try {
    const email = await renderOtpEmail({
      electionTitle: election.title,
      otp: code,
    });
    await sendMail({ to: voterToken.email, ...email });
  } catch {
    return {
      ok: false,
      error: "Could not send the code. Please try again.",
    };
  }

  return { ok: true };
}
