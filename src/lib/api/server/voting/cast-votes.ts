"use server";

import { randomUUID } from "crypto";
import { Types } from "mongoose";
import { connectDB } from "@/config";
import { Candidate, Election, Vote, VoterToken } from "@/models";
import { checkRateLimit, getClientIp } from "@/lib/api/server/rate-limit";
import { castVotesSchema } from "@/lib/api/server/validation/voting-schemas";
import type { BallotSelection } from "@/types";
import {
  getVoterSession,
  setVoterSession,
  setVotedCookie,
  hasVotedCookie,
  type VoterSessionPayload,
} from "./voter-session";
import { getVoterTokenStatus } from "./token-status";

export interface CastVotesResult {
  ok: boolean;
  error?: string;
}

/**
 * Casts the voter's complete ballot in one submission.
 * One Vote document is created per individual vote so existing tally
 * aggregations keep working.
 */
export async function castVotes(
  slug: string,
  selections: BallotSelection[],
  rawToken?: string
): Promise<CastVotesResult> {
  const parsed = castVotesSchema.safeParse({
    slug,
    selections,
    token: rawToken || undefined,
  });
  if (!parsed.success) return { ok: false, error: "Invalid ballot" };

  await connectDB();

  // ─── 1. Election must be open ───
  const election = await Election.findOne({
    slug: parsed.data.slug,
    deletedAt: null,
  }).lean();

  if (!election) return { ok: false, error: "Election not found" };
  if (election.status !== "open") {
    return { ok: false, error: "This election is not open for voting." };
  }
  if (election.schedulingMode === "automatic") {
    const now = new Date();
    if (
      (election.scheduledStartAt && now < new Date(election.scheduledStartAt)) ||
      (election.scheduledEndAt && now > new Date(election.scheduledEndAt))
    ) {
      return { ok: false, error: "This election is not open for voting." };
    }
  }

  const electionId = election._id.toString();
  const ip = await getClientIp();
  const limit = checkRateLimit(`cast:${electionId}:${ip}`, 10, 60 * 1000);
  if (!limit.ok) {
    return { ok: false, error: "Too many requests. Please try again shortly." };
  }

  // ─── 2. Ballot totals within election rules ───
  const ballot = parsed.data.selections;
  const totalVotes = ballot.reduce((sum, s) => sum + s.count, 0);
  if (totalVotes > election.maxTotalVotesPerVoter) {
    return { ok: false, error: "Too many votes on the ballot." };
  }
  if (ballot.some((s) => s.count > election.maxVotesPerCandidate)) {
    return { ok: false, error: "Too many votes for a single candidate." };
  }
  const uniqueIds = new Set(ballot.map((s) => s.candidateId));
  if (uniqueIds.size !== ballot.length) {
    return { ok: false, error: "Invalid ballot" };
  }

  // ─── 3. Resolve voter identity ───
  let session = await getVoterSession(electionId);
  let voterKey: string;
  let voterTokenId: Types.ObjectId | null = null;

  if (election.accessType === "protected") {
    // Identity comes from the session (set at the OTP/details gate) or,
    // when no gate ran, from the raw token in the personalized link.
    let tokenId = session?.tokenId ?? null;
    if (!tokenId && parsed.data.token && !election.otpRequired) {
      const status = await getVoterTokenStatus(electionId, {
        rawToken: parsed.data.token,
      });
      if (status.status === "exhausted") {
        return { ok: false, error: "You have already voted in this election." };
      }
      if (status.status === "valid") tokenId = status.tokenId;
    }
    if (!tokenId) {
      return { ok: false, error: "Session expired. Reload the page." };
    }
    // Atomic claim: succeeds exactly once per token, so double-submits
    // and parallel requests cannot vote twice.
    const claimed = await VoterToken.findOneAndUpdate(
      {
        _id: tokenId,
        election: election._id,
        exhaustedAt: null,
      },
      { $set: { votesUsed: totalVotes, exhaustedAt: new Date() } },
      { new: true }
    )
      .select("_id")
      .lean();

    if (!claimed) {
      return { ok: false, error: "You have already voted in this election." };
    }
    voterTokenId = claimed._id;
    voterKey = `token:${claimed._id.toString()}`;
  } else {
    // Public election: best-effort browser guard
    if (await hasVotedCookie(electionId)) {
      return { ok: false, error: "You have already voted in this election." };
    }
    if (election.pinEnabled && !session) {
      return { ok: false, error: "Session expired. Reload the page." };
    }
    if (!session) {
      session = {
        electionId,
        voterId: randomUUID(),
        method: "open",
      } satisfies VoterSessionPayload;
      await setVoterSession(session);
    }
    voterKey = `anon:${session.voterId}`;
    const existing = await Vote.exists({ election: election._id, voterKey });
    if (existing) {
      return { ok: false, error: "You have already voted in this election." };
    }
  }

  const rollbackClaim = async () => {
    if (voterTokenId) {
      await VoterToken.updateOne(
        { _id: voterTokenId },
        { $set: { votesUsed: 0, exhaustedAt: null } }
      );
    }
  };

  // ─── 4. Collected details required? ───
  if (election.collectVoterDetails && !session?.details) {
    await rollbackClaim();
    return { ok: false, error: "Please provide your details before voting." };
  }

  // ─── 5. Validate candidates ───
  const candidateIds = ballot.map((s) => new Types.ObjectId(s.candidateId));
  const candidates = await Candidate.find({
    _id: { $in: candidateIds },
    election: election._id,
    deletedAt: null,
  })
    .select("_id name isEligibleForVoting maxVotesReceivable")
    .lean();

  if (candidates.length !== ballot.length) {
    await rollbackClaim();
    return { ok: false, error: "One of the selected candidates is unavailable." };
  }

  const ineligible = candidates.find((c) => c.isEligibleForVoting === false);
  if (ineligible) {
    await rollbackClaim();
    return {
      ok: false,
      error: `${ineligible.name} is not eligible to receive votes.`,
    };
  }

  const capped = candidates.filter((c) => c.maxVotesReceivable !== null);
  if (capped.length > 0) {
    const counts = await Vote.aggregate([
      {
        $match: {
          election: election._id,
          candidate: { $in: capped.map((c) => c._id) },
        },
      },
      { $group: { _id: "$candidate", count: { $sum: 1 } } },
    ]);
    const countMap = new Map<string, number>(
      counts.map((c) => [c._id.toString(), c.count])
    );
    for (const c of capped) {
      const requested =
        ballot.find((s) => s.candidateId === c._id.toString())?.count ?? 0;
      const current = countMap.get(c._id.toString()) ?? 0;
      if (current + requested > (c.maxVotesReceivable as number)) {
        await rollbackClaim();
        return {
          ok: false,
          error: `${c.name} has reached the maximum number of votes.`,
        };
      }
    }
  }

  // ─── 6. Insert votes ───
  const details = election.collectVoterDetails
    ? {
        name: session?.details?.name ?? null,
        email: session?.details?.email ?? null,
      }
    : { name: null, email: null };

  const docs = ballot.flatMap((s) =>
    Array.from({ length: s.count }, () => ({
      election: election._id,
      candidate: new Types.ObjectId(s.candidateId),
      voter: null,
      voterToken: voterTokenId,
      voterKey,
      voterDetails: details,
      castedAt: new Date(),
    }))
  );

  try {
    await Vote.insertMany(docs);
  } catch {
    await rollbackClaim();
    return { ok: false, error: "Could not record your vote. Please try again." };
  }

  // ─── 7. Mark as voted ───
  await setVotedCookie(electionId);
  return { ok: true };
}
