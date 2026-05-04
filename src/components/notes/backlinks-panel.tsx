"use client";

import Link from "next/link";
import type { Backlink } from "@/lib/types";
import { BrokenLinkBadge } from "@/components/notes/broken-link-badge";

type BacklinksPanelProps = {
  backlinks: Backlink[];
};

export function BacklinksPanel({ backlinks }: BacklinksPanelProps) {
  if (backlinks.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        No backlinks yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {backlinks.map((backlink) => (
        <Link
          key={backlink.id}
          href={`/notes/${backlink.id}`}
          className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-muted"
        >
          <span className="min-w-0 truncate font-medium">{backlink.title}</span>
          {backlink.isPlaceholder ? <BrokenLinkBadge state="placeholder" /> : null}
        </Link>
      ))}
    </div>
  );
}
