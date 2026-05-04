import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { LinkEdgeInput } from "@/lib/schemas/link";
import type { Backlink } from "@/lib/types";

type Db = Prisma.TransactionClient | typeof prisma;

export async function replaceForSource(
  tx: Prisma.TransactionClient,
  sourceNoteId: string,
  edges: LinkEdgeInput[],
) {
  await tx.link.deleteMany({ where: { sourceNoteId } });
  if (edges.length === 0) return;
  await tx.link.createMany({
    data: edges.map((e) => ({
      sourceNoteId,
      targetTitle: e.targetTitle,
      targetNoteId: e.targetNoteId,
      isBroken: e.isBroken,
    })),
  });
}

export function markBrokenByTargetId(
  tx: Prisma.TransactionClient,
  targetNoteId: string,
) {
  return tx.link.updateMany({
    where: { targetNoteId },
    data: { targetNoteId: null, isBroken: true },
  });
}

export function healByTitle(
  tx: Prisma.TransactionClient,
  title: string,
  newTargetId: string,
) {
  return tx.link.updateMany({
    where: { targetTitle: title, targetNoteId: null },
    data: { targetNoteId: newTargetId, isBroken: false },
  });
}

export async function listIncoming(
  targetNoteId: string,
  db: Db = prisma,
): Promise<Backlink[]> {
  const rows = await db.link.findMany({
    where: { targetNoteId },
    include: {
      source: {
        select: { id: true, title: true, isPlaceholder: true, deletedAt: true },
      },
    },
  });
  return rows
    .filter((r) => r.source.deletedAt === null)
    .map((r) => ({
      id: r.source.id,
      title: r.source.title,
      isPlaceholder: r.source.isPlaceholder,
    }));
}
