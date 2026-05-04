import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { diffQuerySchema } from "@/lib/schemas/version";
import { diffVersions } from "@/server/services/versions";
import { AppError } from "@/server/errors";
import { handleUnknown, json, parseQuery } from "@/server/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const query = parseQuery(request, diffQuerySchema);
    const note = await prisma.note.findFirst({ where: { id, deletedAt: null } });
    if (!note) throw AppError.notFound("Note not found");

    const diff = await diffVersions(id, query.from, query.to);
    return json({ diff });
  } catch (e) {
    return handleUnknown(e);
  }
}
