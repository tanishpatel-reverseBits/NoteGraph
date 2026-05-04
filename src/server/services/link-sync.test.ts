import { beforeEach, describe, expect, test, vi } from "vitest";
import type { Prisma } from "@prisma/client";

vi.mock("@/server/repos/notes", () => ({
  findByTitle: vi.fn(),
  upsertPlaceholder: vi.fn(),
}));

vi.mock("@/server/repos/links", () => ({
  replaceForSource: vi.fn(),
}));

import * as notesRepo from "@/server/repos/notes";
import * as linksRepo from "@/server/repos/links";
import { syncLinksForNote } from "@/server/services/link-sync";

const tx = {} as Prisma.TransactionClient;
const sourceId = "src-id";

beforeEach(() => {
  vi.resetAllMocks();
});

describe("syncLinksForNote", () => {
  test("creates placeholder + healthy edge for missing title", async () => {
    vi.mocked(notesRepo.findByTitle).mockResolvedValue(null);
    vi.mocked(notesRepo.upsertPlaceholder).mockResolvedValue({
      id: "B-id",
      title: "B",
    } as never);

    await syncLinksForNote(tx, sourceId, "links to [[B]]");

    expect(notesRepo.upsertPlaceholder).toHaveBeenCalledWith("B", tx);
    expect(linksRepo.replaceForSource).toHaveBeenCalledWith(tx, sourceId, [
      { targetTitle: "B", targetNoteId: "B-id", isBroken: false },
    ]);
  });

  test("healthy edge for active note", async () => {
    vi.mocked(notesRepo.findByTitle).mockResolvedValue({
      id: "A-id",
      title: "A",
      deletedAt: null,
      isPlaceholder: false,
    } as never);

    await syncLinksForNote(tx, sourceId, "see [[A]]");

    expect(notesRepo.upsertPlaceholder).not.toHaveBeenCalled();
    expect(linksRepo.replaceForSource).toHaveBeenCalledWith(tx, sourceId, [
      { targetTitle: "A", targetNoteId: "A-id", isBroken: false },
    ]);
  });

  test("broken edge for soft-deleted note", async () => {
    vi.mocked(notesRepo.findByTitle).mockResolvedValue({
      id: "G-id",
      title: "Gone",
      deletedAt: new Date(),
      isPlaceholder: false,
    } as never);

    await syncLinksForNote(tx, sourceId, "ref [[Gone]]");

    expect(linksRepo.replaceForSource).toHaveBeenCalledWith(tx, sourceId, [
      { targetTitle: "Gone", targetNoteId: null, isBroken: true },
    ]);
  });

  test("two links → two edges", async () => {
    vi.mocked(notesRepo.findByTitle).mockImplementation(((title: string) => {
      if (title === "A")
        return Promise.resolve({
          id: "A-id",
          title: "A",
          deletedAt: null,
          isPlaceholder: false,
        });
      return Promise.resolve(null);
    }) as never);
    vi.mocked(notesRepo.upsertPlaceholder).mockResolvedValue({
      id: "B-id",
      title: "B",
    } as never);

    await syncLinksForNote(tx, sourceId, "[[A]] and [[B]]");

    expect(linksRepo.replaceForSource).toHaveBeenCalledWith(tx, sourceId, [
      { targetTitle: "A", targetNoteId: "A-id", isBroken: false },
      { targetTitle: "B", targetNoteId: "B-id", isBroken: false },
    ]);
  });

  test("self-link skipped", async () => {
    vi.mocked(notesRepo.findByTitle).mockResolvedValue({
      id: sourceId,
      title: "Self",
      deletedAt: null,
      isPlaceholder: false,
    } as never);

    await syncLinksForNote(tx, sourceId, "[[Self]]");

    expect(linksRepo.replaceForSource).toHaveBeenCalledWith(tx, sourceId, []);
  });

  test("empty body → no edges", async () => {
    await syncLinksForNote(tx, sourceId, "no links here");
    expect(linksRepo.replaceForSource).toHaveBeenCalledWith(tx, sourceId, []);
    expect(notesRepo.findByTitle).not.toHaveBeenCalled();
  });
});
