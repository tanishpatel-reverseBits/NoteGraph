import type { Prisma } from "@prisma/client";
import * as linksRepo from "@/server/repos/links";
import * as notesRepo from "@/server/repos/notes";

export async function healIncomingLinks(
  tx: Prisma.TransactionClient,
  noteId: string,
  title: string,
): Promise<void> {
  await linksRepo.healByTitle(tx, title, noteId);
}

export async function promotePlaceholderIfNeeded(
  tx: Prisma.TransactionClient,
  noteId: string,
  newBody: string,
): Promise<void> {
  const note = await tx.note.findUnique({
    where: { id: noteId },
    select: { isPlaceholder: true, title: true },
  });
  if (!note) return;
  if (!note.isPlaceholder) return;
  if (newBody.trim().length === 0) return;

  await notesRepo.updateNote(noteId, { isPlaceholder: false }, tx);
  await healIncomingLinks(tx, noteId, note.title);
}
