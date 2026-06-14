/* ═══════════════════════════════════════════════════════════════
   ELECTION MANAGEMENT — Type Definitions
   Used across models, server actions, and UI components
   ═══════════════════════════════════════════════════════════════ */

// ─── Enums ───

export type ElectionStatus = "draft" | "scheduled" | "open" | "closed" | "archived";
export type SchedulingMode = "manual" | "automatic";
export type AccessType = "public" | "protected";
export type EmailTemplatePreset = "formal" | "casual" | "minimal";
export type InvitationStatus = "pending" | "sent" | "failed";

// ─── Document Types (what comes back from MongoDB) ───

export interface EmailTemplateSettings {
  preset: EmailTemplatePreset;
  /** Empty string = use the preset's default subject. */
  subject: string;
  message: string;
}

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
  accessType: AccessType;
  pinEnabled: boolean;
  pin: string | null;
  otpRequired: boolean;
  collectVoterDetails: boolean;
  revealVoterIdentities: boolean;
  emailTemplate: EmailTemplateSettings;
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
  voter: string | null;
  voterToken: string | null;
  voterKey: string;
  voterDetails: { name: string | null; email: string | null };
  castedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface VoterTokenDocument {
  _id: string;
  election: string;
  email: string;
  name: string | null;
  votesUsed: number;
  exhaustedAt: string | null;
  invitationStatus: InvitationStatus;
  invitationSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Populated / Enriched Types (for UI display) ───

export interface ElectionWithCandidates extends ElectionDocument {
  candidates: CandidateDocument[];
}

export interface CandidateWithVoteCount extends CandidateDocument {
  voteCount: number;
}

export interface ElectionDetailData extends ElectionDocument {
  candidates: CandidateWithVoteCount[];
  totalVotes: number;
  uniqueVoterCount: number;
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

// ─── Voter-Facing Types (sanitized — never include pin/createdBy/emails) ───

export interface PublicCandidateData {
  _id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  position: number;
  isEligibleForVoting: boolean;
  /** True when the candidate reached maxVotesReceivable. */
  isFull: boolean;
}

export interface PublicElectionData {
  _id: string;
  title: string;
  description: string;
  slug: string;
  status: ElectionStatus;
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
  maxTotalVotesPerVoter: number;
  maxVotesPerCandidate: number;
  accessType: AccessType;
  pinEnabled: boolean;
  otpRequired: boolean;
  collectVoterDetails: boolean;
  candidates: PublicCandidateData[];
}

/** The step the voter must complete next, decided server-side. */
export type VoteAccessStep =
  | "pin"
  | "otp"
  | "details"
  | "ballot"
  | "voted"
  | "invalid_token"
  | "missing_token";

export interface BallotSelection {
  candidateId: string;
  count: number;
}

// ─── Voter Log (owner-only, revealVoterIdentities) ───

export interface VoterLogRow {
  voterName: string;
  voterEmail: string;
  candidateName: string;
  votes: number;
  castedAt: string;
}

// ─── Form Input Types (what UI sends to server actions) ───

export interface VoterEntry {
  email: string;
  name?: string;
}

export interface VoterAccessInput {
  accessType: AccessType;
  pinEnabled: boolean;
  otpRequired: boolean;
  collectVoterDetails: boolean;
  revealVoterIdentities: boolean;
  /** Protected elections only: the initial voter roster. */
  voters: VoterEntry[];
}

export interface CreateElectionInput {
  title: string;
  description?: string;
  candidates: CreateCandidateInput[];
  votingRules: VotingRulesInput;
  voterAccess: VoterAccessInput;
  scheduling: SchedulingInput;
}

export interface UpdateElectionInput {
  title?: string;
  description?: string;
}

export interface CreateCandidateInput {
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface UpdateCandidateInput {
  name?: string;
  description?: string;
  /** Pass `null` to remove the candidate photo. */
  imageUrl?: string | null;
}

export interface VotingRulesInput {
  maxTotalVotesPerVoter: number;
  maxVotesPerCandidate: number;
}

export interface CandidatePrivilegesInput {
  maxVotesReceivable: number | null;
  isEligibleForVoting: boolean;
}

export interface UpdateAccessSettingsInput {
  accessType?: AccessType;
  pinEnabled?: boolean;
  otpRequired?: boolean;
  collectVoterDetails?: boolean;
  revealVoterIdentities?: boolean;
}

export interface SchedulingInput {
  mode: SchedulingMode;
  scheduledStartAt?: string;
  scheduledEndAt?: string;
}
