"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Download, Eye, Network, Pencil, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDeleteNote, useNote, useNoteInfo, useRestoreNote } from "@/hooks/use-notes";
import { exportNote } from "@/hooks/use-export";
import { BacklinksPanel } from "@/components/notes/backlinks-panel";
import { BrokenLinkBadge } from "@/components/notes/broken-link-badge";
import { NoteEditor } from "@/components/notes/note-editor";
import { NoteView } from "@/components/notes/note-view";
import { VersionHistoryPanel } from "@/components/notes/version-history-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type NoteDetailClientProps = {
  noteId: string;
};

export function NoteDetailClient({ noteId }: NoteDetailClientProps) {
  const router = useRouter();
  const [activePanel, setActivePanel] = useState<"backlinks" | "versions">(
    "backlinks",
  );
  const [mode, setMode] = useState<"view" | "edit">("view");
  const noteQuery = useNote(noteId);
  const note = noteQuery.data;
  const infoQuery = useNoteInfo(noteId, !noteQuery.isLoading && !note);
  const deleteNote = useDeleteNote();
  const restoreNote = useRestoreNote();
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport(format: "md" | "json") {
    setIsExporting(true);
    try {
      await exportNote(noteId, format);
      toast.success(`Exported as .${format}`, { id: `export-${noteId}` });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Export failed",
        { id: `export-${noteId}` },
      );
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDelete() {
    try {
      const deleted = await deleteNote.mutateAsync(noteId);
      toast.success(`Deleted "${deleted.title}"`, { id: `delete-${noteId}` });
      router.push("/notes");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Delete failed",
        { id: `delete-${noteId}` },
      );
    }
  }

  async function handleRestore() {
    try {
      const restored = await restoreNote.mutateAsync(noteId);
      toast.success(`Restored "${restored.title}"`, { id: `restore-${noteId}` });
      router.push(`/notes/${restored.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Restore failed",
        { id: `restore-${noteId}` },
      );
    }
  }

  if (noteQuery.isLoading) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_22rem]">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </main>
    );
  }

  if (!note) {
    const info = infoQuery.data;
    const isDeleted = info?.deletedAt != null;
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-6">
        <Link
          href="/notes"
          className={cn(buttonVariants({ variant: "ghost" }), "w-fit")}
        >
          <ArrowLeft data-icon="inline-start" />
          Notes
        </Link>
        <div className="rounded-lg border border-dashed border-border p-6">
          <h1 className="text-xl font-semibold">
            {isDeleted ? `"${info?.title}" was deleted` : "Note not found"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isDeleted
              ? "Restore it to bring back its content and incoming links."
              : "This note does not exist."}
          </p>
          {isDeleted ? (
            <Button
              type="button"
              className="mt-4"
              variant="outline"
              disabled={restoreNote.isPending}
              onClick={handleRestore}
            >
              {restoreNote.isPending ? "Restoring" : "Restore note"}
            </Button>
          ) : null}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/notes"
          className={cn(buttonVariants({ variant: "ghost" }), "w-fit")}
        >
          <ArrowLeft data-icon="inline-start" />
          Notes
        </Link>
        <div className="flex gap-2">
          <Link href="/graph" className={buttonVariants({ variant: "outline" })}>
            <Network data-icon="inline-start" />
            Graph
          </Link>
          <Button
            type="button"
            variant="outline"
            disabled={isExporting}
            onClick={() => handleExport("md")}
          >
            <Download data-icon="inline-start" />
            {isExporting ? "Exporting" : "Export .md"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isExporting}
            onClick={() => handleExport("json")}
          >
            <Download data-icon="inline-start" />
            .json
          </Button>
          <Dialog>
            <DialogTrigger render={<Button variant="destructive" />}>
              <Trash2 data-icon="inline-start" />
              Delete
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete note?</DialogTitle>
                <DialogDescription>
                  The note will be hidden, and incoming links will be marked broken.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deleteNote.isPending}
                  onClick={handleDelete}
                >
                  {deleteNote.isPending ? "Deleting" : "Delete note"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="min-w-0 rounded-lg border border-border p-4">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h1 className="min-w-0 flex-1 truncate text-2xl font-semibold">
              {note.title}
            </h1>
            {note.isPlaceholder ? <BrokenLinkBadge state="placeholder" /> : null}
            <div className="ml-auto inline-flex rounded-lg bg-muted p-0.5">
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                  mode === "view"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setMode("view")}
              >
                <Eye className="size-3.5" /> View
              </button>
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                  mode === "edit"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setMode("edit")}
              >
                <Pencil className="size-3.5" /> Edit
              </button>
            </div>
          </div>
          {mode === "view" ? (
            <NoteView body={note.body} outgoingLinks={note.outgoingLinks} />
          ) : (
            <NoteEditor note={note} />
          )}

          {note.outgoingLinks.length > 0 ? (
            <div className="mt-6 border-t border-border pt-4">
              <h2 className="text-sm font-medium">Outgoing links</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {note.outgoingLinks.map((link) => (
                  <span
                    key={link.id}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-2 py-1 text-sm"
                  >
                    {link.targetTitle}
                    {link.isBroken ? <BrokenLinkBadge state="broken" /> : null}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <aside className="min-w-0 rounded-lg border border-border">
          <div className="border-b border-border p-4">
            <h2 className="text-base font-semibold">Context</h2>
            <div className="mt-3 grid grid-cols-2 rounded-lg bg-muted p-1">
              <button
                type="button"
                className={cn(
                  "h-8 rounded-md text-sm font-medium transition-colors",
                  activePanel === "backlinks"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setActivePanel("backlinks")}
              >
                Backlinks
              </button>
              <button
                type="button"
                className={cn(
                  "h-8 rounded-md text-sm font-medium transition-colors",
                  activePanel === "versions"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setActivePanel("versions")}
              >
                Versions
              </button>
            </div>
          </div>
          <div className="p-4">
            {activePanel === "backlinks" ? (
              <BacklinksPanel backlinks={note.backlinks} />
            ) : (
              <VersionHistoryPanel noteId={note.id} />
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
