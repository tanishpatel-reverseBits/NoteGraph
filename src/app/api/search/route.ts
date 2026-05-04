import type { NextRequest } from "next/server";
import { noteSearchSchema } from "@/lib/schemas/note";
import * as notesRepo from "@/server/repos/notes";
import { handleUnknown, json, parseQuery } from "@/server/http";

export async function GET(request: NextRequest) {
  try {
    const params = parseQuery(request, noteSearchSchema);
    const notes = await notesRepo.searchNotes(params);
    return json({ notes });
  } catch (e) {
    return handleUnknown(e);
  }
}
