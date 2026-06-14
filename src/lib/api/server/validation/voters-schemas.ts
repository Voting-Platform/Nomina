import { z } from "zod";
import { objectIdSchema } from "./common";
import { voterEntrySchema } from "./election-schemas";

export const addVotersSchema = z.object({
  electionId: objectIdSchema,
  entries: z.array(voterEntrySchema).min(1).max(2000),
});

export const removeVoterSchema = z.object({
  electionId: objectIdSchema,
  voterId: objectIdSchema,
});
