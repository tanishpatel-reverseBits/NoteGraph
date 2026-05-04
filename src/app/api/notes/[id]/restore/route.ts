import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { restoreNote } from "@/server/services/deletion";
import { AppError } from "@/server/errors";
import { handleUnknown, json } from "@/server/http";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const note = await prisma.$transaction(async (tx) => {
      const existing = await tx.note.findUnique({ where: { id } });
      if (!existing) throw AppError.notFound("Note not found");
      if (existing.deletedAt === null) return existing;
      return restoreNote(tx, id);
    });
    return json({ note });
  } catch (e) {
    return handleUnknown(e);
  }
}
