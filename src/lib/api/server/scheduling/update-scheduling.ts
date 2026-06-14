"use server";

import { requireAuth } from "@/lib/api/server/require-auth";
import { getOwnedElection } from "@/lib/api/server/get-owned-election";
import { schedulingSchema } from "@/lib/api/server/validation/election-schemas";
import type { SchedulingInput } from "@/types";

export async function updateScheduling(
  electionId: string,
  config: SchedulingInput
) {
  const user = await requireAuth();

  const parsed = schedulingSchema.safeParse(config);
  if (!parsed.success) throw new Error("Invalid scheduling configuration");

  const election = await getOwnedElection(electionId, user.id);

  if (!["draft", "scheduled"].includes(election.status)) {
    throw new Error("Cannot change scheduling for an active or closed election");
  }

  election.schedulingMode = config.mode;

  if (config.mode === "automatic") {
    if (!config.scheduledStartAt || !config.scheduledEndAt) {
      throw new Error("Start and end times are required for automatic scheduling");
    }

    const startAt = new Date(config.scheduledStartAt);
    const endAt = new Date(config.scheduledEndAt);

    if (startAt >= endAt) {
      throw new Error("Start time must be before end time");
    }

    election.scheduledStartAt = startAt;
    election.scheduledEndAt = endAt;

    if (startAt > new Date()) {
      election.status = "scheduled";
    } else if (endAt > new Date()) {
      election.status = "open";
      election.manuallyOpenedAt = new Date();
    }
  } else {
    election.scheduledStartAt = null;
    election.scheduledEndAt = null;
    election.status = "draft";
  }

  await election.save();

  const result = election.toObject();
  result._id = result._id.toString();
  return result;
}
