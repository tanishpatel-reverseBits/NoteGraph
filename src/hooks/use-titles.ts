"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, withSearchParams } from "@/hooks/api";

export type TitleSearchResult = {
  id: string;
  title: string;
  isPlaceholder: boolean;
};

type TitlesPayload = { titles: TitleSearchResult[] };

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs, value]);

  return debounced;
}

export function useTitleSearch(q: string | undefined, debounceMs = 180) {
  const debouncedQ = useDebouncedValue(q, debounceMs);

  return useQuery({
    queryKey: ["titles", debouncedQ ?? ""],
    queryFn: async () => {
      const data = await apiFetch<TitlesPayload>(
        withSearchParams("/api/titles", { q: debouncedQ }),
      );
      return data.titles;
    },
  });
}
