"use server";

import { connectDB } from "@/config";
import { Election } from "@/models";
import { requireAuth } from "@/lib/api/server/require-auth";
import type { SchedulingInput } from "@/types";

export async function updateScheduling(
  electionId: string,
  config: SchedulingInput
) {
  const user = await requireAuth();

  await connectDB();

  const election = await Election.findOne({
    _id: electionId,
    deletedAt: null,
  });
  if (!election) throw new Error("Election not found");

  if (election.createdBy.toString() !== user.id) {
    throw new Error("Forbidden");
  }

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
