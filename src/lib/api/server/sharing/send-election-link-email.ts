"use server";

import { connectDB } from "@/config";
import { Election } from "@/models";
import { requireAuth, assertObjectId } from "@/lib/api/server/require-auth";

export async function sendElectionLinkEmail(
  electionId: string,
  emails: string[]
) {
  const user = await requireAuth();
  assertObjectId(electionId, "Election");

  await connectDB();

  const election = await Election.findOne({
    _id: electionId,
    deletedAt: null,
  });
  if (!election || election.createdBy.toString() !== user.id) {
    throw new Error("Election not found");
  }

  if (!Array.isArray(emails) || emails.length > 200) {
    throw new Error("Too many email addresses (max 200 per send)");
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
