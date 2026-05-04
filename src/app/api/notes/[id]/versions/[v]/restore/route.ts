import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { versionParamsSchema } from "@/lib/schemas/version";
import { restoreVersion } from "@/server/services/versions";
import { AppError } from "@/server/errors";
import { handleUnknown, json } from "@/server/http";

type Ctx = { params: Promise<{ id: string; v: string }> };

export async function POST(_request: NextRequest, ctx: Ctx) {
  try {
    const params = versionParamsSchema.parse(await ctx.params);
    const restored = await prisma.$transaction(async (tx) => {
      const note = await tx.note.findFirst({
        where: { id: params.id, deletedAt: null },
      });
      if (!note) throw AppError.notFound("Note not found");
      return restoreVersion(tx, params.id, params.v);
    });
    return json(restored);
  } catch (e) {
    return handleUnknown(e);
  }
}
