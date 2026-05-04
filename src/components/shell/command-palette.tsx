"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTitleSearch } from "@/hooks/use-titles";
import { cn } from "@/lib/utils";

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const titles = useTitleSearch(q.trim() || undefined);
  const results = titles.data ?? [];
  const activeIndex = results.length === 0 ? 0 : Math.min(active, results.length - 1);

  useEffect(() => {
    function handler(event: KeyboardEvent) {
      const isMod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      if (isMod && (key === "k" || key === "p")) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  function navigateTo(id: string) {
    setOpen(false);
    setQ("");
    setActive(0);
    router.push(`/notes/${id}`);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (event.key === "Enter") {
      const target = results[activeIndex];
      if (target) navigateTo(target.id);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setQ("");
          setActive(0);
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Quick open</DialogTitle>
          <DialogDescription>Search notes by title.</DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setActive(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type to search…"
        />
        <div className="max-h-72 overflow-auto rounded-lg border border-border">
          {results.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              {q ? "No matches." : "Start typing to search."}
            </p>
          ) : (
            results.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => setActive(index)}
                onClick={() => navigateTo(item.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 border-b border-border px-3 py-2 text-left text-sm last:border-b-0",
                  index === activeIndex ? "bg-muted" : "hover:bg-muted/60",
                )}
              >
                <span className="min-w-0 truncate font-medium">{item.title}</span>
                {item.isPlaceholder ? (
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-600">
                    placeholder
                  </span>
                ) : null}
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
