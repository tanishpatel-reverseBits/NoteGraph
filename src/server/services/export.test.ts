import { describe, expect, test } from "vitest";
import JSZip from "jszip";
import {
  buildBulkZip,
  buildLinkIndex,
  noteToJson,
  noteToMarkdown,
  safeFilename,
  type ExportableNote,
} from "@/server/services/export";

function makeNote(overrides: Partial<ExportableNote> = {}): ExportableNote {
  return {
    id: "note-id-12345678",
    title: "Sample Note",
    body: "Hello world",
    tags: [],
    isPlaceholder: false,
    deletedAt: null,
    createdAt: new Date("2025-01-02T03:04:05.000Z"),
    updatedAt: new Date("2025-01-02T03:04:05.000Z"),
    ...overrides,
  };
}

describe("noteToMarkdown", () => {
  test("emits frontmatter + body", () => {
    const md = noteToMarkdown(
      makeNote({ tags: ["a", "b"], body: "Body line" }),
    );
    expect(md).toContain("---");
    expect(md).toContain('title: "Sample Note"');
    expect(md).toContain('tags: ["a", "b"]');
    expect(md.endsWith("Body line")).toBe(true);
  });

  test("escapes quotes in title", () => {
    const md = noteToMarkdown(makeNote({ title: 'She said "hi"' }));
    expect(md).toContain('title: "She said \\"hi\\""');
  });

  test("preserves wikilinks raw in body", () => {
    const md = noteToMarkdown(makeNote({ body: "Refs [[Other]]" }));
    expect(md).toContain("[[Other]]");
  });

  test("includes deletedAt when set", () => {
    const md = noteToMarkdown(
      makeNote({ deletedAt: new Date("2025-02-01T00:00:00.000Z") }),
    );
    expect(md).toContain("deletedAt:");
  });

  test("empty body still valid", () => {
    const md = noteToMarkdown(makeNote({ body: "" }));
    expect(md).toMatch(/---\n[\s\S]*---\n\n$/);
  });
});

describe("noteToJson", () => {
  test("omits prisma-internal fields and keeps shape", () => {
    const note = makeNote();
    const json = noteToJson(note);
    expect(json).toEqual({
      id: note.id,
      title: note.title,
      body: note.body,
      tags: note.tags,
      isPlaceholder: note.isPlaceholder,
      deletedAt: note.deletedAt,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    });
    expect(Object.keys(json)).not.toContain("searchVector");
  });
});

describe("safeFilename", () => {
  test("slugifies title", () => {
    expect(safeFilename("My Awesome Note", "abcdefgh")).toBe(
      "my-awesome-note-abcdefgh",
    );
  });

  test("strips path traversal characters", () => {
    expect(safeFilename("../etc/passwd", "abcdefgh")).toBe("etcpasswd-abcdefgh");
  });

  test("falls back to 'note' for empty slug", () => {
    expect(safeFilename("///", "abcdefgh")).toBe("note-abcdefgh");
  });

  test("truncates long titles", () => {
    const long = "x".repeat(200);
    const out = safeFilename(long, "abcdefgh");
    expect(out.length).toBeLessThanOrEqual(80 + 1 + 8);
  });

  test("uses last 8 chars of id for disambiguation", () => {
    expect(safeFilename("Note", "fullidvalue123")).toBe("note-value123");
  });
});

describe("buildLinkIndex", () => {
  test("resolves wikilinks across notes", () => {
    const a = makeNote({ id: "a", title: "A", body: "see [[B]] and [[Missing]]" });
    const b = makeNote({ id: "b", title: "B", body: "back to [[A]]" });
    const index = buildLinkIndex([a, b]);
    expect(index.a).toEqual([
      { targetTitle: "B", targetId: "b", isResolved: true },
      { targetTitle: "Missing", targetId: null, isResolved: false },
    ]);
    expect(index.b).toEqual([
      { targetTitle: "A", targetId: "a", isResolved: true },
    ]);
  });

  test("empty body yields no entries", () => {
    const n = makeNote({ id: "x", body: "" });
    expect(buildLinkIndex([n])).toEqual({ x: [] });
  });
});

describe("buildBulkZip", () => {
  test("excludes trashed and placeholder notes by default", async () => {
    const active = makeNote({ id: "a", title: "Active" });
    const trashed = makeNote({
      id: "b",
      title: "Trashed",
      deletedAt: new Date(),
    });
    const placeholder = makeNote({
      id: "c",
      title: "Placeholder",
      isPlaceholder: true,
    });

    const buf = await buildBulkZip({
      notes: [active, trashed, placeholder],
      includeTrash: false,
      includeVersions: false,
    });

    const zip = await JSZip.loadAsync(buf);
    const names = Object.keys(zip.files);
    expect(names).toContain("index.json");
    expect(names.some((n) => n.startsWith("active-"))).toBe(true);
    expect(names.some((n) => n.startsWith("trashed-"))).toBe(false);
    expect(names.some((n) => n.startsWith("placeholder-"))).toBe(false);
  });

  test("includes trashed when flag set", async () => {
    const trashed = makeNote({
      id: "b",
      title: "Trashed",
      deletedAt: new Date(),
    });
    const buf = await buildBulkZip({
      notes: [trashed],
      includeTrash: true,
      includeVersions: false,
    });
    const zip = await JSZip.loadAsync(buf);
    const names = Object.keys(zip.files);
    expect(names.some((n) => n.startsWith("trashed-"))).toBe(true);
  });

  test("writes versions json when flag set", async () => {
    const note = makeNote({ id: "a", title: "A" });
    const versions = new Map([
      [
        "a",
        [
          {
            version: 1,
            body: "v1",
            createdAt: new Date("2025-01-01T00:00:00.000Z"),
          },
        ],
      ],
    ]);
    const buf = await buildBulkZip({
      notes: [note],
      versions,
      includeTrash: false,
      includeVersions: true,
    });
    const zip = await JSZip.loadAsync(buf);
    const names = Object.keys(zip.files);
    expect(names.some((n) => n.endsWith(".versions.json"))).toBe(true);
  });

  test("index.json contains link map", async () => {
    const a = makeNote({ id: "a", title: "A", body: "see [[B]]" });
    const b = makeNote({ id: "b", title: "B", body: "" });
    const buf = await buildBulkZip({
      notes: [a, b],
      includeTrash: false,
      includeVersions: false,
    });
    const zip = await JSZip.loadAsync(buf);
    const indexFile = zip.file("index.json");
    expect(indexFile).not.toBeNull();
    const json = JSON.parse(await indexFile!.async("string"));
    expect(json.noteCount).toBe(2);
    expect(json.links.a[0]).toMatchObject({ targetTitle: "B", isResolved: true });
  });

  test("collisions get numeric suffix", async () => {
    const n1 = makeNote({ id: "abcdefg1", title: "Same Title" });
    const n2 = makeNote({ id: "abcdefg2", title: "Same Title" });
    const buf = await buildBulkZip({
      notes: [n1, n2],
      includeTrash: false,
      includeVersions: false,
    });
    const zip = await JSZip.loadAsync(buf);
    const mdFiles = Object.keys(zip.files).filter((n) => n.endsWith(".md"));
    expect(mdFiles).toHaveLength(2);
    expect(new Set(mdFiles).size).toBe(2);
  });
});
