import "server-only";
import { User, VoterToken } from "@/models";

export interface VoterIdentity {
  name: string;
  email: string;
}

interface VoteIdentitySource {
  voterKey: string;
  voterDetails?: { name?: string | null; email?: string | null };
}

/**
 * Resolves a display identity for each voterKey.
 * Resolution order: collected voter details → VoterToken (protected) →
 * legacy User account → "Anonymous".
 */
export async function resolveVoterIdentities(
  votes: VoteIdentitySource[]
): Promise<Map<string, VoterIdentity>> {
  const identities = new Map<string, VoterIdentity>();
  const tokenIds: string[] = [];
  const userIds: string[] = [];

  for (const vote of votes) {
    if (identities.has(vote.voterKey)) continue;

    if (vote.voterDetails?.name || vote.voterDetails?.email) {
      identities.set(vote.voterKey, {
        name: vote.voterDetails.name || "Unknown",
        email: vote.voterDetails.email || "",
      });
      continue;
    }

    const [kind, id] = vote.voterKey.split(":");
    if (kind === "token" && id) tokenIds.push(id);
    else if (kind === "user" && id) userIds.push(id);
    else identities.set(vote.voterKey, { name: "Anonymous", email: "" });
  }

  if (tokenIds.length > 0) {
    const tokens = await VoterToken.find({ _id: { $in: tokenIds } })
      .select("_id email name")
      .lean();
    for (const t of tokens) {
      identities.set(`token:${t._id.toString()}`, {
        name: t.name || t.email,
        email: t.email,
      });
    }
  }

  if (userIds.length > 0) {
    const users = await User.find({ _id: { $in: userIds } })
      .select("_id name email")
      .lean();
    for (const u of users) {
      identities.set(`user:${u._id.toString()}`, {
        name: u.name || "Unknown",
        email: u.email || "",
      });
    }
  }

  // Anything unresolved (deleted token/user) falls back to Anonymous
  for (const vote of votes) {
    if (!identities.has(vote.voterKey)) {
      identities.set(vote.voterKey, { name: "Anonymous", email: "" });
    }
  }

  return identities;
}
