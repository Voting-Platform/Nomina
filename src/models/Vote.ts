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
    voter: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ─── Audit ───
    castedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ─── Indexes ───
// Enforce vote limits: quickly count votes per voter in an election
VoteSchema.index({ election: 1, voter: 1 });

// Tally votes per candidate
VoteSchema.index({ election: 1, candidate: 1 });

// Prevent exact duplicate votes (same voter → same candidate in same election)
VoteSchema.index(
  { election: 1, voter: 1, candidate: 1 },
  { unique: true }
);

export const Vote = models.Vote || model("Vote", VoteSchema);
