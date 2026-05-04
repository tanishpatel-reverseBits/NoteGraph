# NoteGraph — Task List

Granular checklist mapped 1:1 to `MODULES.md`. Build top-to-bottom; each section depends on the previous.

Legend: `[ ]` todo · `[x]` done · `[~]` partial

---

## M0. Foundation

- [x] Next.js 16 + TS + Tailwind 4 scaffold
- [x] Prisma 7 + Postgres 17 (Docker, host port 5433)
- [x] TanStack Query, RHF, Zod, shadcn/ui installed
- [x] `Note` / `Version` / `Link` schema + initial migration
- [x] `prisma.ts` singleton, `query-client.ts`, `Providers`
- [x] Replace default `src/app/page.tsx` with redirect to `/notes`
- [x] Add `<Toaster />` to root layout
- [x] Add shadcn `form` component manually (registry skipped it): copy from `https://ui.shadcn.com/r/styles/new-york/form.json` or vendor the file

---

## M1. Wikilink Parser

- [x] Create `src/lib/wikilink.ts`
- [x] Implement `extractWikilinks(body)` — regex `/\[\[([^\[\]\n]+)\]\]/g`, trim, dedupe preserving order
- [x] Reject empty / whitespace-only titles
- [x] Unit tests: empty body, single link, repeated link, nested brackets, links across newlines (+ unicode, case-sensitivity, determinism — 14 tests)
- [x] Export `WIKILINK_REGEX` constant
- [x] Vitest configured (`vitest.config.ts`, `npm test` script)

---

## M2. Zod Schemas + Types

- [x] `src/lib/schemas/note.ts` — `noteCreateSchema`, `noteUpdateSchema`, `titleSchema` (1–200, no `[[`/`]]`, trimmed)
- [x] `src/lib/schemas/version.ts` — `versionParamsSchema`, `diffQuerySchema`
- [x] `src/lib/schemas/link.ts` — internal edge type
- [x] `src/lib/types.ts` — `Note`, `NoteWithRelations`, `Backlink`, `LinkEdge`, `GraphPayload`, `DiffLine`

---

## M3. Repos (DB layer)

### Notes repo (`src/server/repos/notes.ts`)
- [x] `findActiveByTitle(title)`
- [x] `findByIdWithRelations(id)` — include backlinks (incoming Links + source notes), outgoing Links
- [x] `listActive({ q?, tag? })` — case-insensitive title contains; tag = `tags has`
- [x] `createNote({ title, body, tags })`
- [x] `updateNote(id, patch)`
- [x] `softDelete(id)` / `restore(id)`
- [x] `upsertPlaceholder(title)` — handles P2002 race (catch + re-fetch)

### Versions repo (`src/server/repos/versions.ts`)
- [x] `appendVersion(tx, noteId, body)` with monotonic `version` (use `MAX(version)+1` inside tx)
- [x] `listByNote(noteId)` desc
- [x] `getByNoteAndVersion(noteId, version)`

### Links repo (`src/server/repos/links.ts`)
- [x] `replaceForSource(tx, sourceNoteId, edges)` — `deleteMany` + `createMany`
- [x] `markBrokenByTargetId(tx, targetNoteId)`
- [x] `healByTitle(tx, title, newTargetId)`
- [x] `listIncoming(targetNoteId)` — includes source note (id, title, isPlaceholder)

---

## M4. Link Sync Engine

- [x] `src/server/services/link-sync.ts` — `syncLinksForNote(tx, sourceNoteId, body)`
- [x] Resolution path: active note → placeholder → soft-deleted (broken) → missing (create placeholder)
- [x] All work in caller-provided tx
- [x] Unit-ish test via integration: write body with `[[A]] [[B]]`, assert 2 Link rows + B placeholder created

---

## M5. Placeholder Healing

- [x] `src/server/services/healing.ts` — `healIncomingLinks(tx, noteId, title)`
- [x] On placeholder → real (first non-empty body): clear `isPlaceholder` + heal (`promotePlaceholderIfNeeded`)
- [x] On note creation with title that matches existing broken Link rows: heal
- [x] Wired into `notes.create`, `notes.update`, `notes.restore`

---

## M6. Soft Delete + Broken Links

- [x] `src/server/services/deletion.ts` — `softDeleteNote(id)`, `restoreNote(id)`
- [x] `softDeleteNote`: tx → set `deletedAt`, `links.markBrokenByTargetId(id)`
- [x] `restoreNote`: tx → clear `deletedAt`, heal incoming
- [x] Source body NEVER mutated by deletion

---

## M7. Version History + Diff

- [x] `src/server/services/versions.ts` — `saveNoteWithVersion(tx, noteId, newBody)`
- [x] `restoreVersion(noteId, v)` — appends new version with old body, syncs links from old body
- [x] `src/lib/diff.ts` — line diff returning `DiffLine[]` (use `diff` npm package: `npm i diff && npm i -D @types/diff`)
- [x] `diffVersions(noteId, vA, vB)` service

---

## M8. API Routes

