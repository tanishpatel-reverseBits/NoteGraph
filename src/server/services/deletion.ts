import type { Note, Prisma } from "@prisma/client";
import * as notesRepo from "@/server/repos/notes";
import * as linksRepo from "@/server/repos/links";
import { healIncomingLinks } from "@/server/services/healing";

export async function softDeleteNote(
  tx: Prisma.TransactionClient,
  noteId: string,
): Promise<Note> {
  const note = await notesRepo.softDelete(noteId, tx);
  await linksRepo.markBrokenByTargetId(tx, noteId);
  return note;
}

export async function restoreNote(
  tx: Prisma.TransactionClient,
  noteId: string,
): Promise<Note> {
  const note = await notesRepo.restore(noteId, tx);
  await healIncomingLinks(tx, noteId, note.title);
  return note;
}
