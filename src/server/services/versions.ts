import type { Note, Prisma, Version } from "@prisma/client";
import * as notesRepo from "@/server/repos/notes";
import * as versionsRepo from "@/server/repos/versions";
import { syncLinksForNote } from "@/server/services/link-sync";
import { promotePlaceholderIfNeeded } from "@/server/services/healing";
import { diffBodies } from "@/lib/diff";
import { AppError } from "@/server/errors";
import type { DiffLine } from "@/lib/types";

export async function saveNoteWithVersion(
  tx: Prisma.TransactionClient,
  noteId: string,
  newBody: string,
): Promise<{ note: Note; version: Version }> {
  const note = await notesRepo.updateNote(noteId, { body: newBody }, tx);
  const version = await versionsRepo.appendVersion(tx, noteId, newBody);
  await syncLinksForNote(tx, noteId, newBody);
  await promotePlaceholderIfNeeded(tx, noteId, newBody);
  return { note, version };
}

export function listVersions(noteId: string) {
  return versionsRepo.listByNote(noteId);
}

export function getVersion(noteId: string, version: number) {
  return versionsRepo.getByNoteAndVersion(noteId, version);
}

export async function restoreVersion(
  tx: Prisma.TransactionClient,
  noteId: string,
  versionNum: number,
): Promise<{ note: Note; version: Version }> {
  const snapshot = await versionsRepo.getByNoteAndVersion(noteId, versionNum, tx);
  if (!snapshot) throw AppError.notFound(`Version ${versionNum} not found`);
  return saveNoteWithVersion(tx, noteId, snapshot.body);
}

export async function diffVersions(
  noteId: string,
  vA: number,
  vB: number,
): Promise<DiffLine[]> {
  const [a, b] = await Promise.all([
    versionsRepo.getByNoteAndVersion(noteId, vA),
    versionsRepo.getByNoteAndVersion(noteId, vB),
  ]);
  if (!a) throw AppError.notFound(`Version ${vA} not found`);
  if (!b) throw AppError.notFound(`Version ${vB} not found`);
  return diffBodies(a.body, b.body);
}
