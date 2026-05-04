export const WIKILINK_REGEX = /\[\[([^\[\]\n]+)\]\]/g;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function renameWikilinks(body: string, from: string, to: string): string {
  if (from === to) return body;
  const pattern = new RegExp(`\\[\\[\\s*${escapeRegex(from)}\\s*\\]\\]`, "g");
  return body.replace(pattern, `[[${to}]]`);
}

export function extractWikilinks(body: string): string[] {
  if (!body) return [];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const match of body.matchAll(WIKILINK_REGEX)) {
    const title = match[1].trim();
    if (!title) continue;
    if (seen.has(title)) continue;
    seen.add(title);
    result.push(title);
  }

  return result;
}
