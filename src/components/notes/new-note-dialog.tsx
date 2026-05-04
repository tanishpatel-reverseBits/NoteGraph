"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagChipInput } from "@/components/forms/tag-chip-input";
import { useCreateNote } from "@/hooks/use-notes";
import { titleSchema } from "@/lib/schemas/note";

type NewNoteDialogProps = {
  trigger: React.ReactElement;
};

export function NewNoteDialog({ trigger }: NewNoteDialogProps) {
  const router = useRouter();
  const createNote = useCreateNote();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setTitle("");
    setTags([]);
    setError(null);
  }

  async function handleCreate() {
    const parsed = titleSchema.safeParse(title);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid title");
      return;
    }
    try {
      const note = await createNote.mutateAsync({
        title: parsed.data,
        body: "",
        tags,
      });
      toast.success(`Created "${note.title}"`, { id: "create-note" });
      reset();
      setOpen(false);
      router.push(`/notes/${note.id}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Create failed";
      setError(message);
      toast.error(message, { id: "create-note" });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New note</DialogTitle>
          <DialogDescription>
            Pick a title. You can rename, edit, and link later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="new-note-title">Title</Label>
            <Input
              id="new-note-title"
              autoFocus
              value={title}
              placeholder="Project brief"
              onChange={(event) => {
                setTitle(event.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleCreate();
                }
              }}
            />
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-note-tags">Tags</Label>
            <TagChipInput id="new-note-tags" value={tags} onChange={setTags} />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            disabled={createNote.isPending || title.trim().length === 0}
            onClick={handleCreate}
          >
            {createNote.isPending ? "Creating" : "Create note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
