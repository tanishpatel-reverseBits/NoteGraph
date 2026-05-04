import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { noteCreateSchema, noteSearchSchema } from "@/lib/schemas/note";
import * as notesRepo from "@/server/repos/notes";
import * as versionsRepo from "@/server/repos/versions";
import { syncLinksForNote } from "@/server/services/link-sync";
import { healIncomingLinks } from "@/server/services/healing";
import { AppError } from "@/server/errors";
import { handleUnknown, json, parseBody, parseQuery } from "@/server/http";

export async function GET(request: NextRequest) {
  try {
    const params = parseQuery(request, noteSearchSchema);
    const notes = await notesRepo.listActive(params);
    return json({ notes });
  } catch (e) {
    return handleUnknown(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = await parseBody(request, noteCreateSchema);

    const note = await prisma.$transaction(async (tx) => {
      const existing = await notesRepo.findByTitle(input.title, tx);

      let saved;
      if (existing) {
        if (existing.deletedAt !== null) {
          saved = await tx.note.update({
            where: { id: existing.id },
            data: {
              body: input.body,
              tags: input.tags,
              isPlaceholder: false,
              deletedAt: null,
            },
          });
        } else if (!existing.isPlaceholder) {
          throw AppError.conflict("Note with this title already exists");
        } else {
          saved = await notesRepo.updateNote(
            existing.id,
            { body: input.body, tags: input.tags, isPlaceholder: false },
            tx,
          );
        }
      } else {
        saved = await notesRepo.createNote(input, tx);
      }

      await versionsRepo.appendVersion(tx, saved.id, saved.body);
      await syncLinksForNote(tx, saved.id, saved.body);
      await healIncomingLinks(tx, saved.id, saved.title);
      return saved;
    });

    return json({ note }, 201);
  } catch (e) {
    return handleUnknown(e);
  }
}
