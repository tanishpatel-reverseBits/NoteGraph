import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { titleQuerySchema } from "@/lib/schemas/note";
import { handleUnknown, json, parseQuery } from "@/server/http";

export async function GET(request: NextRequest) {
  try {
    const { q } = parseQuery(request, titleQuerySchema);
    const titles = await prisma.note.findMany({
      where: {
        deletedAt: null,
        ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
      },
      orderBy: { title: "asc" },
      take: 10,
      select: { id: true, title: true, isPlaceholder: true },
    });

    return json({ titles });
  } catch (e) {
    return handleUnknown(e);
  }
}
