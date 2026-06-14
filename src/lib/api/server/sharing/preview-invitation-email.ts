"use server";

import { requireAuth } from "@/lib/api/server/require-auth";
import { getOwnedElection } from "@/lib/api/server/get-owned-election";
import { previewInvitationEmailSchema } from "@/lib/api/server/validation/sharing-schemas";
import { renderInvitationEmail } from "@/lib/email/render";
import type { EmailTemplateSettings } from "@/types";

/**
 * Renders the invitation email for the composer's live preview iframe.
 * Uses the same renderer as sendInvitations, so the preview is exactly
 * what voters receive (with a placeholder link).
 */
export async function previewInvitationEmail(
  electionId: string,
  template: EmailTemplateSettings
) {
  const user = await requireAuth();

  const parsed = previewInvitationEmailSchema.safeParse({
    electionId,
    template,
  });
  if (!parsed.success) throw new Error("Invalid template");

  const election = await getOwnedElection(parsed.data.electionId, user.id);
  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

  const email = await renderInvitationEmail(parsed.data.template.preset, {
    electionTitle: election.title,
    electionDescription: election.description ?? "",
    ownerName: user.name ?? "The organizer",
    voteUrl: `${baseUrl}/vote/${election.slug}?token=preview`,
    customMessage: parsed.data.template.message,
    customSubject: parsed.data.template.subject,
  });

  return { subject: email.subject, html: email.html };
}
