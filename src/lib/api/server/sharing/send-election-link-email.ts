"use server";

import { connectDB } from "@/config";
import { Election } from "@/models";
import { requireAuth } from "@/lib/api/server/require-auth";

export async function sendElectionLinkEmail(
  electionId: string,
  emails: string[]
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

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validEmails = emails.filter((e) => emailRegex.test(e.trim()));

  if (validEmails.length === 0) {
    throw new Error("No valid email addresses provided");
  }

  if (!election.electionLink) {
    election.electionLink = `${process.env.APP_BASE_URL}/vote/${election.slug}`;
    await election.save();
  }

  // TODO: Integrate email service (Resend, SendGrid, etc.)

  return {
    success: true,
    sentTo: validEmails,
    link: election.electionLink,
  };
}
