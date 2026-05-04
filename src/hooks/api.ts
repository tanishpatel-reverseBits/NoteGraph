"use client";

import type { ApiError } from "@/lib/types";

export class ApiRequestError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(status: number, error: ApiError["error"]) {
    super(error.message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = error.code;
    this.details = error.details;
  }
}

export async function apiFetch<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const data = (await response.json()) as T | ApiError;

  if (!response.ok) {
    const fallback = {
      code: "HTTP_ERROR",
      message: `Request failed with status ${response.status}`,
    };
    const error =
      typeof data === "object" && data !== null && "error" in data
        ? data.error
        : fallback;
    throw new ApiRequestError(
      response.status,
      error,
    );
  }

  return data as T;
}

export function withSearchParams(
  path: string,
  params: Record<string, string | number | undefined | null>,
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }

  const query = search.toString();
  return query ? `${path}?${query}` : path;
}
