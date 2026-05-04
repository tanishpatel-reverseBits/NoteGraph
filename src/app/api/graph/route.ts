import { buildGraph } from "@/server/services/graph";
import { handleUnknown, json } from "@/server/http";

export async function GET() {
  try {
    const graph = await buildGraph();
    return json({ graph });
  } catch (e) {
    return handleUnknown(e);
  }
}
