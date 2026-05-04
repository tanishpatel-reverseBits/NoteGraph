"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Save } from "lucide-react";
import { noteCreateSchema, type NoteCreateInput } from "@/lib/schemas/note";
import type { Note } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrokenLinkBadge } from "@/components/notes/broken-link-badge";
import { TagChipInput } from "@/components/forms/tag-chip-input";
import { RichEditor } from "@/components/forms/rich-editor";
import { useCreateNote, useUpdateNote } from "@/hooks/use-notes";
import { cn } from "@/lib/utils";

type NoteFormProps = {
  note?: Pick<Note, "id" | "title" | "body" | "tags"> & {
    outgoingLinks?: Array<{
      id: string;
      targetTitle: string;
      isBroken: boolean;
    }>;
  };
  onSaved?: (note: Note) => void;
  submitLabel?: string;
  className?: string;
  autosaveMs?: number;
};

const BODY_MAX = 1_000_000;
const BODY_WARN_AT = BODY_MAX * 0.9;

export function NoteForm({
  note,
  onSaved,
  submitLabel,
  className,
  autosaveMs = 1500,
}: NoteFormProps) {
  const createNote = useCreateNote();
  const updateNote = useUpdateNote(note?.id ?? "");
  const mutation = note ? updateNote : createNote;
  const [autosaveAt, setAutosaveAt] = useState<Date | null>(null);

  const form = useForm<
    z.input<typeof noteCreateSchema>,
    unknown,
    NoteCreateInput
  >({
    resolver: zodResolver(noteCreateSchema),
    defaultValues: {
      title: note?.title ?? "",
      body: note?.body ?? "",
      tags: note?.tags ?? [],
    },
  });

  useEffect(() => {
    form.reset({
      title: note?.title ?? "",
      body: note?.body ?? "",
      tags: note?.tags ?? [],
    });
  }, [form, note]);

  const performSave = useCallback(
    async (values: NoteCreateInput, source: "submit" | "autosave") => {
      const toastId = note ? `save-${note.id}` : "save-new";
      try {
        const saved = await mutation.mutateAsync(values);
        if (source === "submit") {
          toast.success(note ? "Saved" : `Created "${saved.title}"`, { id: toastId });
        } else {
          setAutosaveAt(new Date());
        }
        form.reset(values, { keepValues: true });
        onSaved?.(saved);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Save failed", {
          id: toastId,
        });
      }
    },
    [form, mutation, note, onSaved],
  );

  function onSubmit(values: NoteCreateInput) {
    return performSave(values, "submit");
  }

  const submitCurrent = useCallback(() => {
    void form.handleSubmit((values) => performSave(values, "submit"))();
  }, [form, performSave]);

  const bodyValue = useWatch({ control: form.control, name: "body" }) ?? "";
  const isDirty = form.formState.isDirty;
  const brokenLinks = useMemo(
    () => note?.outgoingLinks?.filter((link) => link.isBroken) ?? [],
    [note?.outgoingLinks],
  );

  useEffect(() => {
    if (!note) return;
    if (!isDirty) return;
    const timer = window.setTimeout(() => {
      void form.handleSubmit((values) => performSave(values, "autosave"))();
    }, autosaveMs);
    return () => window.clearTimeout(timer);
  }, [autosaveMs, form, isDirty, note, performSave, bodyValue, form.formState.isDirty]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  useEffect(() => {
    function handler(event: KeyboardEvent) {
      const isSave = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s";
      if (!isSave) return;
      event.preventDefault();
      if (!mutation.isPending && form.formState.isDirty) submitCurrent();
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [form.formState.isDirty, mutation.isPending, submitCurrent]);

  const bodyLength = bodyValue.length;
  const bodyCounter = useMemo(() => {
    if (bodyLength < BODY_WARN_AT) return null;
    const pct = Math.round((bodyLength / BODY_MAX) * 100);
    return { pct, over: bodyLength >= BODY_MAX };
  }, [bodyLength]);

  return (
    <form className={cn("space-y-4", className)} onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="note-title">Title</Label>
        <Input
          id="note-title"
          aria-invalid={Boolean(form.formState.errors.title)}
          placeholder="Untitled note"
          {...form.register("title")}
        />
        {form.formState.errors.title ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.title.message}
          </p>
        ) : null}
      </div>

      <Controller
        control={form.control}
        name="body"
        render={({ field, fieldState }) => (
          <div className="space-y-2">
            <div className="flex items-end justify-between gap-2">
              <Label id="note-body-label">Body</Label>
              {bodyCounter ? (
                <span
                  className={cn(
                    "text-xs",
                    bodyCounter.over
                      ? "text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  {bodyLength.toLocaleString()} / {BODY_MAX.toLocaleString()} ({bodyCounter.pct}%)
                </span>
              ) : null}
            </div>
            <RichEditor
              value={field.value ?? ""}
              onChange={(md) => field.onChange(md)}
              invalid={Boolean(fieldState.error)}
              ariaLabelledBy="note-body-label"
            />
            {fieldState.error ? (
              <p className="text-sm text-destructive">{fieldState.error.message}</p>
            ) : null}
            {brokenLinks.length > 0 ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                <div className="flex flex-wrap gap-2">
                  {brokenLinks.map((link) => (
                    <span
                      key={link.id}
                      className="inline-flex items-center gap-2 rounded-md border border-destructive/30 bg-background px-2 py-1 text-sm text-destructive"
                    >
                      [[{link.targetTitle}]]
                      <BrokenLinkBadge state="broken" />
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      />

      <Controller
        control={form.control}
        name="tags"
        render={({ field, fieldState }) => (
          <div className="space-y-2">
            <Label htmlFor="note-tags">Tags</Label>
            <TagChipInput
              id="note-tags"
              value={field.value ?? []}
              invalid={Boolean(fieldState.error)}
              onChange={(next) => {
                form.setValue("tags", next, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
            />
            {fieldState.error ? (
              <p className="text-sm text-destructive">{fieldState.error.message}</p>
            ) : null}
          </div>
        )}
      />

      {mutation.error ? (
        <p className="text-sm text-destructive">{mutation.error.message}</p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <Button type="submit" disabled={mutation.isPending || !form.formState.isDirty}>
          <Save data-icon="inline-start" />
          {mutation.isPending
            ? "Saving"
            : submitLabel ?? (note ? "Save note" : "Create note")}
        </Button>
        {note ? (
          <span className="text-xs text-muted-foreground">
            {mutation.isPending
              ? "Saving…"
              : isDirty
                ? "Unsaved changes"
                : autosaveAt
                  ? `Autosaved ${autosaveAt.toLocaleTimeString()}`
                  : "Up to date"}
          </span>
        ) : null}
      </div>
    </form>
  );
}
