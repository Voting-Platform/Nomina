"use server";

import { requireAuth } from "@/lib/api/server/require-auth";
import { getOwnedElection } from "@/lib/api/server/get-owned-election";
import { sendInvitationsSchema } from "@/lib/api/server/validation/sharing-schemas";
import { checkRateLimit } from "@/lib/api/server/rate-limit";
import { generateVoterToken, sha256 } from "@/lib/api/server/voting/hash";
import { renderInvitationEmail } from "@/lib/email/render";
import { sendMail, isEmailConfigured } from "@/lib/email/transport";
import { VoterToken } from "@/models";
import type { EmailTemplatePreset } from "@/types";

const BATCH_CAP = 25;
const INTER_SEND_DELAY_MS = 400;
// Soft daily cap below Gmail's ~500/day limit
const DAILY_CAP = 450;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface SendInvitationsResult {
  success: boolean;
  error?: string;
  sent: number;
  failed: { voterId: string; email: string }[];
  /** Voters still pending after this batch (client sends the next batch). */
  remaining: number;
}

/**
 * Sends invitation emails with personalized token links.
 * Each send rotates the voter's token, so resending an invitation
 * invalidates any previously emailed link.
 *
 * Capped at 25 recipients per call — the client chunks larger rosters
 * into sequential calls with a progress bar.
 */
export async function sendInvitations(
  electionId: string,
  options?: { voterIds?: string[] }
): Promise<SendInvitationsResult> {
  const user = await requireAuth();

  const parsed = sendInvitationsSchema.safeParse({
    electionId,
    voterIds: options?.voterIds,
  });
  if (!parsed.success) {
    return { success: false, error: "Invalid input", sent: 0, failed: [], remaining: 0 };
  }

  if (!isEmailConfigured()) {
    return {
      success: false,
      error:
        "Email is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in the environment.",
      sent: 0,
      failed: [],
      remaining: 0,
    };
  }

  const election = await getOwnedElection(parsed.data.electionId, user.id);
  if (election.accessType !== "protected") {
    return {
      success: false,
      error: "Invitations are only available for protected elections.",
      sent: 0,
      failed: [],
      remaining: 0,
    };
  }

  // Select recipients: explicit ids, or all pending/failed (never exhausted)
  const baseQuery = parsed.data.voterIds
    ? { election: election._id, _id: { $in: parsed.data.voterIds } }
    : {
        election: election._id,
        invitationStatus: { $in: ["pending", "failed"] },
      };

  const recipients = await VoterToken.find({
    ...baseQuery,
    exhaustedAt: null,
  }).limit(BATCH_CAP);

  if (recipients.length === 0) {
    return { success: true, sent: 0, failed: [], remaining: 0 };
  }

  // Gmail daily soft cap (per configured sender account)
  const daily = checkRateLimit(
    `invites:${process.env.GMAIL_USER}`,
    DAILY_CAP,
    24 * 60 * 60 * 1000
  );
  if (!daily.ok) {
    return {
      success: false,
      error:
        "Daily email limit reached for this Gmail account. Try again tomorrow.",
      sent: 0,
      failed: [],
      remaining: recipients.length,
    };
  }

  const template = election.emailTemplate ?? {
    preset: "formal",
    subject: "",
    message: "",
  };
  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

  let sent = 0;
  const failed: { voterId: string; email: string }[] = [];

  for (const voter of recipients) {
    // Rotate the token: the previously emailed link becomes invalid.
    const rawToken = generateVoterToken();
    voter.tokenHash = sha256(rawToken);

    try {
      const email = await renderInvitationEmail(
        template.preset as EmailTemplatePreset,
        {
          electionTitle: election.title,
          electionDescription: election.description ?? "",
          ownerName: user.name ?? "The organizer",
          voteUrl: `${baseUrl}/vote/${election.slug}?token=${rawToken}`,
          customMessage: template.message ?? "",
          customSubject: template.subject ?? "",
        }
      );
      await sendMail({ to: voter.email, ...email });
      voter.invitationStatus = "sent";
      voter.invitationSentAt = new Date();
      sent++;
    } catch {
      voter.invitationStatus = "failed";
      failed.push({ voterId: voter._id.toString(), email: voter.email });
    }

    await voter.save();
    await sleep(INTER_SEND_DELAY_MS);
  }

  const remaining = parsed.data.voterIds
    ? 0
    : await VoterToken.countDocuments({
        election: election._id,
        invitationStatus: "pending",
        exhaustedAt: null,
      });

  return { success: true, sent, failed, remaining };
}
