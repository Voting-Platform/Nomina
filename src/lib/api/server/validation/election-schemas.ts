import { z } from "zod";
import { emailSchema } from "./common";

export const candidateInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
  imageUrl: z
    .string()
    .url()
    .refine((u) => u.startsWith("https://res.cloudinary.com/"), {
      message: "Image must be a Cloudinary URL",
    })
    .optional()
    .or(z.literal("")),
});

export const votingRulesSchema = z.object({
  maxTotalVotesPerVoter: z.number().int().min(1).max(100),
  maxVotesPerCandidate: z.number().int().min(1).max(100),
});

export const voterEntrySchema = z.object({
  email: emailSchema,
  name: z.string().trim().max(120).optional(),
});

export const voterAccessSchema = z
  .object({
    accessType: z.enum(["public", "protected"]),
    pinEnabled: z.boolean(),
    otpRequired: z.boolean(),
    collectVoterDetails: z.boolean(),
    revealVoterIdentities: z.boolean(),
    voters: z.array(voterEntrySchema).max(2000),
  })
  .refine(
    (v) => v.accessType !== "protected" || v.voters.length >= 1,
    { message: "Protected elections need at least one voter" }
  );

// Accepts datetime-local values ("2026-06-12T10:00") as well as full ISO strings
const parseableDate = z
  .string()
  .max(40)
  .refine((s) => !Number.isNaN(Date.parse(s)), { message: "Invalid date" });

export const schedulingSchema = z.object({
  mode: z.enum(["manual", "automatic"]),
  scheduledStartAt: parseableDate.optional().or(z.literal("")),
  scheduledEndAt: parseableDate.optional().or(z.literal("")),
});

export const createElectionSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(5000).optional(),
  candidates: z.array(candidateInputSchema).min(2).max(100),
  votingRules: votingRulesSchema,
  voterAccess: voterAccessSchema,
  scheduling: schedulingSchema,
});

export const updateElectionSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  description: z.string().trim().max(5000).optional(),
});
