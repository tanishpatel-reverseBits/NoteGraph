import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const isBuild = process.env.NEXT_PHASE === "phase-production-build";
const parsed = schema.safeParse(process.env);

if (!parsed.success && !isBuild) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = (parsed.success ? parsed.data : (process.env as unknown)) as z.infer<typeof schema>;
