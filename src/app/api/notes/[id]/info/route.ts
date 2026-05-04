import type { NextRequest } from "next/server";
import * as notesRepo from "@/server/repos/notes";
import { AppError } from "@/server/errors";
import { handleUnknown, json } from "@/server/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const note = await notesRepo.findById(id);
    if (!note) throw AppError.notFound("Note not found");
    return json({
      id: note.id,
      title: note.title,
      deletedAt: note.deletedAt,
      isPlaceholder: note.isPlaceholder,
    });
  } catch (e) {
    return handleUnknown(e);
  }
}
