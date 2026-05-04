"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SearchBarProps = {
  q: string;
  tag: string;
  tags: string[];
  onQChange: (q: string) => void;
  onTagChange: (tag: string) => void;
};

export function SearchBar({
  q,
  tag,
  tags,
  onQChange,
  onTagChange,
}: SearchBarProps) {
  const hasFilters = q.length > 0 || tag.length > 0;

  return (
    <div className="flex flex-col gap-2 md:flex-row">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(event) => onQChange(event.target.value)}
          placeholder="Search titles"
          className="pl-8"
        />
      </div>
      <select
        value={tag}
        onChange={(event) => onTagChange(event.target.value)}
        className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="">All tags</option>
        {tags.map((tagOption) => (
          <option key={tagOption} value={tagOption}>
            {tagOption}
          </option>
        ))}
      </select>
      {hasFilters ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            onQChange("");
            onTagChange("");
          }}
        >
          <X data-icon="inline-start" />
          Clear
        </Button>
      ) : null}
    </div>
  );
}
