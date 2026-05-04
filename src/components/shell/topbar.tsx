"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function Topbar() {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4">
      <div className="text-sm text-muted-foreground">Knowledge base</div>
      <Link
        href="/notes"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <Search data-icon="inline-start" />
        Search
      </Link>
    </header>
  );
}
