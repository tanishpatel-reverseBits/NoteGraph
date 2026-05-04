import { z } from "zod";

export const exportSingleQuerySchema = z.object({
  format: z.enum(["md", "json"]).default("md"),
});

export const exportBulkQuerySchema = z.object({
  format: z.enum(["zip"]).default("zip"),
  includeTrash: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  includeVersions: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

export type ExportSingleFormat = z.infer<typeof exportSingleQuerySchema>["format"];
export type ExportBulkQuery = z.infer<typeof exportBulkQuerySchema>;
