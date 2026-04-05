import { Schema, model, models } from "mongoose";

const ElectionSchema = new Schema(
  {
    // ─── Core Info ───
    title: { type: String, required: true },
    description: { type: String, default: "" },
    slug: { type: String, unique: true, required: true },

    // ─── Ownership ───
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ─── Status ───
    status: {
      type: String,
      enum: ["draft", "scheduled", "open", "closed", "archived"],
      default: "draft",
    },

    // ─── Scheduling (NVP-32) ───
    schedulingMode: {
      type: String,
      enum: ["manual", "automatic"],
      default: "manual",
    },
    scheduledStartAt: { type: Date, default: null },
    scheduledEndAt: { type: Date, default: null },
    manuallyOpenedAt: { type: Date, default: null },
    manuallyClosedAt: { type: Date, default: null },

    // ─── Voting Rules (NVP-33) ───
    maxTotalVotesPerVoter: { type: Number, default: 1 },
    maxVotesPerCandidate: { type: Number, default: 1 },
    allowVoterVisibility: { type: Boolean, default: false },

    // ─── Voter Base ───
    voterBaseMode: {
      type: String,
      enum: ["anyone_with_link", "restricted_emails", "restricted_domain"],
      default: "anyone_with_link",
    },
    allowedVoterEmails: [{ type: String }],
    allowedVoterDomains: [{ type: String }],

    // ─── Sharing ───
    electionLink: { type: String },

    // ─── Soft Delete ───
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ─── Indexes ───
ElectionSchema.index({ createdBy: 1, deletedAt: 1 });
ElectionSchema.index({ status: 1 });

export const Election = models.Election || model("Election", ElectionSchema);
