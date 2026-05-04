"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DiffLine, Note, Version } from "@/lib/types";
import { apiFetch, withSearchParams } from "@/hooks/api";

type VersionsPayload = { versions: Version[] };
type VersionPayload = { version: Version };
type DiffPayload = { diff: DiffLine[] };
type RestoreVersionPayload = { note: Note; version: Version };

export const versionKeys = {
  list: (noteId: string) => ["note", noteId, "versions"] as const,
  detail: (noteId: string, version: number) =>
    ["note", noteId, "versions", version] as const,
  diff: (noteId: string, from: number, to: number) =>
    ["note", noteId, "diff", from, to] as const,
};

export function useVersions(noteId: string | undefined) {
  return useQuery({
    queryKey: noteId ? versionKeys.list(noteId) : ["note", undefined, "versions"],
    enabled: Boolean(noteId),
    queryFn: async () => {
      const data = await apiFetch<VersionsPayload>(
        `/api/notes/${noteId}/versions`,
      );
      return data.versions;
    },
  });
}

export function useVersion(noteId: string | undefined, version: number | undefined) {
  return useQuery({
    queryKey:
      noteId && version
        ? versionKeys.detail(noteId, version)
        : ["note", noteId, "versions", version],
    enabled: Boolean(noteId && version),
    queryFn: async () => {
      const data = await apiFetch<VersionPayload>(
        `/api/notes/${noteId}/versions/${version}`,
      );
      return data.version;
    },
  });
}

export function useDiff(
  noteId: string | undefined,
  from: number | undefined,
  to: number | undefined,
) {
  return useQuery({
    queryKey:
      noteId && from && to
        ? versionKeys.diff(noteId, from, to)
        : ["note", noteId, "diff", from, to],
    enabled: Boolean(noteId && from && to && from !== to),
    queryFn: async () => {
      const data = await apiFetch<DiffPayload>(
        withSearchParams(`/api/notes/${noteId}/diff`, { from, to }),
      );
      return data.diff;
    },
  });
}

export function useRestoreVersion(noteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (version: number) => {
      return apiFetch<RestoreVersionPayload>(
        `/api/notes/${noteId}/versions/${version}/restore`,
        { method: "POST" },
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["note", noteId] });
      void queryClient.invalidateQueries({ queryKey: versionKeys.list(noteId) });
      void queryClient.invalidateQueries({ queryKey: ["graph"] });
    },
  });
}
