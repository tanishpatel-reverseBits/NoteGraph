# NoteGraph

A linked knowledge-base app with version history. Notes reference each other with `[[wikilinks]]`; the app maintains the link graph automatically, snapshots every edit, and exposes the whole knowledge base as an interactive graph.

See [`NOTEGRAPH.md`](./NOTEGRAPH.md) for the product spec, [`MODULES.md`](./MODULES.md) for the implementation breakdown, and [`TASK.md`](./TASK.md) for build progress.

## Features

- **Notes CRUD** with unique titles, body, tags, and soft-delete (no hard deletes ever).
- **Wikilinks** — `[[Title]]` syntax in any body auto-maintains a live link table. Missing targets become placeholders. Removed links clean up.
- **Backlinks** computed live from the link table.
- **Broken-link healing** — soft-deleting a note flags incoming links broken; restoring or recreating heals them.
- **Version history** — every save snapshots the prior body. List, diff line-by-line, restore as a new version. History never rewritten.
- **Knowledge graph** — single endpoint returns nodes + edges, with broken edges and placeholder nodes distinguishable.
- **Editor** — markdown render, clickable wikilinks, `[[`-autocomplete, autosave + dirty guard, keyboard shortcuts (`Ctrl/Cmd+S`, `Cmd+K` palette, `Cmd+P` quick-open).
- **Graph view** — force-directed canvas, broken edges visually distinct, click node → open note.

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **PostgreSQL 17** (Docker, host port `5433`)
- **Prisma 7** ORM
- **TanStack Query** for client data
- **React Hook Form** + **Zod** for forms / validation
- **Tailwind CSS 4** + **shadcn/ui** + **sonner**
- **reactflow** for the graph canvas
- **Vitest** for tests

## Getting Started

### Prerequisites

- Node.js 20+
- Docker Desktop
- npm (or pnpm / yarn / bun — examples use npm)

### Setup

```bash
# 1. Install dependencies (also runs `prisma generate` via postinstall)
npm install

# 2. Configure env
cp .env.example .env   # then edit if needed
# DATABASE_URL=postgresql://notegraph:notegraph@localhost:5433/notegraph

# 3. Start Postgres (Docker)
npm run db:up

# 4. Run migrations
npm run db:migrate

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command              | What it does                                |
| -------------------- | ------------------------------------------- |
| `npm run dev`        | Next.js dev server                          |
| `npm run build`      | Production build                            |
| `npm run start`      | Run production build                        |
| `npm run lint`       | ESLint                                      |
| `npm run test`       | Vitest (one-shot)                           |
| `npm run test:watch` | Vitest watch                                |
| `npm run test:ui`    | Vitest UI                                   |
| `npm run db:up`      | Start Postgres container                    |
| `npm run db:down`    | Stop Postgres container                     |
| `npm run db:logs`    | Tail Postgres logs                          |
| `npm run db:migrate` | Apply Prisma migrations                     |
| `npm run db:reset`   | Drop and re-create DB (destructive — local) |
| `npm run db:studio`  | Open Prisma Studio                          |
| `npm run db:generate`| Regenerate Prisma client                    |

## Project Structure

```
src/
  app/                    # Next.js App Router (pages + route handlers)
    api/                  # REST endpoints (notes, versions, graph, search, titles)
    notes/                # Notes list + detail pages
    graph/                # Graph canvas page
  components/
    forms/                # note-form, wikilink-suggest
    notes/                # editor, backlinks panel, version history, diff view
    graph/                # graph-canvas, legend
    shell/                # sidebar, topbar
    ui/                   # shadcn primitives
  hooks/                  # TanStack Query hooks (use-notes, use-versions, ...)
  lib/                    # wikilink parser, diff, schemas, types, prisma client
  server/
    repos/                # Prisma wrappers (notes, links, versions)
    services/             # link-sync, healing, deletion, versions, graph
prisma/                   # schema.prisma + migrations
docker-compose.yml        # local Postgres
```

## Database

Local Postgres runs in Docker (`docker-compose.yml`).

- Host: `localhost`
- Port: `5433` (host) → `5432` (container)
- DB / user / password: `notegraph` / `notegraph` / `notegraph`
- Volume: `notegraph_pgdata` (persists between restarts)

Schema lives in `prisma/schema.prisma`. Three core models: `Note`, `Version`, `Link`.

## Documentation

- [`NOTEGRAPH.md`](./NOTEGRAPH.md) — product spec
- [`MODULES.md`](./MODULES.md) — module-level implementation plan
- [`TASK.md`](./TASK.md) — task tracker
- [`prompt.md`](./prompt.md) — development conversation log
