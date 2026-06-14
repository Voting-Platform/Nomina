import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

/* ═══════════════════════════════════════════════════════════════
   Voter session — signed httpOnly cookies, scoped per election.

   nv_vs_<electionId>  (2h)  — access session: set after the voter
     passes the election's gates (PIN / token / OTP); carries any
     collected voter details.
   nv_vd_<electionId>  (1y)  — voted marker: best-effort duplicate
     guard for public elections, "already voted" UX for all.
   ═══════════════════════════════════════════════════════════════ */

export type VoterAccessMethod = "open" | "pin" | "otp" | "token";

export interface VoterSessionPayload {
  electionId: string;
  /** Stable anonymous id for this voter ("anon:<voterId>" voterKey). */
  voterId: string;
  method: VoterAccessMethod;
  /** VoterToken _id for protected elections. */
  tokenId?: string;
  details?: { name: string; email: string };
}

const SESSION_MAX_AGE_S = 2 * 60 * 60;
const VOTED_MAX_AGE_S = 365 * 24 * 60 * 60;

function secret(): Uint8Array {
  const raw =
    process.env.VOTER_SESSION_SECRET ?? process.env.AUTH_SECRET;
  if (!raw) throw new Error("Missing VOTER_SESSION_SECRET / AUTH_SECRET");
  return new TextEncoder().encode(raw);
}

const sessionCookieName = (electionId: string) => `nv_vs_${electionId}`;
const votedCookieName = (electionId: string) => `nv_vd_${electionId}`;

async function sign(
  payload: Record<string, unknown>,
  maxAgeS: number
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeS}s`)
    .sign(secret());
}

async function verify<T>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as T;
  } catch {
    return null;
  }
}

const cookieOptions = (maxAgeS: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/vote",
  maxAge: maxAgeS,
});

// ─── Access session ───

export async function getVoterSession(
  electionId: string
): Promise<VoterSessionPayload | null> {
  const store = await cookies();
  const raw = store.get(sessionCookieName(electionId))?.value;
  if (!raw) return null;
  const payload = await verify<VoterSessionPayload>(raw);
  if (!payload || payload.electionId !== electionId) return null;
  return payload;
}

export async function setVoterSession(
  payload: VoterSessionPayload
): Promise<void> {
  const store = await cookies();
  const token = await sign(
    payload as unknown as Record<string, unknown>,
    SESSION_MAX_AGE_S
  );
  store.set(
    sessionCookieName(payload.electionId),
    token,
    cookieOptions(SESSION_MAX_AGE_S)
  );
}

// ─── Voted marker ───

export async function hasVotedCookie(electionId: string): Promise<boolean> {
  const store = await cookies();
  const raw = store.get(votedCookieName(electionId))?.value;
  if (!raw) return false;
  const payload = await verify<{ electionId: string }>(raw);
  return payload?.electionId === electionId;
}

export async function setVotedCookie(electionId: string): Promise<void> {
  const store = await cookies();
  const token = await sign({ electionId }, VOTED_MAX_AGE_S);
  store.set(votedCookieName(electionId), token, cookieOptions(VOTED_MAX_AGE_S));
}
