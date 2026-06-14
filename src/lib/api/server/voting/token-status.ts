import "server-only";
import { connectDB } from "@/config";
import { VoterToken } from "@/models";
import { sha256 } from "./hash";

export type VoterTokenStatus =
  | {
      status: "valid";
      tokenId: string;
      email: string;
      name: string | null;
      maskedEmail: string;
    }
  | { status: "exhausted" }
  | { status: "invalid" };

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  return `${local.slice(0, 1)}***@${domain}`;
}

/**
 * Read-only token lookup for the vote page RSC and for actions that
 * receive the raw token from the personalized link. Never sets cookies.
 */
export async function getVoterTokenStatus(
  electionId: string,
  lookup: { rawToken?: string; tokenId?: string }
): Promise<VoterTokenStatus> {
  await connectDB();

  const query = lookup.tokenId
    ? { _id: lookup.tokenId, election: electionId }
    : lookup.rawToken && /^[a-f0-9]{32}$/i.test(lookup.rawToken)
      ? { election: electionId, tokenHash: sha256(lookup.rawToken) }
      : null;

  if (!query) return { status: "invalid" };

  const voterToken = await VoterToken.findOne(query)
    .select("_id email name exhaustedAt")
    .lean();

  if (!voterToken) return { status: "invalid" };
  if (voterToken.exhaustedAt) return { status: "exhausted" };

  return {
    status: "valid",
    tokenId: voterToken._id.toString(),
    email: voterToken.email,
    name: voterToken.name ?? null,
    maskedEmail: maskEmail(voterToken.email),
  };
}
