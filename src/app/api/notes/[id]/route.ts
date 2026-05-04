import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { noteUpdateSchema } from "@/lib/schemas/note";
import * as notesRepo from "@/server/repos/notes";
import * as linksRepo from "@/server/repos/links";
import { saveNoteWithVersion } from "@/server/services/versions";
import { softDeleteNote } from "@/server/services/deletion";
import { healIncomingLinks } from "@/server/services/healing";
import { renameWikilinks } from "@/lib/wikilink";
import { AppError } from "@/server/errors";
import { handleUnknown, json, parseBody } from "@/server/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const note = await notesRepo.findByIdWithRelations(id);
    if (!note) throw AppError.notFound("Note not found");
    return json({ note });
  } catch (e) {
    return handleUnknown(e);
  }
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const patch = await parseBody(request, noteUpdateSchema);

    const note = await prisma.$transaction(async (tx) => {
      const current = await tx.note.findFirst({
        where: { id, deletedAt: null },
      });
      if (!current) throw AppError.notFound("Note not found");

      let titleChanged = false;
      const oldTitle = current.title;
      if (patch.title !== undefined && patch.title !== current.title) {
        const clash = await notesRepo.findByTitle(patch.title, tx);
        if (clash && clash.id !== id) throw AppError.conflict("Title already in use");
        await notesRepo.updateNote(id, { title: patch.title }, tx);
        titleChanged = true;
      }
      if (patch.tags !== undefined) {
        await notesRepo.updateNote(id, { tags: patch.tags }, tx);
      }

      let saved;
      if (patch.body !== undefined && patch.body !== current.body) {
        const result = await saveNoteWithVersion(tx, id, patch.body);
        saved = result.note;
      } else {
        saved = await tx.note.findUniqueOrThrow({ where: { id } });
      }

      if (titleChanged) {
        const incoming = await linksRepo.listIncoming(id, tx);
        for (const backlink of incoming) {
          if (backlink.id === id) continue;
          const sourceNote = await tx.note.findUnique({ where: { id: backlink.id } });
          if (!sourceNote || sourceNote.deletedAt !== null) continue;
          const renamed = renameWikilinks(sourceNote.body, oldTitle, saved.title);
          if (renamed !== sourceNote.body) {
            await saveNoteWithVersion(tx, sourceNote.id, renamed);
          }
        }
        await healIncomingLinks(tx, id, saved.title);
      }

      return saved;
    });

    return json({ note });
  } catch (e) {
    return handleUnknown(e);
  }
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const note = await prisma.$transaction(async (tx) => {
      const existing = await tx.note.findFirst({ where: { id, deletedAt: null } });
      if (!existing) throw AppError.notFound("Note not found");
      return softDeleteNote(tx, id);
    });
    return json({ note });
  } catch (e) {
    return handleUnknown(e);
  }
}
