"use client";

import { ApiRequestError } from "@/hooks/api";
import type { ExportSingleFormat } from "@/lib/schemas/export";

async function downloadFromResponse(
  response: Response,
  fallbackName: string,
): Promise<void> {
  if (!response.ok) {
    type ErrorPayload = { error?: { code?: string; message?: string } };
    let payload: ErrorPayload | null = null;
    try {
      payload = (await response.json()) as ErrorPayload;
    } catch {
      payload = null;
    }
    throw new ApiRequestError(response.status, {
      code: payload?.error?.code ?? "HTTP_ERROR",
      message:
        payload?.error?.message ?? `Export failed (${response.status})`,
    });
  }

  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? fallbackName;

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function exportNote(
  noteId: string,
  format: ExportSingleFormat,
): Promise<void> {
  const response = await fetch(
    `/api/notes/${noteId}/export?format=${format}`,
  );
  await downloadFromResponse(response, `note-${noteId}.${format}`);
}

export type ExportAllOptions = {
  includeTrash?: boolean;
  includeVersions?: boolean;
};

export async function exportAll(
  options: ExportAllOptions = {},
): Promise<void> {
  const params = new URLSearchParams({ format: "zip" });
  if (options.includeTrash) params.set("includeTrash", "true");
  if (options.includeVersions) params.set("includeVersions", "true");
  const response = await fetch(`/api/export?${params.toString()}`);
  await downloadFromResponse(response, "notegraph-export.zip");
}
