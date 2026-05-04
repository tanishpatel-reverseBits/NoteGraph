import { prisma } from "@/lib/prisma";
import type { GraphPayload } from "@/lib/types";

export async function buildGraph(): Promise<GraphPayload> {
  const notes = await prisma.note.findMany({
    where: { deletedAt: null },
    include: { outgoingLinks: true },
    orderBy: { updatedAt: "desc" },
  });

  return {
    nodes: notes.map((note) => ({
      id: note.id,
      title: note.title,
      isPlaceholder: note.isPlaceholder,
      isDeleted: false,
      tagCount: note.tags.length,
    })),
    edges: notes.flatMap((note) =>
      note.outgoingLinks.map((link) => ({
        id: link.id,
        sourceId: link.sourceNoteId,
        targetId: link.targetNoteId,
        targetTitle: link.targetTitle,
        isBroken: link.isBroken,
      })),
    ),
  };
}
