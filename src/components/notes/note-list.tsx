"use client";

import Link from "next/link";
import type { Note } from "@/lib/types";
import { BrokenLinkBadge } from "@/components/notes/broken-link-badge";

type NoteListProps = {
  notes: Note[];
};

function formatUpdatedAt(value: Date | string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function NoteList({ notes }: NoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <h2 className="text-base font-semibold">No notes found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Create a note or clear the current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {notes.map((note, index) => (
        <Link
          key={note.id}
          href={`/notes/${note.id}`}
          className="flex flex-col gap-2 border-border p-4 transition-colors hover:bg-muted md:flex-row md:items-center md:justify-between"
          style={{ borderTopWidth: index === 0 ? 0 : 1 }}
        >
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="truncate text-sm font-medium">{note.title}</h2>
              {note.isPlaceholder ? <BrokenLinkBadge state="placeholder" /> : null}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="shrink-0 text-xs text-muted-foreground">
            {formatUpdatedAt(note.updatedAt)}
          </div>
        </Link>
      ))}
    </div>
  );
}
