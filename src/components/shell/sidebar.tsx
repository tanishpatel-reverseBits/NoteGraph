"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Network, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NewNoteDialog } from "@/components/notes/new-note-dialog";
import { Logo } from "@/components/shell/logo";

const NAV = [
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/graph", label: "Graph", icon: Network },
  { href: "/notes/trash", label: "Trash", icon: Trash2 },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col gap-4 border-r border-border bg-muted/20 px-3 py-4">
      <Link
        href="/notes"
        className="flex items-center gap-2 px-2 text-lg font-semibold tracking-tight"
      >
        <Logo />
        NoteGraph
      </Link>

      <NewNoteDialog
        trigger={
          <Button type="button" size="sm">
            <Plus data-icon="inline-start" />
            New note
          </Button>
        }
      />

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const matches =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const moreSpecific = NAV.some(
            (other) =>
              other.href !== item.href &&
              other.href.startsWith(item.href) &&
              (pathname === other.href || pathname.startsWith(`${other.href}/`)),
          );
          const active = matches && !moreSpecific;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
