"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRestoreNote, useTrash } from "@/hooks/use-notes";

function formatDeletedAt(value: Date | string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function TrashPageClient() {
  const router = useRouter();
  const trashQuery = useTrash();
  const restoreNote = useRestoreNote();
  const notes = trashQuery.data ?? [];

  async function handleRestore(id: string, title: string) {
    try {
      await restoreNote.mutateAsync(id);
      toast.success(`Restored "${title}"`, { id: `restore-${id}` });
      router.push(`/notes/${id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Restore failed",
        { id: `restore-${id}` },
      );
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Trash2 className="size-5" /> Trash
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Soft-deleted notes. Restoring heals incoming links.
        </p>
      </div>

      {trashQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : trashQuery.error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {trashQuery.error.message}
        </div>
      ) : notes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <h2 className="text-base font-semibold">Trash is empty</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Deleted notes appear here for restore.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          {notes.map((note, index) => (
            <div
              key={note.id}
              className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between"
              style={{ borderTopWidth: index === 0 ? 0 : 1 }}
            >
              <div className="min-w-0">
                <h2 className="truncate text-sm font-medium">{note.title}</h2>
                <p className="text-xs text-muted-foreground">
                  Deleted {formatDeletedAt(note.deletedAt)}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={restoreNote.isPending}
                onClick={() => handleRestore(note.id, note.title)}
              >
                <RotateCcw data-icon="inline-start" />
                Restore
              </Button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
