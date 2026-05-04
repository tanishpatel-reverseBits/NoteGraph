# NoteGraph — Module Breakdown

End-to-end implementation split into independent modules. Auth excluded.

Order = build order. Later modules depend on earlier. Each module lists: responsibility, key files, public surface (functions / API / UI), invariants.

---

## 0. Foundation (DONE)

Already scaffolded.

- Next.js 16 (App Router) + TS + Tailwind 4
- Prisma 7 schema: `Note`, `Version`, `Link`
- Postgres 17 in Docker (host port 5433)
- TanStack Query, RHF, Zod, shadcn/ui
- `src/lib/prisma.ts`, `src/lib/query-client.ts`, `src/app/providers.tsx`

---

## 1. Wikilink Parser

Pure function. No DB. Extracts `[[Title]]` from note body.

**Files**
- `src/lib/wikilink.ts`

**Public surface**
- `extractWikilinks(body: string): string[]` — returns deduped, trimmed titles, preserves order of first occurrence
- `WIKILINK_REGEX` — exported for editor use
- Title normalisation rules: trim whitespace; reject empty; case-sensitive match (titles are unique by exact string)

**Invariants**
- Same body → same output (deterministic).
- Escaped/code-fenced `[[…]]` handling: phase 1 = naive (treat all matches as links). Phase 2 (optional) = skip inside fenced code blocks.

---

## 2. Zod Schemas + Shared Types

Shared validation/types used by API routes, RHF forms, and TanStack Query.

**Files**
- `src/lib/schemas/note.ts`
- `src/lib/schemas/version.ts`
- `src/lib/schemas/link.ts`
- `src/lib/types.ts`

**Public surface**
- `noteCreateSchema`, `noteUpdateSchema`, `noteSearchSchema`
- `Note`, `NoteWithRelations`, `Backlink`, `LinkEdge`, `GraphPayload` types
- Title constraints: 1–200 chars, no leading/trailing whitespace, no `[[` or `]]` substring

---

## 3. Notes Repository (DB layer)

Thin Prisma wrappers. No HTTP, no React.

**Files**
- `src/server/repos/notes.ts`
- `src/server/repos/links.ts`
- `src/server/repos/versions.ts`

**Notes repo surface**
- `findActiveByTitle(title)` — excludes `deletedAt != null`
- `findByIdWithRelations(id)` — note + backlinks + outgoing links + tags
- `listActive({ q?, tag? })` — search by title substring or tag membership
- `createNote({ title, body, tags })`
- `softDelete(id)` — sets `deletedAt`, does NOT touch link rows in source bodies
- `restore(id)` — clears `deletedAt`
- `upsertPlaceholder(title)` — creates `{ title, body: "", isPlaceholder: true }` if missing

**Versions repo surface**
- `appendVersion(noteId, body)` — uses next sequential `version` int (transaction, `SELECT MAX … FOR UPDATE`)
- `listByNote(noteId)` — desc by version
- `getByNoteAndVersion(noteId, version)`

**Links repo surface**
- `replaceForSource(sourceNoteId, edges: { targetTitle, targetNoteId, isBroken }[])` — wipes & reinserts in tx
- `markBrokenByTargetId(targetNoteId)` — sets `isBroken=true`, `targetNoteId=null`
- `healByTitle(title, newTargetId)` — finds rows where `targetTitle=title AND targetNoteId IS NULL`, sets target + `isBroken=false`
- `listIncoming(targetNoteId)` — backlinks query

**Invariants**
- All multi-row mutations run in `prisma.$transaction`.
- `Link.targetNoteId` nullable; `isBroken=true` ↔ `targetNoteId=null`.

---

## 4. Link Sync Engine

Core logic. On every note write, sync `Link` rows + auto-create placeholders.

**Files**
- `src/server/services/link-sync.ts`

**Public surface**
- `syncLinksForNote(tx, sourceNoteId, body): Promise<void>`

