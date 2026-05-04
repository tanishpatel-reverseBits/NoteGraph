"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { NoteCreateInput, NoteUpdateInput } from "@/lib/schemas/note";
import type { Note as DbNote, NoteWithRelations } from "@/lib/types";
import { apiFetch, withSearchParams } from "@/hooks/api";

type NotesPayload = { notes: DbNote[] };
type NotePayload = { note: DbNote };
type NoteWithRelationsPayload = { note: NoteWithRelations };
type NoteInfoPayload = {
  id: string;
  title: string;
  deletedAt: string | null;
  isPlaceholder: boolean;
};

export const noteKeys = {
  all: ["notes"] as const,
  list: (params: { q?: string; tag?: string } = {}) =>
    ["notes", params] as const,
  detail: (id: string) => ["note", id] as const,
};

function invalidateNoteCollections(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: noteKeys.all });
  void queryClient.invalidateQueries({ queryKey: ["search"] });
  void queryClient.invalidateQueries({ queryKey: ["graph"] });
  void queryClient.invalidateQueries({ queryKey: ["titles"] });
  void queryClient.invalidateQueries({ queryKey: ["trash"] });
}

export function useNotes(params: { q?: string; tag?: string } = {}) {
  return useQuery({
    queryKey: noteKeys.list(params),
    queryFn: async () => {
      const data = await apiFetch<NotesPayload>(
        withSearchParams("/api/notes", params),
      );
      return data.notes;
    },
  });
}

export function useNote(id: string | undefined) {
  return useQuery({
    queryKey: id ? noteKeys.detail(id) : ["note", undefined],
    enabled: Boolean(id),
    queryFn: async () => {
      const data = await apiFetch<NoteWithRelationsPayload>(`/api/notes/${id}`);
      return data.note;
    },
  });
}

export function useTrash() {
  return useQuery({
    queryKey: ["trash"],
    queryFn: async () => {
      const data = await apiFetch<NotesPayload>("/api/trash");
      return data.notes;
    },
  });
}

export function useNoteInfo(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: id ? ["note", id, "info"] : ["note", undefined, "info"],
    enabled: Boolean(id) && enabled,
    retry: false,
    queryFn: () => apiFetch<NoteInfoPayload>(`/api/notes/${id}/info`),
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: NoteCreateInput) => {
      const data = await apiFetch<NotePayload>("/api/notes", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return data.note;
    },
    onSuccess: () => invalidateNoteCollections(queryClient),
  });
}

export function useUpdateNote(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: NoteUpdateInput) => {
      const data = await apiFetch<NotePayload>(`/api/notes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      return data.note;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: noteKeys.detail(id) });
      invalidateNoteCollections(queryClient);
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const data = await apiFetch<NotePayload>(`/api/notes/${id}`, {
        method: "DELETE",
      });
      return data.note;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: noteKeys.all });
      await queryClient.cancelQueries({ queryKey: ["search"] });
      const snapshots = queryClient.getQueriesData<DbNote[]>({ queryKey: noteKeys.all });
      const searchSnapshots = queryClient.getQueriesData<DbNote[]>({ queryKey: ["search"] });
      for (const [key, data] of [...snapshots, ...searchSnapshots]) {
        if (data) {
          queryClient.setQueryData<DbNote[]>(key, data.filter((n) => n.id !== id));
        }
      }
      return { snapshots: [...snapshots, ...searchSnapshots] };
    },
    onError: (_err, _id, context) => {
      for (const [key, data] of context?.snapshots ?? []) {
        queryClient.setQueryData(key, data);
      }
    },
    onSettled: (note) => {
      if (note) {
        void queryClient.invalidateQueries({ queryKey: noteKeys.detail(note.id) });
      }
      invalidateNoteCollections(queryClient);
    },
  });
}

export function useRestoreNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const data = await apiFetch<NotePayload>(`/api/notes/${id}/restore`, {
        method: "POST",
      });
      return data.note;
    },
    onSuccess: (note) => {
      void queryClient.invalidateQueries({ queryKey: noteKeys.detail(note.id) });
      invalidateNoteCollections(queryClient);
    },
  });
}
