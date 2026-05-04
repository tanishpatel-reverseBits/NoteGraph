"use client";

import type { DiffLine } from "@/lib/types";
import { cn } from "@/lib/utils";

type VersionDiffViewProps = {
  diff: DiffLine[];
};

export function VersionDiffView({ diff }: VersionDiffViewProps) {
  if (diff.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        No differences to show.
      </p>
    );
  }

  return (
    <pre className="max-h-[60vh] overflow-auto rounded-lg border border-border bg-muted/30 p-3 text-sm leading-6">
      {diff.map((line, index) => (
        <div
          key={`${line.type}-${index}-${line.text}`}
          className={cn(
            "min-h-6 whitespace-pre-wrap px-2 font-mono",
            line.type === "added" && "bg-emerald-500/10 text-emerald-700",
            line.type === "removed" && "bg-destructive/10 text-destructive",
            line.type === "unchanged" && "text-muted-foreground",
          )}
        >
          <span className="mr-2 select-none">
            {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
          </span>
          {line.text}
        </div>
      ))}
    </pre>
  );
}
