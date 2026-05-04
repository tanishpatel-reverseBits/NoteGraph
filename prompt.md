# NoteGraph — Development Conversation Log

This document records the prompts I gave Claude and the outputs received while building **NoteGraph**, a linked knowledge-base app with version history. It is a manual transcript reconstructed from the chat session titled _"Build NoteGraph linked knowledge base app"_.

Each session below is a separate Claude conversation. Within a session, prompts are numbered in the order they were sent.

---

## Project Brief

> **NoteGraph — A Linked Knowledge Base with Version History**
> _(reverseBits Tech LLP problem statement)_

### Background

Most notes apps treat every note as an isolated document. Knowledge is rarely isolated — ideas reference other ideas, decisions link to context, meeting summaries reference project briefs. NoteGraph treats connections as first-class: any note can reference any other by wrapping its title in double brackets — `[[like this]]` — and the app tracks references automatically. Nothing is ever lost: every edit silently snapshots the previous version, and any past version can be diffed or restored.

### The Challenge

Build NoteGraph from scratch. Beyond standard CRUD:

- On create/edit, scan body for `[[wikilinks]]` and maintain a live link record.
- Missing referenced notes get auto-created as placeholders.
- Soft-delete only — hide notes, mark incoming links broken; restore heals them.
- Every update snapshots the previous body as a numbered, permanent version.
- Allow any two versions to be diffed line-by-line; restoring a version is itself a new version.
- Expose the full knowledge graph as nodes + edges for frontend rendering.

### Requirements (summary)

- **Notes:** title (unique), body, optional tags. Create / read / update / soft-delete. Search by title keyword or tag.
- **Wikilinks:** detected automatically from body; link table always mirrors body. Missing targets created as placeholders. Removed links cleaned up.
- **Backlinks:** reading a note returns notes currently linking to it (computed live).
- **Broken links:** soft-delete flags incoming links broken without modifying linker bodies; restore/recreate heals.
- **Versions:** previous body snapshotted before each save; sequential per note; permanent. Retrieve / list (reverse chronological) / line-diff any two / restore as new version.
- **Graph endpoint:** all active notes as nodes, all links as edges. Broken edges and placeholder nodes distinguishable.
- **Frontend:** `[[wikilink]]` autocomplete in editor, backlinks panel, version history with colour-coded diff, interactive graph canvas (click node → open note).

### Expected Outcomes

Full CRUD + soft-delete (no hard deletes ever). Auto-maintained link table. Live backlinks. Broken-link flagging + healing. Permanent snapshots + diff + restore. Graph endpoint with broken/stub markers. Frontend: autocomplete, backlinks, diff viewer, interactive graph.

---

## Session 1 — Problem Capture

### Prompt 1

> _(pasted full problem statement above (official PDF), then:)_
>
> This is the whole app I'm going to make here so make one md file at root level that describes this whole app and its behaviour and functionality — not any technical stuff.

**Output:** Created `NOTEGRAPH.md`.

---

## Session 2 — Environment Setup & Planning

### Prompt 1

> See here I have `@NOTEGRAPH.md` and I want to build that app. For that I have decided the below tech stack:
>
> - Next.js (App Router)
> - TypeScript
> - PostgreSQL (Docker — local)
> - Prisma ORM
> - TanStack Query
> - React Hook Form
> - Zod
> - Tailwind CSS
> - shadcn/ui
> - Docker
>
> Now set up this whole environment here. Don't make another folder — use the `.` directory in the Next.js installation so it doesn't create another folder inside this main folder.

**Output:** Whole environment setup completed.

### Prompt 2

> Analyze the whole codebase and importantly `NOTEGRAPH.md`, understand the whole app, and divide its end-to-end implementation into modules. Don't need to build the auth flow. Make an md file for that and make `task.md` also.

**Output:** Created `MODULES.md` and `TASK.md`.

---

## Sessions 3–10 — Module Implementation

`MODULES.md` split the build into 16 modules (M1–M16; M0 = foundation, already done in Session 2). I worked through them two at a time, one pair per session. Each prompt followed the same shape: `start M<x> and M<y>`. The output of each session was the corresponding modules implemented end-to-end (repo + service + route + hook + UI as applicable).

### Session 3 — M1, M2

> start M1 and M2

**Output:** Implemented Wikilink Parser (`src/lib/wikilink.ts`) and Zod Schemas + Shared Types (`src/lib/schemas/*`, `src/lib/types.ts`).

### Session 4 — M3, M4

> start M3 and M4

**Output:** Implemented Notes Repository (`src/server/repos/notes.ts`, `links.ts`, `versions.ts`) and Link Sync Engine (`src/server/services/link-sync.ts`).

### Session 5 — M5, M6

> start M5 and M6

**Output:** Implemented Placeholder Healing (`src/server/services/healing.ts`) and Soft Delete + Broken Link Marking (`src/server/services/deletion.ts`).

### Session 6 — M7, M8

> start M7 and M8

**Output:** Implemented Version History (`src/server/services/versions.ts`, `src/lib/diff.ts`) and API Routes (`src/app/api/notes/**`, `graph`, `search`, `titles`).

### Session 7 — M9, M10

> start M9 and M10

**Output:** Implemented Knowledge Graph Aggregator (`src/server/services/graph.ts`) and TanStack Query Hooks (`src/hooks/use-*.ts`).

### Session 8 — M11, M12

> start M11 and M12

**Output:** Implemented Forms (`src/components/forms/note-form.tsx`, `wikilink-suggest.tsx`) and Editor + Note Detail Page (`src/app/notes/[id]/page.tsx` + `note-editor`, `backlinks-panel`, `version-history-panel`, `version-diff-view`, `broken-link-badge`).

