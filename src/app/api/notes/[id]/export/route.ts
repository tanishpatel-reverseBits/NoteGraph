import type { NextRequest } from "next/server";
import * as notesRepo from "@/server/repos/notes";
import { exportSingleQuerySchema } from "@/lib/schemas/export";
import {
  noteToJson,
  noteToMarkdown,
  safeFilename,
} from "@/server/services/export";
import { AppError } from "@/server/errors";
import { handleUnknown, parseQuery } from "@/server/http";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const { format } = parseQuery(request, exportSingleQuerySchema);

    const note = await notesRepo.findById(id);
    if (!note || note.deletedAt !== null) {
      throw AppError.notFound("Note not found");
    }

    const filename = safeFilename(note.title, note.id);

    if (format === "md") {
      return new Response(noteToMarkdown(note), {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.md"`,
        },
      });
    }

    return new Response(JSON.stringify(noteToJson(note), null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.json"`,
      },
    });
  } catch (e) {
    return handleUnknown(e);
  }
}
