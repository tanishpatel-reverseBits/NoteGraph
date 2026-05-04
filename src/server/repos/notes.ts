import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Backlink, LinkEdge, NoteWithRelations } from "@/lib/types";

type Db = Prisma.TransactionClient | typeof prisma;

export function findActiveByTitle(title: string, db: Db = prisma) {
  return db.note.findFirst({ where: { title, deletedAt: null } });
}

export function findByTitle(title: string, db: Db = prisma) {
  return db.note.findUnique({ where: { title } });
}

export function findById(id: string, db: Db = prisma) {
  return db.note.findUnique({ where: { id } });
}

export async function findByIdWithRelations(
  id: string,
  db: Db = prisma,
): Promise<NoteWithRelations | null> {
  const note = await db.note.findFirst({
    where: { id, deletedAt: null },
    include: {
      outgoingLinks: true,
      incomingLinks: {
        include: {
          source: {
            select: { id: true, title: true, isPlaceholder: true, deletedAt: true },
          },
        },
      },
    },
  });
  if (!note) return null;

  const backlinks: Backlink[] = note.incomingLinks
    .filter((l) => l.source.deletedAt === null)
    .map((l) => ({
      id: l.source.id,
      title: l.source.title,
      isPlaceholder: l.source.isPlaceholder,
    }));

  const outgoingLinks: LinkEdge[] = note.outgoingLinks.map((l) => ({
    id: l.id,
    sourceId: l.sourceNoteId,
    targetId: l.targetNoteId,
    targetTitle: l.targetTitle,
    isBroken: l.isBroken,
  }));

  return {
    id: note.id,
    title: note.title,
    body: note.body,
    tags: note.tags,
    isPlaceholder: note.isPlaceholder,
    deletedAt: note.deletedAt,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    backlinks,
    outgoingLinks,
  };
}

export function listActive(
  params: { q?: string; tag?: string } = {},
  db: Db = prisma,
) {
  const where: Prisma.NoteWhereInput = { deletedAt: null };
  if (params.q) where.title = { contains: params.q, mode: "insensitive" };
  if (params.tag) where.tags = { has: params.tag };
  return db.note.findMany({ where, orderBy: { updatedAt: "desc" } });
}

type NoteRow = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  isPlaceholder: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function searchNotes(params: { q?: string; tag?: string }) {
  const q = params.q?.trim();
  const tag = params.tag?.trim();

  if (!q) {
    return listActive({ tag });
  }

  const tagFilter = tag ? Prisma.sql`AND ${tag} = ANY("tags")` : Prisma.empty;

  return prisma.$queryRaw<NoteRow[]>(Prisma.sql`
    SELECT "id", "title", "body", "tags", "isPlaceholder",
           "deletedAt", "createdAt", "updatedAt"
    FROM "Note"
    WHERE "deletedAt" IS NULL
      AND (
        "searchVector" @@ websearch_to_tsquery('english', ${q})
        OR "title" ILIKE ${"%" + q + "%"}
      )
      ${tagFilter}
    ORDER BY ts_rank("searchVector", websearch_to_tsquery('english', ${q})) DESC,
             "updatedAt" DESC
    LIMIT 100
  `);
}

export function listDeleted(db: Db = prisma) {
  return db.note.findMany({
    where: { deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
  });
}

export function createNote(
  input: { title: string; body?: string; tags?: string[] },
  db: Db = prisma,
) {
  return db.note.create({
    data: {
      title: input.title,
      body: input.body ?? "",
      tags: input.tags ?? [],
      isPlaceholder: false,
    },
  });
}

export function updateNote(
  id: string,
  patch: { title?: string; body?: string; tags?: string[]; isPlaceholder?: boolean },
  db: Db = prisma,
) {
  return db.note.update({ where: { id }, data: patch });
}

export function softDelete(id: string, db: Db = prisma) {
  return db.note.update({ where: { id }, data: { deletedAt: new Date() } });
}

export function restore(id: string, db: Db = prisma) {
  return db.note.update({ where: { id }, data: { deletedAt: null } });
}

export async function upsertPlaceholder(title: string, db: Db = prisma) {
  try {
    return await db.note.create({
      data: { title, body: "", isPlaceholder: true },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const existing = await db.note.findUnique({ where: { title } });
      if (existing) return existing;
    }
    throw e;
  }
}