### Session 9 — M13, M14

> start M13 and M14

**Output:** Implemented Notes List + Search (`src/app/notes/page.tsx`, `note-list`, `search-bar`) and Graph View (`src/app/graph/page.tsx`, `graph-canvas`, `graph-legend`).

### Session 10 — M15, M16

> start M15 and M16

**Output:** Implemented App Shell + Navigation (`sidebar`, `topbar`, layout wiring) and Toaster + Error Boundary (`<Toaster />` in layout, `error.tsx` boundaries). App now end-to-end functional.

---

## Session 11 — UX & Code Review + Improvements

### Prompt 1

> Okay, now any improvement in flow, in UI/UX, or code structure to make it an actual web app that a real human can use?

**Output (full review):**

#### Critical (blocks real use)

- **No auth.** Single shared graph = no multi-user. Even single-user needs login or app exposed to anyone w/ URL.
- **No autosave + no dirty warning.** Switch tab, lose unsaved body. Add debounced autosave OR `beforeunload` guard on dirty form.
- **No keyboard shortcuts.** `Cmd/Ctrl+S` save, `Cmd+K` command palette, `Cmd+P` quick-open notes.
- **Body is plain `<textarea>`.** No markdown render, no clickable wikilinks. Reading = same as editing. Need view-mode w/ rendered MD + hot wikilinks.
- **`[[` autocomplete fragile.** Caret tracking via `onClick`/`onKeyUp`/`onSelect` misses paste/IME. Move to `contenteditable` or CodeMirror/Tiptap.

#### High (UX gaps)

- **Title rename = broken links.** Rename treats as new title; old `[[Old]]` refs in other notes break silently. Cascade rename or warn before rename.
- **Soft-delete UX confusing.** Deleted notes vanish — no "Trash" view. Add `/notes/trash`.
- **Note creation always opens detail.** New note via sidebar = "Untitled note Mar 03 12:34" garbage title. Prompt for title or open inline rename.
- **Search only title + tag.** Real notes app needs body search (Postgres `tsvector`).
- **Tags = comma input.** No suggestions, typos create new tags. Add chip input w/ suggestions.
- **No bulk ops.** Multi-select delete/tag/export.
- **Graph layout = circle.** Useless past 20 nodes. Use force-directed (`d3-force` or `dagre`).
- **Diff view dialog only.** Inline timeline w/ adjacent-version diff toggle.
- **No "today" / recent / pinned.** Hard to find anything past 50 notes.

#### Code structure

- Repos export individual functions, not class/object. Inconsistent — `notes.ts` uses `*` import, but barrel `index` missing. Add `src/server/repos/index.ts`.
- **Error handling inconsistent.** Routes use try/catch + `handleUnknown`. Services throw raw `Error`. Define `AppError` class w/ codes (`NOT_FOUND`, `CONFLICT`, …). Routes map class → HTTP cleanly. No more string-matching `e.message.includes("Version")` (`diff/route.ts:22`).
- **Validation duplicated.** `searchParams` parsed manually via `Object.fromEntries` everywhere. Helper: `parseQuery(req, schema)`.
- **`prisma.$transaction` scattered.** Some services own tx (`deletion.ts`), some require caller (`link-sync.ts`, `versions.ts`). Pick one pattern. Recommend: services always accept tx, route handlers own `prisma.$transaction`.
- **Hooks mix concerns.** `use-notes.ts` has fetch + invalidation + toast. Extract toast — let caller decide messaging.
- **No optimistic updates.** Every mutation = round-trip wait. Add optimistic for delete/restore.
- **`note-form.tsx` is 194 lines.** Tag chip input deserves own component. `WikilinkSuggest` already extracted — apply same to tags.
- **No request deduplication on autocomplete.** `useTitleSearch` fires per keystroke. Add debounce.
- **No env validation.** App boots w/ missing `DATABASE_URL` and crashes deep. Add `src/env.ts` w/ Zod schema parsing `process.env`.
- **No request logging / observability.** Console.error in `http.ts:36` only. Add `pino` + request-ID middleware.

#### Data integrity

- **`upsertPlaceholder` race partially handled.** `P2002` retry but only `findUnique` once — under contention, two concurrent placeholder creates can leak. Add `SERIALIZABLE` or advisory lock per title.
- **Body size bound = 1M chars.** No client-side guard — user pastes huge text, hits 400 silently. Show counter.
- **No soft-delete cascade for versions.** Deleted note's versions still queryable via direct ID. Filter `deletedAt` in version routes too.
- **No CSRF protection.** Mutations are POST/PATCH/DELETE w/ no token. Add SameSite cookies + origin check.

#### Polish

- **Toasts don't deduplicate.** Save 5x fast = 5 toasts. Use toast IDs.
- **No mobile layout.** Sidebar fixed 224px, no hamburger. Below ~640px = broken.
- **No dark mode toggle.** `next-themes` installed, no UI toggle.
- **No favicon.** Still default Next.
- **No 404 inside notes.** `/notes/badid` = "Note not found" w/ "Try restore" button → restore on non-existent ID = 404 toast loop.
- **"Untitled note Mar 03 12:34" titles pollute.** Auto-cleanup on `body=empty` + age>1d, or block save w/o title change.

#### Suggested next steps (ordered)

1. Markdown render + clickable wikilinks (biggest UX leap)
2. Autosave + dirty guard
3. `Cmd+K` command palette
4. Force-directed graph layout
5. Auth (NextAuth or Clerk)
6. Trash view
7. Full-text body search
8. Mobile layout
9. `AppError` class + structured logging

> Want me to start on any?

### Prompt 2

> Except auth, start doing all the things.

**Output:** All improvements done.
