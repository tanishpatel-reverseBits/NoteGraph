"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Note } from "@/lib/types";
import { BrokenLinkBadge } from "@/components/notes/broken-link-badge";

type NoteListProps = {
  notes: Note[];
};

function formatUpdatedAt(value: Date | string) {
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export function NoteList({ notes }: NoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center">
        <h2 className="text-base font-semibold">No notes found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Create a note or clear the current filters.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {notes.map((note) => (
        <li key={note.id}>
          <Link
            href={`/notes/${note.id}`}
            className="group flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="min-w-0 truncate text-sm font-semibold">
                  {note.title}
                </h2>
                {note.isPlaceholder ? (
                  <BrokenLinkBadge state="placeholder" />
                ) : null}
              </div>
              <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {note.tags.length === 0 ? (
                <span className="text-xs text-muted-foreground/60">No tags</span>
              ) : (
                note.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-border bg-background px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))
              )}
            </div>
            <div className="mt-auto text-xs text-muted-foreground">
              Updated {formatUpdatedAt(note.updatedAt)}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
