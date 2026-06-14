import { z } from "zod";
import { objectIdSchema } from "./common";

export const emailTemplateSchema = z.object({
  preset: z.enum(["formal", "casual", "minimal"]),
  subject: z.string().trim().max(200),
  message: z.string().trim().max(2000),
});

export const updateEmailTemplateSchema = z.object({
  electionId: objectIdSchema,
  template: emailTemplateSchema,
});

export const sendInvitationsSchema = z.object({
  electionId: objectIdSchema,
  /** Omit to send to all pending/failed voters (server caps the batch). */
  voterIds: z.array(objectIdSchema).max(25).optional(),
});

export const previewInvitationEmailSchema = z.object({
  electionId: objectIdSchema,
  template: emailTemplateSchema,
});
