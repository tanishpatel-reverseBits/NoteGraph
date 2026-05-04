import type { Prisma } from "@prisma/client";
import { extractWikilinks } from "@/lib/wikilink";
import * as notesRepo from "@/server/repos/notes";
import * as linksRepo from "@/server/repos/links";
import type { LinkEdgeInput } from "@/lib/schemas/link";

export async function syncLinksForNote(
  tx: Prisma.TransactionClient,
  sourceNoteId: string,
  body: string,
): Promise<void> {
  const titles = extractWikilinks(body);
  const edges: LinkEdgeInput[] = [];

  for (const title of titles) {
    const existing = await notesRepo.findByTitle(title, tx);

    if (!existing) {
      const placeholder = await notesRepo.upsertPlaceholder(title, tx);
      if (placeholder.id === sourceNoteId) continue;
      edges.push({ targetTitle: title, targetNoteId: placeholder.id, isBroken: false });
      continue;
    }

    if (existing.id === sourceNoteId) continue;

    if (existing.deletedAt !== null) {
      edges.push({ targetTitle: title, targetNoteId: null, isBroken: true });
      continue;
    }

    edges.push({ targetTitle: title, targetNoteId: existing.id, isBroken: false });
  }

  await linksRepo.replaceForSource(tx, sourceNoteId, edges);
}