**Algorithm**
1. `titles = extractWikilinks(body)`
2. For each title:
   - Look up active note by title.
   - If exists & not placeholder → edge `{ title, targetNoteId, isBroken: false }`.
   - If exists & placeholder → edge `{ title, targetNoteId, isBroken: false }` (placeholder still resolvable).
   - If does not exist → `upsertPlaceholder(title)` → edge `{ title, targetNoteId: <new>, isBroken: false }`.
   - If exists but soft-deleted → edge `{ title, targetNoteId: null, isBroken: true }`.
3. `replaceForSource(sourceNoteId, edges)` inside same tx.

**Invariants**
- Always runs in transaction with the note write.
- Removing a `[[X]]` from body removes that Link row.
- Adding `[[Y]]` adds Link row (and Y placeholder if missing).

---

## 5. Placeholder Healing

When a placeholder gets real content OR a deleted note is restored OR a new note created with title matching broken links → heal incoming links.

**Files**
- `src/server/services/healing.ts`

**Public surface**
- `healIncomingLinks(tx, noteId, title)` — calls `links.healByTitle(title, noteId)` and clears `isPlaceholder` flag if applicable

**Triggers (called from)**
- `notes.create` → if title matches broken Link rows, heal.
- `notes.update` → when placeholder note gets first non-empty body, set `isPlaceholder=false` and heal.
- `notes.restore` → heal all Link rows where `targetTitle = restored.title`.

---

## 6. Soft Delete + Broken Link Marking

When a note is soft-deleted, its incoming links become broken.

**Files**
- `src/server/services/deletion.ts`

**Public surface**
- `softDeleteNote(noteId): Promise<Note>` — tx: set `deletedAt`, `links.markBrokenByTargetId(noteId)`. Source bodies untouched.
- `restoreNote(noteId): Promise<Note>` — tx: clear `deletedAt`, run `healIncomingLinks`.

**Invariants**
- Source body text never edited by deletion.
- Active queries filter `deletedAt IS NULL`.

---

## 7. Version History

Append-only snapshots. Every save = new version row.

**Files**
- `src/server/services/versions.ts`
- `src/lib/diff.ts` (line diff)

**Public surface**
- `saveNoteWithVersion(tx, noteId, newBody): Promise<{ note, version }>` — atomically: snapshot prior body, update note body, append version
- `listVersions(noteId)`, `getVersion(noteId, versionNum)`
- `restoreVersion(noteId, versionNum)` — creates a new version on top with old body
- `diffVersions(noteId, vA, vB): DiffLine[]` where `DiffLine = { type: "added"|"removed"|"unchanged", text: string }`

**Diff implementation**
- Use `diff` package (Myers algorithm) or hand-rolled LCS over lines.
- Output array of `DiffLine` for UI rendering.

**Invariants**
- Versions monotonically increasing per note. Never deleted, never rewritten.
- Restore = new version, not history rewrite.

---

## 8. API Routes (Next.js Route Handlers)

REST surface. All routes Zod-validate input, return JSON.

**Files**
- `src/app/api/notes/route.ts` — `GET` (list/search), `POST` (create)
- `src/app/api/notes/[id]/route.ts` — `GET`, `PATCH` (update body/title/tags), `DELETE` (soft delete)
- `src/app/api/notes/[id]/restore/route.ts` — `POST`
- `src/app/api/notes/[id]/versions/route.ts` — `GET`
- `src/app/api/notes/[id]/versions/[v]/route.ts` — `GET`
- `src/app/api/notes/[id]/versions/[v]/restore/route.ts` — `POST`
- `src/app/api/notes/[id]/diff/route.ts` — `GET ?from=&to=`
- `src/app/api/notes/[id]/backlinks/route.ts` — `GET`
- `src/app/api/graph/route.ts` — `GET` returns `{ nodes, edges }`
- `src/app/api/search/route.ts` — `GET ?q=&tag=`
- `src/app/api/titles/route.ts` — `GET ?q=` (autocomplete for `[[`)

**Conventions**
- Errors → `{ error: { code, message } }` with proper HTTP status.
- All write routes wrap service calls in `prisma.$transaction`.

---

## 9. Knowledge Graph Aggregator

Build graph payload for UI canvas.

**Files**
- `src/server/services/graph.ts`

