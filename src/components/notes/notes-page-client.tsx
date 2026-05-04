"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotes } from "@/hooks/use-notes";
import { useSearch } from "@/hooks/use-search";
import { NoteList } from "@/components/notes/note-list";
import { NewNoteDialog } from "@/components/notes/new-note-dialog";
import { SearchBar } from "@/components/notes/search-bar";
import { Skeleton } from "@/components/ui/skeleton";

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timeout);
  }, [delayMs, value]);

  return debounced;
}

export function NotesPageClient() {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const debouncedQ = useDebouncedValue(q.trim(), 250);
  const allNotesQuery = useNotes();
  const searchQuery = useSearch(debouncedQ, tag);
  const notes = searchQuery.data ?? [];

  const tags = useMemo(() => {
    const unique = new Set<string>();
    for (const note of allNotesQuery.data ?? []) {
      for (const noteTag of note.tags) unique.add(noteTag);
    }
    return [...unique].sort((a, b) => a.localeCompare(b));
  }, [allNotesQuery.data]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Search titles, filter by tag, and open notes into the graph.
          </p>
        </div>
        <NewNoteDialog
          trigger={
            <Button type="button" className="w-fit">
              <Plus data-icon="inline-start" />
              New note
            </Button>
          }
        />
      </div>

      <SearchBar
        q={q}
        tag={tag}
        tags={tags}
        onQChange={setQ}
        onTagChange={setTag}
      />

      {searchQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : searchQuery.error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {searchQuery.error.message}
        </div>
      ) : (
        <NoteList notes={notes} />
      )}
    </main>
  );
}
