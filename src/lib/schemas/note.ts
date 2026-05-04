import { z } from "zod";

export const titleSchema = z
  .string()
  .min(1, "Title required")
  .max(200, "Title max 200 chars")
  .refine((v) => v === v.trim(), "No leading/trailing whitespace")
  .refine((v) => !v.includes("[[") && !v.includes("]]"), "Title cannot contain [[ or ]]");

export const tagSchema = z
  .string()
  .min(1)
  .max(50)
  .refine((v) => v === v.trim(), "No leading/trailing whitespace");

export const tagsSchema = z.array(tagSchema).max(50).default([]);

export const bodySchema = z.string().max(1_000_000).default("");

export const noteCreateSchema = z.object({
  title: titleSchema,
  body: bodySchema,
  tags: tagsSchema,
});

export const noteUpdateSchema = z
  .object({
    title: titleSchema.optional(),
    body: bodySchema.optional(),
    tags: tagsSchema.optional(),
  })
  .refine((v) => v.title !== undefined || v.body !== undefined || v.tags !== undefined, {
    message: "At least one field required",
  });

export const noteSearchSchema = z.object({
  q: z.string().trim().max(200).optional(),
  tag: z.string().trim().max(50).optional(),
});

export const titleQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
});

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export type NoteCreateInput = z.infer<typeof noteCreateSchema>;
export type NoteUpdateInput = z.infer<typeof noteUpdateSchema>;
export type NoteSearchInput = z.infer<typeof noteSearchSchema>;
