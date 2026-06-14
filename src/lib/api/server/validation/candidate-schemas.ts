import { z } from "zod";
import { objectIdSchema } from "./common";

const cloudinaryUrlSchema = z
  .string()
  .url()
  .refine((u) => u.startsWith("https://res.cloudinary.com/"), {
    message: "Image must be a Cloudinary URL",
  });

export const addCandidateSchema = z.object({
  electionId: objectIdSchema,
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
  imageUrl: cloudinaryUrlSchema.optional().or(z.literal("")),
});

export const updateCandidateSchema = z.object({
  candidateId: objectIdSchema,
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  imageUrl: cloudinaryUrlSchema.nullable().optional().or(z.literal("")),
});

export const removeCandidateSchema = z.object({
  candidateId: objectIdSchema,
});

export const reorderCandidatesSchema = z.object({
  electionId: objectIdSchema,
  orderedIds: z.array(objectIdSchema).min(1).max(100),
});

export const candidatePrivilegesSchema = z.object({
  candidateId: objectIdSchema,
  maxVotesReceivable: z.number().int().min(1).max(1_000_000).nullable(),
  isEligibleForVoting: z.boolean(),
});
