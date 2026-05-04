import { z } from "zod";

export const versionNumSchema = z.coerce.number().int().positive();

export const versionParamsSchema = z.object({
  id: z.string().min(1),
  v: versionNumSchema,
});

export const diffQuerySchema = z
  .object({
    from: versionNumSchema,
    to: versionNumSchema,
  })
  .refine((v) => v.from !== v.to, { message: "from and to must differ" });

export type VersionParams = z.infer<typeof versionParamsSchema>;
export type DiffQuery = z.infer<typeof diffQuerySchema>;
