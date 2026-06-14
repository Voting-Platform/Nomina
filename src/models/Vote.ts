import { Schema, model, models } from "mongoose";

const VoteSchema = new Schema(
  {
    // ─── References ───
    election: {
      type: Schema.Types.ObjectId,
      ref: "Election",
      required: true,
    },
    candidate: {
      type: Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },

    // ─── Voter Identity ───
    // Exactly one identity source per vote; voterKey is always present.
    voter: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null, // legacy votes only
    },
    voterToken: {
      type: Schema.Types.ObjectId,
      ref: "VoterToken",
      default: null, // protected elections
    },
    // "user:<userId>" | "token:<voterTokenId>" | "anon:<uuid>"
    voterKey: { type: String, required: true },

    // Collected when election.collectVoterDetails is enabled
    voterDetails: {
      name: { type: String, default: null },
      email: { type: String, default: null },
    },

    // ─── Audit ───
    castedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ─── Indexes ───
// Tally votes per candidate
VoteSchema.index({ election: 1, candidate: 1 });

// Per-voter counting, duplicate checks, unique-voter aggregation.
// Intentionally NOT unique: one voter may cast multiple votes for the same
// candidate when maxVotesPerCandidate > 1 (one Vote document per vote).
// Single-submission is enforced at the application layer (atomic token
// claim for protected elections; signed cookie + existing-vote check for
// public elections).
VoteSchema.index({ election: 1, voterKey: 1 });

export const Vote = models.Vote || model("Vote", VoteSchema);
