import { z } from "zod";

/** 24-char hex MongoDB ObjectId. */
export const objectIdSchema = z
  .string()
  .regex(/^[a-f0-9]{24}$/i, "Invalid id");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email()
  .max(254);

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9-]+$/, "Invalid slug");

/** 6-digit numeric code (election PIN / email OTP). */
export const sixDigitCodeSchema = z.string().regex(/^\d{6}$/, "Invalid code");

/** Raw voter token as it appears in invitation links (32 hex chars). */
export const voterTokenSchema = z
  .string()
  .regex(/^[a-f0-9]{32}$/i, "Invalid token");
