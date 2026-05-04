import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Db = Prisma.TransactionClient | typeof prisma;

export async function appendVersion(
  tx: Prisma.TransactionClient,
  noteId: string,
  body: string,
) {
  const max = await tx.version.aggregate({
    where: { noteId },
    _max: { version: true },
  });
  const next = (max._max.version ?? 0) + 1;
  return tx.version.create({ data: { noteId, version: next, body } });
}

export function listByNote(noteId: string, db: Db = prisma) {
  return db.version.findMany({
    where: { noteId },
    orderBy: { version: "desc" },
  });
}

export function getByNoteAndVersion(
  noteId: string,
  version: number,
  db: Db = prisma,
) {
  return db.version.findUnique({
    where: { noteId_version: { noteId, version } },
  });
}
