import { z } from "zod";
import {
  objectIdSchema,
  slugSchema,
  sixDigitCodeSchema,
  voterTokenSchema,
} from "./common";

export const verifyPinSchema = z.object({
  slug: slugSchema,
  pin: sixDigitCodeSchema,
});

export const resolveTokenSchema = z.object({
  slug: slugSchema,
  token: voterTokenSchema,
});

export const requestOtpSchema = resolveTokenSchema;

export const verifyOtpSchema = z.object({
  slug: slugSchema,
  token: voterTokenSchema,
  code: sixDigitCodeSchema,
});

export const voterDetailsSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  /** Personalized-link token; used to create the session for protected elections. */
  token: voterTokenSchema.optional(),
});

export const castVotesSchema = z.object({
  slug: slugSchema,
  selections: z
    .array(
      z.object({
        candidateId: objectIdSchema,
        count: z.number().int().min(1).max(100),
      })
    )
    .min(1)
    .max(100),
  /** Personalized-link token for protected elections without OTP. */
  token: voterTokenSchema.optional(),
});
