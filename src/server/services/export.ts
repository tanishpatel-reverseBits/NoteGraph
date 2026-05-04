import JSZip from "jszip";
import type { Note, Version } from "@prisma/client";
import { extractWikilinks } from "@/lib/wikilink";

export type ExportableNote = Pick<
  Note,
  | "id"
  | "title"
  | "body"
  | "tags"
  | "isPlaceholder"
  | "deletedAt"
  | "createdAt"
  | "updatedAt"
>;

export type ExportableVersion = Pick<Version, "version" | "body" | "createdAt">;

const FRONTMATTER_DELIM = "---";

function escapeYamlString(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function formatYamlList(items: string[]): string {
  if (items.length === 0) return "[]";
  return `[${items.map(escapeYamlString).join(", ")}]`;
}

export function noteToMarkdown(note: ExportableNote): string {
  const lines = [
    FRONTMATTER_DELIM,
    `id: ${escapeYamlString(note.id)}`,
    `title: ${escapeYamlString(note.title)}`,
    `tags: ${formatYamlList(note.tags)}`,
    `createdAt: ${escapeYamlString(note.createdAt.toISOString())}`,
    `updatedAt: ${escapeYamlString(note.updatedAt.toISOString())}`,
  ];
  if (note.deletedAt) {
    lines.push(`deletedAt: ${escapeYamlString(note.deletedAt.toISOString())}`);
  }
  lines.push(FRONTMATTER_DELIM, "", note.body);
  return lines.join("\n");
}

export function noteToJson(note: ExportableNote) {
  return {
    id: note.id,
    title: note.title,
    body: note.body,
    tags: note.tags,
    isPlaceholder: note.isPlaceholder,
    deletedAt: note.deletedAt,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

export function safeFilename(title: string, id: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(/[^\w\s.-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .slice(0, 80)
    .replace(/^[.-]+|[.-]+$/g, "");
  const safe = slug.length > 0 ? slug : "note";
  return `${safe}-${id.slice(-8)}`;
}

export type LinkIndexEntry = {
  targetTitle: string;
  targetId: string | null;
  isResolved: boolean;
};

export function buildLinkIndex(
  notes: ExportableNote[],
): Record<string, LinkIndexEntry[]> {
  const titleToId = new Map<string, string>();
  for (const n of notes) titleToId.set(n.title, n.id);

  const result: Record<string, LinkIndexEntry[]> = {};
  for (const n of notes) {
    const titles = extractWikilinks(n.body);
    result[n.id] = titles.map((t) => {
      const id = titleToId.get(t) ?? null;
      return { targetTitle: t, targetId: id, isResolved: id !== null };
    });
  }
  return result;
}

export type BulkExportInput = {
  notes: ExportableNote[];
  versions?: Map<string, ExportableVersion[]>;
  includeTrash: boolean;
  includeVersions: boolean;
};

export async function buildBulkZip(input: BulkExportInput): Promise<Uint8Array> {
  const zip = new JSZip();

  const includedNotes = input.includeTrash
    ? input.notes.filter((n) => !n.isPlaceholder)
    : input.notes.filter((n) => n.deletedAt === null && !n.isPlaceholder);

  const usedNames = new Set<string>();
  const fileIndex: Array<{ id: string; title: string; filename: string }> = [];

  for (const note of includedNotes) {
    const base = safeFilename(note.title, note.id);
    let name = `${base}.md`;
    let counter = 1;
    while (usedNames.has(name)) {
      name = `${base}-${counter}.md`;
      counter += 1;
    }
    usedNames.add(name);
    zip.file(name, noteToMarkdown(note));
    fileIndex.push({ id: note.id, title: note.title, filename: name });

    if (input.includeVersions && input.versions) {
      const list = input.versions.get(note.id);
      if (list && list.length > 0) {
        zip.file(`${base}.versions.json`, JSON.stringify(list, null, 2));
      }
    }
  }

  const linkIndex = buildLinkIndex(includedNotes);

  const meta = {
    exportedAt: new Date().toISOString(),
    noteCount: includedNotes.length,
    includeTrash: input.includeTrash,
    includeVersions: input.includeVersions,
    files: fileIndex,
    links: linkIndex,
  };

  zip.file("index.json", JSON.stringify(meta, null, 2));

  return zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}
