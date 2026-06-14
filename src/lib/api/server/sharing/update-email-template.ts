"use server";

import { requireAuth } from "@/lib/api/server/require-auth";
import { getOwnedElection } from "@/lib/api/server/get-owned-election";
import { updateEmailTemplateSchema } from "@/lib/api/server/validation/sharing-schemas";
import type { EmailTemplateSettings } from "@/types";

export async function updateEmailTemplate(
  electionId: string,
  template: EmailTemplateSettings
) {
  const user = await requireAuth();

  const parsed = updateEmailTemplateSchema.safeParse({ electionId, template });
  if (!parsed.success) throw new Error("Invalid template");

  const election = await getOwnedElection(parsed.data.electionId, user.id);

  election.emailTemplate = parsed.data.template;
  await election.save();

  return { success: true };
}
