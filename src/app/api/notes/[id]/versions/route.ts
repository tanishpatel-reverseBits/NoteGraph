import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import * as versionsService from "@/server/services/versions";
import { AppError } from "@/server/errors";
import { handleUnknown, json } from "@/server/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const note = await prisma.note.findFirst({ where: { id, deletedAt: null } });
    if (!note) throw AppError.notFound("Note not found");

    const versions = await versionsService.listVersions(id);
    return json({ versions });
  } catch (e) {
    return handleUnknown(e);
  }
}
