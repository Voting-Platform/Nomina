/* ═══════════════════════════════════════════════════════════════
   ELECTION MANAGEMENT — Type Definitions
   Used across models, server actions, and UI components
   ═══════════════════════════════════════════════════════════════ */

// ─── Enums ───

export type ElectionStatus = "draft" | "scheduled" | "open" | "closed" | "archived";
export type SchedulingMode = "manual" | "automatic";
export type VoterBaseMode = "anyone_with_link" | "restricted_emails" | "restricted_domain";

// ─── Document Types (what comes back from MongoDB) ───

export interface ElectionDocument {
  _id: string;
  title: string;
  description: string;
  slug: string;
  createdBy: string;
  status: ElectionStatus;
  schedulingMode: SchedulingMode;
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
  manuallyOpenedAt: string | null;
  manuallyClosedAt: string | null;
  maxTotalVotesPerVoter: number;
  maxVotesPerCandidate: number;
  allowVoterVisibility: boolean;
  voterBaseMode: VoterBaseMode;
  allowedVoterEmails: string[];
  allowedVoterDomains: string[];
  electionLink: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateDocument {
  _id: string;
  election: string;
  name: string;
  description: string;
  imageUrl: string | null;
  position: number;
  maxVotesReceivable: number | null;
  isEligibleForVoting: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface VoteDocument {
  _id: string;
  election: string;
  candidate: string;
  voter: string;
  castedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Populated / Enriched Types (for UI display) ───

export interface ElectionWithCandidates extends ElectionDocument {
  candidates: CandidateDocument[];
}

export interface CandidateWithVoteCount extends CandidateDocument {
  voteCount: number;
}

export interface ElectionSummary {
  _id: string;
  title: string;
  slug: string;
  status: ElectionStatus;
  candidateCount: number;
  totalVotes: number;
  createdAt: string;
}

// ─── Form Input Types (what UI sends to server actions) ───

export interface CreateElectionInput {
  title: string;
  description?: string;
  candidates: CreateCandidateInput[];
  votingRules: VotingRulesInput;
  voterBase: VoterBaseInput;
  scheduling: SchedulingInput;
}

export interface UpdateElectionInput {
  title?: string;
  description?: string;
  voterBaseMode?: VoterBaseMode;
  allowedVoterEmails?: string[];
  allowedVoterDomains?: string[];
}

export interface CreateCandidateInput {
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface UpdateCandidateInput {
  name?: string;
  description?: string;
  imageUrl?: string;
}

export interface VotingRulesInput {
  maxTotalVotesPerVoter: number;
  maxVotesPerCandidate: number;
  allowVoterVisibility: boolean;
}

export interface CandidatePrivilegesInput {
  maxVotesReceivable: number | null;
  isEligibleForVoting: boolean;
}

export interface VoterBaseInput {
  mode: VoterBaseMode;
  emails?: string[];
  domains?: string[];
}

export interface SchedulingInput {
  mode: SchedulingMode;
  scheduledStartAt?: string;
  scheduledEndAt?: string;
}
