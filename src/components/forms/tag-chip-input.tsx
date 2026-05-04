"use client";

import { useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { useNotes } from "@/hooks/use-notes";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type TagChipInputProps = {
  value: string[];
  onChange: (next: string[]) => void;
  invalid?: boolean;
  id?: string;
  excludeTags?: Iterable<string>;
};

const MAX_SUGGESTIONS = 6;

export function TagChipInput({
  value,
  onChange,
  invalid,
  id,
  excludeTags,
}: TagChipInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const allNotesQuery = useNotes();

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const note of allNotesQuery.data ?? []) {
      for (const tag of note.tags) set.add(tag);
    }
    for (const tag of excludeTags ?? []) set.delete(tag);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [allNotesQuery.data, excludeTags]);

  const suggestions = useMemo(() => {
    const lower = draft.trim().toLowerCase();
    const taken = new Set(value);
    const filtered = allTags.filter(
      (tag) =>
        !taken.has(tag) &&
        (lower.length === 0 || tag.toLowerCase().includes(lower)),
    );
    return filtered.slice(0, MAX_SUGGESTIONS);
  }, [allTags, draft, value]);

  function commit(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed || value.includes(trimmed)) {
      setDraft("");
      return;
    }
    onChange([...value, trimmed]);
    setDraft("");
  }

  function remove(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit(draft);
      return;
    }
    if (event.key === "Backspace" && draft.length === 0 && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          "flex flex-wrap items-center gap-1.5 rounded-lg border border-input bg-background p-1.5 text-sm",
          invalid && "border-destructive",
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              className="text-muted-foreground hover:text-foreground"
              onClick={(event) => {
                event.stopPropagation();
                remove(tag);
              }}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <Input
          id={id}
          ref={inputRef}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 120);
            if (draft.trim()) commit(draft);
          }}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? "Add tag, press enter" : ""}
          className="h-7 min-w-32 flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
        />
      </div>
      {open && suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              className="rounded-md border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => commit(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
