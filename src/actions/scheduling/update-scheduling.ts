"use server";

import { connectDB } from "@/lib/db";
import { Election } from "@/models/Election";
import { getOrSyncDbUser } from "@/actions/user";
import type { SchedulingInput } from "@/types/election";

/**
 * Updates election scheduling configuration.
 * Switches between manual and automatic modes with date validation.
 */
export async function updateScheduling(
  electionId: string,
  config: SchedulingInput
) {
  const dbUser = await getOrSyncDbUser();
  if (!dbUser) throw new Error("Unauthorized");

  await connectDB();

  const election = await Election.findOne({
    _id: electionId,
    deletedAt: null,
  });
  if (!election) throw new Error("Election not found");
  if (election.createdBy.toString() !== dbUser._id.toString()) {
    throw new Error("You do not have permission to modify this election");
  }

  // Can only change scheduling if election is in draft or scheduled status
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

    // Auto-set status based on timing
    if (startAt > new Date()) {
      election.status = "scheduled";
    } else if (endAt > new Date()) {
      election.status = "open";
      election.manuallyOpenedAt = new Date();
    }
  } else {
    // Manual mode — clear scheduled dates
    election.scheduledStartAt = null;
    election.scheduledEndAt = null;
    election.status = "draft";
  }

  await election.save();

  const result = election.toObject();
  result._id = result._id.toString();
  return result;
}
