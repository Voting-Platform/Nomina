import { z } from "zod";
import { objectIdSchema } from "./common";

export const updateAccessSettingsSchema = z.object({
  electionId: objectIdSchema,
  settings: z.object({
    accessType: z.enum(["public", "protected"]).optional(),
    pinEnabled: z.boolean().optional(),
    otpRequired: z.boolean().optional(),
    collectVoterDetails: z.boolean().optional(),
    revealVoterIdentities: z.boolean().optional(),
  }),
});
