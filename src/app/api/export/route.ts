import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exportBulkQuerySchema } from "@/lib/schemas/export";
import {
  buildBulkZip,
  type ExportableVersion,
} from "@/server/services/export";
import { handleUnknown, parseQuery } from "@/server/http";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const params = parseQuery(request, exportBulkQuerySchema);

    const notes = await prisma.note.findMany({
      where: params.includeTrash
        ? { isPlaceholder: false }
        : { deletedAt: null, isPlaceholder: false },
      orderBy: { updatedAt: "desc" },
    });

    let versions: Map<string, ExportableVersion[]> | undefined;
    if (params.includeVersions && notes.length > 0) {
      const rows = await prisma.version.findMany({
        where: { noteId: { in: notes.map((n) => n.id) } },
        orderBy: [{ noteId: "asc" }, { version: "asc" }],
        select: { noteId: true, version: true, body: true, createdAt: true },
      });
      versions = new Map();
      for (const row of rows) {
        const list = versions.get(row.noteId) ?? [];
        list.push({
          version: row.version,
          body: row.body,
          createdAt: row.createdAt,
        });
        versions.set(row.noteId, list);
      }
    }

    const buf = await buildBulkZip({
      notes,
      versions,
      includeTrash: params.includeTrash,
      includeVersions: params.includeVersions,
    });

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="notegraph-export-${stamp}.zip"`,
        "Content-Length": String(buf.byteLength),
      },
    });
  } catch (e) {
    return handleUnknown(e);
  }
}
