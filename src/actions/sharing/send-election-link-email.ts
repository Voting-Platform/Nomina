"use server";

import { connectDB } from "@/lib/db";
import { Election } from "@/models/Election";
import { getOrSyncDbUser } from "@/actions/user";

/**
 * Sends election link to a list of email addresses.
 * STUB: Currently just validates and returns success.
 * TODO: Integrate with email service (SendGrid, Resend, etc.)
 */
export async function sendElectionLinkEmail(
  electionId: string,
  emails: string[]
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
    throw new Error("You do not have permission to share this election");
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validEmails = emails.filter((e) => emailRegex.test(e.trim()));

  if (validEmails.length === 0) {
    throw new Error("No valid email addresses provided");
  }

  // Ensure election has a link
  if (!election.electionLink) {
    election.electionLink = `${process.env.APP_BASE_URL}/vote/${election.slug}`;
    await election.save();
  }

  // TODO: Send actual emails
  // For now, return success with the list of emails that would be sent to
  console.log(
    `[sendElectionLinkEmail] Would send ${election.electionLink} to:`,
    validEmails
  );

  return {
    success: true,
    sentTo: validEmails,
    link: election.electionLink,
  };
}
