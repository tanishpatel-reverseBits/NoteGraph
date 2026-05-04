"use client";

import type { Note } from "@/lib/types";
import { NoteForm } from "@/components/forms/note-form";

type NoteEditorProps = {
  note: Pick<Note, "id" | "title" | "body" | "tags"> & {
    outgoingLinks?: Array<{
      id: string;
      targetTitle: string;
      isBroken: boolean;
    }>;
  };
};

export function NoteEditor({ note }: NoteEditorProps) {
  return <NoteForm note={note} submitLabel="Save note" />;
}
