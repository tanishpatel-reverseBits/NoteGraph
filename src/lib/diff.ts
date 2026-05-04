import { diffLines } from "diff";
import type { DiffLine } from "@/lib/types";

export function diffBodies(a: string, b: string): DiffLine[] {
  const parts = diffLines(a, b);
  const out: DiffLine[] = [];

  for (const part of parts) {
    const type: DiffLine["type"] = part.added
      ? "added"
      : part.removed
        ? "removed"
        : "unchanged";

    const lines = part.value.split("\n");
    if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();

    for (const text of lines) out.push({ type, text });
  }

  return out;
}