**Public surface**
- `buildGraph(): Promise<GraphPayload>`
  - `nodes: { id, title, isPlaceholder, isDeleted, tagCount }[]` — active notes + placeholders, exclude soft-deleted
  - `edges: { id, sourceId, targetId|null, targetTitle, isBroken }[]`
- Single query with `prisma.note.findMany({ include: { outgoingLinks: true } })` + map.

---

## 10. TanStack Query Hooks

Client-side data layer. Wraps `fetch` to API routes.

**Files**
- `src/hooks/use-notes.ts` — `useNotes`, `useNote`, `useCreateNote`, `useUpdateNote`, `useDeleteNote`, `useRestoreNote`
- `src/hooks/use-versions.ts` — `useVersions`, `useVersion`, `useDiff`, `useRestoreVersion`
- `src/hooks/use-graph.ts` — `useGraph`
- `src/hooks/use-titles.ts` — `useTitleSearch(q)` (for `[[` autocomplete)
- `src/hooks/use-search.ts` — `useSearch(q, tag)`

**Conventions**
- Query keys: `["notes"]`, `["note", id]`, `["note", id, "versions"]`, `["graph"]`, `["titles", q]`
- Mutations invalidate `["notes"]`, `["note", id]`, `["graph"]` as appropriate.

---

## 11. Forms (RHF + Zod)

**Files**
- `src/components/forms/note-form.tsx` — title + body (textarea) + tags
- `src/components/forms/wikilink-suggest.tsx` — popover suggesting titles when user types `[[`

**Behavior**
- `note-form` wires `useForm` + `zodResolver(noteUpsertSchema)`.
- On submit → mutation. Optimistic update optional.
- Wikilink suggester listens to textarea caret + value; opens floating list when caret is inside an open `[[`; uses `useTitleSearch`; insertion replaces partial.

---

## 12. Editor + Note Detail Page

**Files**
- `src/app/notes/[id]/page.tsx` — main detail view
- `src/components/notes/note-editor.tsx` — wraps `note-form`
- `src/components/notes/backlinks-panel.tsx`
- `src/components/notes/version-history-panel.tsx`
- `src/components/notes/version-diff-view.tsx`
- `src/components/notes/broken-link-badge.tsx`

**Layout**
- Two-column on `md+`: editor left, sidepanel right (tabs: Backlinks | Versions).
- Version diff opens in a `Dialog` (shadcn) with side-by-side or unified view.
- Broken/placeholder targets render with distinct styling everywhere.

---

## 13. Notes List + Search

**Files**
- `src/app/notes/page.tsx` — list view
- `src/components/notes/note-list.tsx`
- `src/components/notes/search-bar.tsx` — title query + tag filter

**Behavior**
- Debounced query input → `useSearch`.
- Click row → `/notes/[id]`.
- "+ New note" button → create with empty body, route to detail.

---

## 14. Graph View

Interactive canvas of the knowledge graph.

**Files**
- `src/app/graph/page.tsx`
- `src/components/graph/graph-canvas.tsx`
- `src/components/graph/graph-legend.tsx`

**Library**
- `reactflow` (good DX, React-native) or `cytoscape` (better for dense graphs). Default pick: **reactflow**.

**Behavior**
- Nodes coloured: real note vs placeholder.
- Edges coloured: healthy vs broken.
- Click node → navigate `/notes/[id]`.
- Pan + zoom + minimap.

---

## 15. App Shell + Navigation

**Files**
- `src/app/layout.tsx` (extend existing)
- `src/components/shell/sidebar.tsx` — links: Notes, Graph, New Note
- `src/components/shell/topbar.tsx` — global search shortcut

---

## 16. Toaster + Error Boundary

**Files**
- Add `<Toaster />` (sonner) to layout
- `src/app/error.tsx`, `src/app/notes/[id]/error.tsx`

---

## Cross-cutting

- **All write paths** must run `prisma.$transaction` covering: note write + link sync + version append + healing.
- **All read paths** filtering active notes must include `deletedAt: null`.
- **Title uniqueness**: enforced by Prisma `@unique`. Service layer must catch P2002 and return 409.
- **Race**: two concurrent writes touching the same title → relies on Postgres unique + tx serialisation. Retry on P2002 in `upsertPlaceholder`.
