"use server";

import { requireAuth } from "@/lib/api/server/require-auth";
import { getOwnedElection } from "@/lib/api/server/get-owned-election";
import { updateAccessSettingsSchema } from "@/lib/api/server/validation/access-schemas";
import { generateSixDigitCode } from "@/lib/api/server/voting/hash";
import { Vote } from "@/models";
import type { UpdateAccessSettingsInput } from "@/types";

export async function updateAccessSettings(
  electionId: string,
  settings: UpdateAccessSettingsInput
) {
  const user = await requireAuth();

  const parsed = updateAccessSettingsSchema.safeParse({ electionId, settings });
  if (!parsed.success) throw new Error("Invalid input");

  const election = await getOwnedElection(parsed.data.electionId, user.id);
  const input = parsed.data.settings;

  // Switching access type after votes exist would orphan voter identities —
  // block it with a clear message.
  if (
    input.accessType !== undefined &&
    input.accessType !== election.accessType
  ) {
    const hasVotes = await Vote.exists({ election: election._id });
    if (hasVotes) {
      throw new Error(
        "Cannot change the access type after votes have been cast."
      );
    }
    election.accessType = input.accessType;
  }

  if (input.pinEnabled !== undefined) {
    election.pinEnabled = input.pinEnabled;
    if (input.pinEnabled && !election.pin) {
      election.pin = generateSixDigitCode();
    }
  }
  if (input.otpRequired !== undefined) election.otpRequired = input.otpRequired;
  if (input.collectVoterDetails !== undefined) {
    election.collectVoterDetails = input.collectVoterDetails;
  }
  if (input.revealVoterIdentities !== undefined) {
    election.revealVoterIdentities = input.revealVoterIdentities;
  }

  await election.save();

  return {
    success: true,
    accessType: election.accessType,
    pinEnabled: election.pinEnabled,
    pin: election.pin,
    otpRequired: election.otpRequired,
    collectVoterDetails: election.collectVoterDetails,
    revealVoterIdentities: election.revealVoterIdentities,
  };
}
