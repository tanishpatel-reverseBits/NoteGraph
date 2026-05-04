import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { versionParamsSchema } from "@/lib/schemas/version";
import * as versionsService from "@/server/services/versions";
import { AppError } from "@/server/errors";
import { handleUnknown, json } from "@/server/http";

type Ctx = { params: Promise<{ id: string; v: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  try {
    const params = versionParamsSchema.parse(await ctx.params);
    const note = await prisma.note.findFirst({
      where: { id: params.id, deletedAt: null },
    });
    if (!note) throw AppError.notFound("Note not found");

    const version = await versionsService.getVersion(params.id, params.v);
    if (!version) throw AppError.notFound("Version not found");

    return json({ version });
  } catch (e) {
    return handleUnknown(e);
  }
}
