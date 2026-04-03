import { Schema, model, models } from "mongoose";

const CandidateSchema = new Schema(
  {
    // ─── Parent Election ───
    election: {
      type: Schema.Types.ObjectId,
      ref: "Election",
      required: true,
    },

    // ─── Candidate Info ───
    name: { type: String, required: true },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: null },
    position: { type: Number, default: 0 },

    // ─── Per-Candidate Voting Privileges (NVP-33) ───
    maxVotesReceivable: { type: Number, default: null }, // null = unlimited
    isEligibleForVoting: { type: Boolean, default: true },

    // ─── Soft Delete ───
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ─── Indexes ───
CandidateSchema.index({ election: 1, position: 1 });
CandidateSchema.index({ election: 1, deletedAt: 1 });

export const Candidate =
  models.Candidate || model("Candidate", CandidateSchema);
