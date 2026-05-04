import { describe, it, expect } from "vitest";
import { extractWikilinks, renameWikilinks, WIKILINK_REGEX } from "./wikilink";

describe("extractWikilinks", () => {
  it("returns empty for empty body", () => {
    expect(extractWikilinks("")).toEqual([]);
  });

  it("returns empty for body with no wikilinks", () => {
    expect(extractWikilinks("plain text with no links")).toEqual([]);
  });

  it("extracts a single wikilink", () => {
    expect(extractWikilinks("see [[Project Brief]] for details")).toEqual([
      "Project Brief",
    ]);
  });

  it("extracts multiple distinct wikilinks", () => {
    expect(extractWikilinks("[[Alpha]] then [[Beta]] then [[Gamma]]")).toEqual([
      "Alpha",
      "Beta",
      "Gamma",
    ]);
  });

  it("dedupes repeated wikilinks preserving first occurrence order", () => {
    expect(
      extractWikilinks("[[Beta]] [[Alpha]] [[Beta]] [[Alpha]] [[Gamma]]")
    ).toEqual(["Beta", "Alpha", "Gamma"]);
  });

  it("trims whitespace inside brackets", () => {
    expect(extractWikilinks("[[  Project Brief  ]]")).toEqual(["Project Brief"]);
  });

  it("rejects empty / whitespace-only titles", () => {
    expect(extractWikilinks("[[]] [[   ]] real [[Note]]")).toEqual(["Note"]);
  });

  it("handles links across newlines", () => {
    const body = `start
some [[First]] text
[[Second]] on its own line
end`;
    expect(extractWikilinks(body)).toEqual(["First", "Second"]);
  });

  it("does not match titles spanning newlines", () => {
    expect(extractWikilinks("[[Bad\nTitle]]")).toEqual([]);
  });

  it("does not match titles with nested brackets", () => {
    expect(extractWikilinks("[[Outer [[Inner]] ]]")).toEqual(["Inner"]);
  });

  it("handles unicode in titles", () => {
    expect(extractWikilinks("[[日本語]] and [[Ω-notation]]")).toEqual([
      "日本語",
      "Ω-notation",
    ]);
  });

  it("titles are case-sensitive (distinct entries)", () => {
    expect(extractWikilinks("[[note]] [[Note]] [[NOTE]]")).toEqual([
      "note",
      "Note",
      "NOTE",
    ]);
  });

  it("WIKILINK_REGEX is exported and global", () => {
    expect(WIKILINK_REGEX.flags).toContain("g");
  });

  it("extractWikilinks is deterministic across calls", () => {
    const body = "[[A]] [[B]] [[A]]";
    expect(extractWikilinks(body)).toEqual(extractWikilinks(body));
  });
});

describe("renameWikilinks", () => {
  it("renames simple link", () => {
    expect(renameWikilinks("see [[Old]]", "Old", "New")).toBe("see [[New]]");
  });

  it("renames multiple occurrences", () => {
    expect(renameWikilinks("[[Old]] and [[Old]]", "Old", "New")).toBe(
      "[[New]] and [[New]]",
    );
  });

  it("ignores plain text matches outside wikilinks", () => {
    expect(renameWikilinks("Old idea, see [[Old]]", "Old", "New")).toBe(
      "Old idea, see [[New]]",
    );
  });

  it("preserves whitespace inside brackets", () => {
    expect(renameWikilinks("[[ Old ]]", "Old", "New")).toBe("[[New]]");
  });

  it("escapes regex specials in title", () => {
    expect(renameWikilinks("[[a.b+c]]", "a.b+c", "x")).toBe("[[x]]");
  });

  it("no-op when from equals to", () => {
    expect(renameWikilinks("[[A]]", "A", "A")).toBe("[[A]]");
  });
});
