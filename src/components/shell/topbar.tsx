"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportAll } from "@/hooks/use-export";

export function Topbar() {
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

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4">
      <div className="text-sm text-muted-foreground">Knowledge base</div>
      <div className="flex items-center gap-2">
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
