import * as notesRepo from "@/server/repos/notes";
import { handleUnknown, json } from "@/server/http";

export async function GET() {
  try {
    const notes = await notesRepo.listDeleted();
    return json({ notes });
  } catch (e) {
    return handleUnknown(e);
  }
}
