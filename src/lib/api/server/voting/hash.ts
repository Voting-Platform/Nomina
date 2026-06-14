import "server-only";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "crypto";

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Raw voter token for invitation links: 32 hex chars. */
export function generateVoterToken(): string {
  return randomBytes(16).toString("hex");
}

/** 6-digit numeric code (election PIN / email OTP), zero-padded. */
export function generateSixDigitCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** Constant-time string comparison for short secrets. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
