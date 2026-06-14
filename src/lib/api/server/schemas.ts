import { z } from "zod";

// ─── Cloudinary URL validator ──────────────────────────────────────────────
const cloudinaryUrl = z
  .string()
  .url()
  .refine(
    (url) => {
      try {
        const u = new URL(url);
        return u.protocol === "https:" && u.hostname === "res.cloudinary.com";
      } catch {
        return false;
      }
    },
    { message: "Image must be uploaded via the platform" }
  );

// ─── Domain format ─────────────────────────────────────────────────────────
const domainSchema = z
  .string()
  .min(3)
  .max(253)
  .regex(
    /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
    "Invalid domain (e.g. example.com)"
  );

// ─── Election schemas ──────────────────────────────────────────────────────
export const CreateCandidateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  imageUrl: cloudinaryUrl.optional(),
});

export const UpdateCandidateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  // null = remove photo; Cloudinary URL = set new photo; undefined = no change
  imageUrl: z.union([cloudinaryUrl, z.null()]).optional(),
});

export const VotingRulesSchema = z.object({
  maxTotalVotesPerVoter: z.number().int().min(1).max(1000),
  maxVotesPerCandidate: z.number().int().min(1).max(1000),
  allowVoterVisibility: z.boolean(),
});

export const VoterBaseSchema = z.object({
  mode: z.enum(["anyone_with_link", "restricted_emails", "restricted_domain"]),
  emails: z.array(z.string().email().max(254)).max(1000).optional(),
  domains: z.array(domainSchema).max(100).optional(),
});

export const SchedulingSchema = z.object({
  mode: z.enum(["manual", "automatic"]),
  scheduledStartAt: z.string().datetime({ offset: true }).optional(),
  scheduledEndAt: z.string().datetime({ offset: true }).optional(),
});

export const CreateElectionSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(2000, "Description too long").optional(),
  candidates: z.array(CreateCandidateSchema).max(100, "Too many candidates"),
  votingRules: VotingRulesSchema,
  voterBase: VoterBaseSchema,
  scheduling: SchedulingSchema,
});

export const UpdateElectionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  voterBaseMode: z
    .enum(["anyone_with_link", "restricted_emails", "restricted_domain"])
    .optional(),
  allowedVoterEmails: z.array(z.string().email().max(254)).max(1000).optional(),
  allowedVoterDomains: z.array(domainSchema).max(100).optional(),
});
