"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportAll } from "@/hooks/use-export";

const SEGMENT_LABELS: Record<string, string> = {
  notes: "Notes",
  graph: "Graph",
  trash: "Trash",
};

function formatSegment(segment: string): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  if (segment.length > 20) return `${segment.slice(0, 8)}…`;
  return segment;
}

export function Topbar() {
  const pathname = usePathname();
  const [isExporting, setIsExporting] = useState(false);

  async function handleExportAll() {
    setIsExporting(true);
    try {
      await exportAll();
      toast.success("Export ready", { id: "export-all" });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Export failed",
        { id: "export-all" },
      );
    } finally {
      setIsExporting(false);
    }
  }

  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    return { href, label: formatSegment(seg) };
  });

  return (
    <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm">
        {crumbs.length === 0 ? (
          <span className="text-muted-foreground">Knowledge base</span>
        ) : (
          crumbs.map((crumb, i) => {
            const last = i === crumbs.length - 1;
            return (
              <span key={crumb.href} className="flex min-w-0 items-center gap-1">
                {i > 0 ? (
                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                ) : null}
                {last ? (
                  <span className="truncate font-medium">{crumb.label}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="truncate text-muted-foreground hover:text-foreground"
                  >
                    {crumb.label}
                  </Link>
                )}
              </span>
            );
          })
        )}
      </nav>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isExporting}
          onClick={handleExportAll}
        >
          <Download data-icon="inline-start" />
          {isExporting ? "Exporting" : "Export all"}
        </Button>
      </div>
    </header>
  );
}
