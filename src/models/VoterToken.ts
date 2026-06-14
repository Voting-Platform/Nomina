import { Schema, model, models } from "mongoose";

const VoterTokenSchema = new Schema(
  {
    // ─── Parent Election ───
    election: {
      type: Schema.Types.ObjectId,
      ref: "Election",
      required: true,
    },

    // ─── Voter Identity ───
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, default: null },

    // ─── Token ───
    // sha256 hex of the raw token; the raw token only exists in the
    // invitation email. Null until the first invitation is sent.
    tokenHash: { type: String, default: null },

    // ─── Consumption ───
    votesUsed: { type: Number, default: 0 },
    exhaustedAt: { type: Date, default: null },

    // ─── Invitation Lifecycle ───
    invitationStatus: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
    },
    invitationSentAt: { type: Date, default: null },

    // ─── OTP ───
    otpHash: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
    otpAttempts: { type: Number, default: 0 },
    otpLastSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ─── Indexes ───
// One token per email per election
VoterTokenSchema.index({ election: 1, email: 1 }, { unique: true });

// Token lookup at vote time — partial index so null tokenHash docs are never indexed
// (sparse alone still indexes explicit null values in MongoDB, causing dup key errors)
VoterTokenSchema.index(
  { tokenHash: 1 },
  {
    unique: true,
    partialFilterExpression: { tokenHash: { $type: "string" } },
  }
);

// Roster filtering by invitation status
VoterTokenSchema.index({ election: 1, invitationStatus: 1 });

export const VoterToken =
  models.VoterToken || model("VoterToken", VoterTokenSchema);
