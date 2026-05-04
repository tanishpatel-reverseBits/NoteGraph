"use client";

import { useQuery } from "@tanstack/react-query";
import type { Note } from "@/lib/types";
import { apiFetch, withSearchParams } from "@/hooks/api";

type SearchPayload = { notes: Note[] };

export function useSearch(q?: string, tag?: string) {
  return useQuery({
    queryKey: ["search", { q, tag }],
    queryFn: async () => {
      const data = await apiFetch<SearchPayload>(
        withSearchParams("/api/search", { q, tag }),
      );
      return data.notes;
    },
  });
}
