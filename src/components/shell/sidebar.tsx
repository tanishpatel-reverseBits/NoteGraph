"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronsLeft, ChevronsRight, FileText, Network, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NewNoteDialog } from "@/components/notes/new-note-dialog";
import { Logo } from "@/components/shell/logo";

const NAV = [
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/graph", label: "Graph", icon: Network },
  { href: "/notes/trash", label: "Trash", icon: Trash2 },
] as const;

const STORAGE_KEY = "ng:sidebar-collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col gap-3 border-r border-sidebar-border bg-sidebar px-2.5 py-3 transition-[width] duration-200",
        collapsed ? "w-14" : "w-56",
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <Link
          href="/notes"
          className={cn(
            "flex items-center gap-2 rounded-md px-1.5 py-1 text-sm font-semibold tracking-tight",
            collapsed && "justify-center px-0",
          )}
        >
          <Logo />
          {!collapsed && <span>NoteGraph</span>}
        </Link>
        {!collapsed ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Collapse sidebar"
            onClick={toggle}
          >
            <ChevronsLeft className="size-3.5" />
          </Button>
        ) : null}
      </div>

      {collapsed ? (
        <NewNoteDialog
          trigger={
            <Button
              type="button"
              size="icon-sm"
              aria-label="New note"
              className="self-center"
            >
              <Plus className="size-3.5" />
            </Button>
          }
        />
      ) : (
        <NewNoteDialog
          trigger={
            <Button type="button" size="sm" className="justify-start">
              <Plus data-icon="inline-start" />
              New note
            </Button>
          }
        />
      )}

      <nav className="flex flex-col gap-0.5">
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
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                collapsed && "justify-center px-0",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {collapsed ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Expand sidebar"
          className="mt-auto self-center"
          onClick={toggle}
        >
          <ChevronsRight className="size-3.5" />
        </Button>
      ) : null}
    </aside>
  );
}
