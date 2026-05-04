import { z } from "zod";

export const linkEdgeInputSchema = z.object({
  targetTitle: z.string().min(1),
  targetNoteId: z.string().min(1).nullable(),
  isBroken: z.boolean(),
});

export type LinkEdgeInput = z.infer<typeof linkEdgeInputSchema>;
