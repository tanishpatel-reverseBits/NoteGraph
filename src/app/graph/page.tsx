import { GraphCanvas } from "@/components/graph/graph-canvas";
import { GraphLegend } from "@/components/graph/graph-legend";

export default function GraphPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Graph</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Follow notes, placeholders, and broken references across the knowledge base.
          </p>
        </div>
        <GraphLegend />
      </div>

      <GraphCanvas />
    </main>
  );
}
