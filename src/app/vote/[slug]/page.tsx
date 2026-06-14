import { notFound } from "next/navigation";
import { getPublicElection } from "@/lib/api/server/voting/get-public-election";
import {
  getVoterSession,
  hasVotedCookie,
} from "@/lib/api/server/voting/voter-session";
import { getVoterTokenStatus } from "@/lib/api/server/voting/token-status";
import { VoterStatusScreen } from "@/components/molecules/voterStatusScreen";
import {
  PinGate,
  OtpGate,
  VoterDetailsForm,
  BallotForm,
} from "@/components/organisms/votePage";

export const dynamic = "force-dynamic";

interface VotePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}

/**
 * Voter-facing election page. The server component is the access-flow
 * state machine: every gate is re-checked here on each render, and the
 * client gate components only call server actions + router.refresh().
 */
export default async function VotePage({ params, searchParams }: VotePageProps) {
  const { slug } = await params;
  const { token } = await searchParams;

  const election = await getPublicElection(slug);
  if (!election) notFound();

  // ─── Election status gates ───
  if (election.status === "draft" || election.status === "archived") {
    return (
      <VoterStatusScreen variant="not_available" electionTitle={election.title} />
    );
  }
  if (election.status === "scheduled") {
    return (
      <VoterStatusScreen
        variant="scheduled"
        electionTitle={election.title}
        opensAt={election.scheduledStartAt}
      />
    );
  }
  if (election.status === "closed") {
    return <VoterStatusScreen variant="closed" electionTitle={election.title} />;
  }

  // ─── Already voted (browser guard) ───
  if (await hasVotedCookie(election._id)) {
    return <VoterStatusScreen variant="voted" electionTitle={election.title} />;
  }

  const session = await getVoterSession(election._id);

  if (election.accessType === "protected") {
    // Identity comes from the session (post-OTP) or the link token.
    if (session?.tokenId) {
      const status = await getVoterTokenStatus(election._id, {
        tokenId: session.tokenId,
      });
      if (status.status === "exhausted") {
        return <VoterStatusScreen variant="voted" electionTitle={election.title} />;
      }
      if (status.status === "invalid") {
        return (
          <VoterStatusScreen variant="invalid_link" electionTitle={election.title} />
        );
      }
      if (election.collectVoterDetails && !session.details) {
        return (
          <VoterDetailsForm
            slug={election.slug}
            electionTitle={election.title}
            prefillName={status.name ?? ""}
            prefillEmail={status.email}
          />
        );
      }
      return <BallotForm election={election} />;
    }

    if (!token) {
      return (
        <VoterStatusScreen variant="missing_token" electionTitle={election.title} />
      );
    }

    const status = await getVoterTokenStatus(election._id, { rawToken: token });
    if (status.status === "invalid") {
      return (
        <VoterStatusScreen variant="invalid_link" electionTitle={election.title} />
      );
    }
    if (status.status === "exhausted") {
      return <VoterStatusScreen variant="voted" electionTitle={election.title} />;
    }

    if (election.otpRequired) {
      return (
        <OtpGate
          slug={election.slug}
          electionTitle={election.title}
          token={token}
          maskedEmail={status.maskedEmail}
        />
      );
    }

    if (election.collectVoterDetails) {
      return (
        <VoterDetailsForm
          slug={election.slug}
          electionTitle={election.title}
          token={token}
          prefillName={status.name ?? ""}
          prefillEmail={status.email}
        />
      );
    }

    return <BallotForm election={election} token={token} />;
  }

  // ─── Public election ───
  if (election.pinEnabled && !session) {
    return <PinGate slug={election.slug} electionTitle={election.title} />;
  }

  if (election.collectVoterDetails && !session?.details) {
    return (
      <VoterDetailsForm slug={election.slug} electionTitle={election.title} />
    );
  }

  return <BallotForm election={election} />;
}
