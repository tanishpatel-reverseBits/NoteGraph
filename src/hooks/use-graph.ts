"use client";

import { useQuery } from "@tanstack/react-query";
import type { GraphPayload } from "@/lib/types";
import { apiFetch } from "@/hooks/api";

type GraphResponse = { graph: GraphPayload };

export function useGraph() {
  return useQuery({
    queryKey: ["graph"],
    queryFn: async () => {
      const data = await apiFetch<GraphResponse>("/api/graph");
      return data.graph;
    },
  });
}