- [x] `GET /api/notes` — list/search (`?q=&tag=`)
- [x] `POST /api/notes` — create (validates body, runs link sync + healing in tx, appends initial version)
- [x] `GET /api/notes/[id]` — note + backlinks + outgoing
- [x] `PATCH /api/notes/[id]` — update (link sync + version append in tx)
- [x] `DELETE /api/notes/[id]` — soft delete
- [x] `POST /api/notes/[id]/restore`
- [x] `GET /api/notes/[id]/versions`
- [x] `GET /api/notes/[id]/versions/[v]`
- [x] `POST /api/notes/[id]/versions/[v]/restore`
- [x] `GET /api/notes/[id]/diff?from=&to=`
- [x] `GET /api/notes/[id]/backlinks`
- [x] `GET /api/graph`
- [x] `GET /api/search?q=&tag=`
- [x] `GET /api/titles?q=` — autocomplete (active titles only, limit 10)
- [x] Unified error helper `src/server/http.ts` (`json`, `badRequest`, `notFound`, `conflict`)

---

## M9. Graph Aggregator

- [x] `src/server/services/graph.ts` — `buildGraph()`
- [x] Excludes soft-deleted notes from nodes; broken edges still in payload (placeholder shown, deleted source filtered)

---

## M10. TanStack Query Hooks

- [x] `src/hooks/use-notes.ts`
- [x] `src/hooks/use-versions.ts`
- [x] `src/hooks/use-graph.ts`
- [x] `src/hooks/use-titles.ts`
- [x] `src/hooks/use-search.ts`
- [x] Mutation invalidation matrix:
  - createNote → `["notes"]`, `["graph"]`, `["titles"]`
  - updateNote(id) → `["note", id]`, `["notes"]`, `["graph"]`, `["titles"]`
  - deleteNote/restoreNote(id) → all of above + `["note", id]`
  - restoreVersion(id) → `["note", id]`, `["note", id, "versions"]`, `["graph"]`

---

## M11. Forms

- [x] `src/components/forms/note-form.tsx` — RHF + zodResolver
- [x] `src/components/forms/wikilink-suggest.tsx` — popover triggered when caret is inside an open `[[`
- [x] Tag input chip component (or simple comma-separated for v1)

---

## M12. Note Detail Page

- [x] `src/app/notes/[id]/page.tsx` — server component, hydrates client
- [x] `note-editor.tsx` — title + body + tags + Save button (autosave optional)
- [x] `backlinks-panel.tsx` — list of incoming notes; click navigates
- [x] `version-history-panel.tsx` — list of versions desc; "View" + "Compare" + "Restore"
- [x] `version-diff-view.tsx` — renders `DiffLine[]` with green/red/neutral
- [x] `broken-link-badge.tsx` — small visual marker on broken/placeholder targets
- [x] Delete button (soft delete) with confirm dialog
- [x] Restore button when viewing a soft-deleted note

---

## M13. Notes List + Search

- [x] `src/app/notes/page.tsx`
- [x] `note-list.tsx`
- [x] `search-bar.tsx` — debounced title query + tag dropdown
- [x] "+ New note" → creates blank note + routes

---

## M14. Graph View

- [x] `npm i reactflow`
- [x] `src/app/graph/page.tsx`
- [x] `graph-canvas.tsx` — fetch via `useGraph`, render nodes + edges, pan/zoom/minimap
- [x] Distinct styling: real / placeholder nodes, healthy / broken edges
- [x] Click node → `/notes/[id]`
- [x] `graph-legend.tsx`

---

## M15. App Shell

- [x] `src/components/shell/sidebar.tsx` — Notes / Graph / New Note links
- [x] `src/components/shell/topbar.tsx` — global search trigger
- [x] Wrap in `layout.tsx`

---

## M16. Polish

- [x] `<Toaster />` mounted, mutation success/error toasts
- [x] `src/app/error.tsx`, `src/app/not-found.tsx`
- [x] Loading skeletons on list / detail / graph
- [x] Empty states ("No notes yet", "No backlinks", "No versions")

---

## Test Plan (manual, run as features land)

- Create note `Alpha`, body `links to [[Beta]]`. Expect: `Beta` placeholder appears in list (badge), edge healthy in graph.
- Open `Beta`, set body. Expect: placeholder badge gone, `Alpha` appears in `Beta` backlinks.
- Edit `Alpha`, remove `[[Beta]]`. Expect: edge gone, `Beta` backlinks empty.
- Re-add `[[Beta]]` → edit again. Expect: 2 versions in history; diff shows added line.
- Soft-delete `Beta`. Expect: edge in `Alpha` shown broken (Alpha body unchanged); graph shows broken edge.
- Restore `Beta`. Expect: edge healed automatically.
- Soft-delete `Beta`, then create new `Beta` (same title). Expect: heal triggers, edge healthy again.
- Restore an old version of `Alpha`. Expect: new version row appended (history grows), links re-synced from restored body.
- Search `alpha` → finds Alpha; tag filter works.

---

## Stretch (post-MVP)

- [ ] `[[Title|Display]]` alias syntax
- [ ] Skip wikilink parsing inside fenced code blocks
- [ ] Markdown rendering of body (with wikilinks → `<Link>`)
- [ ] Note rename → cascade title update across link rows (vs current: rename = treat as new title, old links become broken until heal)
- [ ] Full-text search (Postgres `tsvector`)
- [ ] Export / import (JSON)
