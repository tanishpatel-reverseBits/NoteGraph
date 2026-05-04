"use client";

import { cn } from "@/lib/utils";

type BrokenLinkBadgeProps = {
  state: "broken" | "placeholder";
  className?: string;
};

export function BrokenLinkBadge({ state, className }: BrokenLinkBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-md border px-1.5 text-xs font-medium",
        state === "broken"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-border bg-muted text-muted-foreground",
        className,
      )}
    >
      {state === "broken" ? "Broken" : "Placeholder"}
    </span>
  );
}
