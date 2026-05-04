"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useTitleSearch } from "@/hooks/use-titles";
import { cn } from "@/lib/utils";

type WikilinkSuggestProps = {
  value: string;
  caret: number | null;
  onInsert: (nextValue: string, nextCaret: number) => void;
  className?: string;
};

type ActiveWikilink = {
  start: number;
  end: number;
  query: string;
};

function getActiveWikilink(value: string, caret: number | null): ActiveWikilink | null {
  if (caret === null) return null;

  const beforeCaret = value.slice(0, caret);
  const start = beforeCaret.lastIndexOf("[[");
  if (start === -1) return null;

  const afterOpen = beforeCaret.slice(start + 2);
  if (afterOpen.includes("]]") || afterOpen.includes("\n")) return null;

  const close = value.indexOf("]]", caret);
  const nextOpen = value.indexOf("[[", start + 2);
  if (nextOpen !== -1 && nextOpen < caret) return null;

  return {
    start,
    end: close === -1 ? caret : close + 2,
    query: afterOpen,
  };
}

export function WikilinkSuggest({
  value,
  caret,
  onInsert,
  className,
}: WikilinkSuggestProps) {
  const active = useMemo(() => getActiveWikilink(value, caret), [value, caret]);
  const query = active?.query.trim() ?? "";
  const titlesQuery = useTitleSearch(query);
  const suggestions = titlesQuery.data ?? [];

  if (!active || suggestions.length === 0) return null;

  function insertTitle(title: string) {
    if (!active) return;

    const replacement = `[[${title}]]`;
    const nextValue =
      value.slice(0, active.start) + replacement + value.slice(active.end);
    onInsert(nextValue, active.start + replacement.length);
  }

  return (
    <div
      className={cn(
        "absolute z-20 mt-1 w-full max-w-sm rounded-lg border border-border bg-popover p-1 shadow-md",
        className,
      )}
    >
      {suggestions.map((suggestion) => (
        <Button
          key={suggestion.id}
          type="button"
          variant="ghost"
          className="h-auto w-full justify-start px-2 py-1.5 text-left"
          onClick={() => insertTitle(suggestion.title)}
        >
          <span className="min-w-0 flex-1 truncate">{suggestion.title}</span>
          {suggestion.isPlaceholder ? (
            <span className="text-xs text-muted-foreground">Placeholder</span>
          ) : null}
        </Button>
      ))}
    </div>
  );
}
