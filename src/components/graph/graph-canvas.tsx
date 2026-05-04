"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from "reactflow";
import "reactflow/dist/style.css";
import { useGraph } from "@/hooks/use-graph";
import { Skeleton } from "@/components/ui/skeleton";
import type { GraphPayload } from "@/lib/types";

type GraphNodeData = {
  label: string;
  noteId?: string;
  isPlaceholder?: boolean;
  isBrokenTarget?: boolean;
};

function layoutGraph(graph: GraphPayload) {
  const nodeCount = graph.nodes.length;
  const radius = Math.max(220, Math.sqrt(Math.max(nodeCount, 1)) * 120);

  const nodes: Node<GraphNodeData>[] = graph.nodes.map((node, index) => {
    const angle = nodeCount > 0 ? (index / nodeCount) * Math.PI * 2 : 0;

    return {
      id: node.id,
      position: {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      },
      data: {
        label: node.title,
        noteId: node.id,
        isPlaceholder: node.isPlaceholder,
      },
      className: node.isPlaceholder
        ? "border-amber-500 bg-amber-50 text-amber-950"
        : "border-border bg-background text-foreground",
      style: {
        borderWidth: 1,
        borderRadius: 8,
        minWidth: 150,
        maxWidth: 220,
        padding: "10px 12px",
        fontSize: 13,
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
      },
    };
  });

  const linkedPairs: Array<{ source: string; target: string }> = [];
  const edges: Edge[] = graph.edges.map((edge) => {
    const targetId = edge.targetId ?? `broken:${edge.id}`;

    if (edge.targetId === null) {
      const sourceIndex = graph.nodes.findIndex((node) => node.id === edge.sourceId);
      const angle =
        sourceIndex >= 0 && nodeCount > 0
          ? (sourceIndex / nodeCount) * Math.PI * 2
          : 0;
      nodes.push({
        id: targetId,
        position: {
          x: Math.cos(angle) * (radius + 220),
          y: Math.sin(angle) * (radius + 220),
        },
        data: {
          label: edge.targetTitle,
          isBrokenTarget: true,
        },
        className: "border-destructive bg-destructive/10 text-destructive",
        style: {
          borderWidth: 1,
          borderRadius: 8,
          borderStyle: "dashed",
          minWidth: 150,
          maxWidth: 220,
          padding: "10px 12px",
          fontSize: 13,
        },
      });
    }

    linkedPairs.push({ source: edge.sourceId, target: targetId });

    return {
      id: edge.id,
      source: edge.sourceId,
      target: targetId,
      label: edge.isBroken ? edge.targetTitle : undefined,
      animated: edge.isBroken,
      type: "smoothstep",
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edge.isBroken ? "var(--destructive)" : "var(--muted-foreground)",
      },
      style: {
        stroke: edge.isBroken ? "var(--destructive)" : "var(--muted-foreground)",
        strokeDasharray: edge.isBroken ? "6 4" : undefined,
        strokeWidth: edge.isBroken ? 2 : 1.5,
      },
      labelStyle: {
        fill: "var(--destructive)",
        fontSize: 12,
        fontWeight: 500,
      },
      labelBgStyle: {
        fill: "var(--background)",
        fillOpacity: 0.9,
      },
    };
  });

  applyForceLayout(nodes, linkedPairs);

  return { nodes, edges };
}

function applyForceLayout(
  nodes: Node<GraphNodeData>[],
  links: Array<{ source: string; target: string }>,
) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const idealLink = 190;

  for (let step = 0; step < 180; step += 1) {
    const alpha = 1 - step / 180;

    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = b.position.x - a.position.x || 0.01;
        const dy = b.position.y - a.position.y || 0.01;
        const distanceSq = Math.max(dx * dx + dy * dy, 400);
        const force = (5200 / distanceSq) * alpha;
        a.position.x -= dx * force;
        a.position.y -= dy * force;
        b.position.x += dx * force;
        b.position.y += dy * force;
      }
    }

    for (const link of links) {
      const source = byId.get(link.source);
      const target = byId.get(link.target);
      if (!source || !target) continue;

      const dx = target.position.x - source.position.x || 0.01;
      const dy = target.position.y - source.position.y || 0.01;
      const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const force = ((distance - idealLink) / distance) * 0.035 * alpha;
      const moveX = dx * force;
      const moveY = dy * force;
      source.position.x += moveX;
      source.position.y += moveY;
      target.position.x -= moveX;
      target.position.y -= moveY;
    }

    for (const node of nodes) {
      node.position.x *= 0.995;
      node.position.y *= 0.995;
    }
  }
}

export function GraphCanvas() {
  const router = useRouter();
  const graphQuery = useGraph();
  const graph = graphQuery.data;
  const elements = useMemo(
    () => (graph ? layoutGraph(graph) : { nodes: [], edges: [] }),
    [graph],
  );

  const onNodeClick: NodeMouseHandler = (_event, node) => {
    const data = node.data as GraphNodeData;
    if (data.noteId) router.push(`/notes/${data.noteId}`);
  };

  if (graphQuery.isLoading) {
    return <Skeleton className="min-h-[32rem] w-full rounded-lg" />;
  }

  if (graphQuery.error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        {graphQuery.error.message}
      </div>
    );
  }

  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="grid min-h-[32rem] place-items-center rounded-lg border border-dashed border-border p-8 text-center">
        <div>
          <h2 className="text-base font-semibold">No graph yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create notes with wikilinks to see connections here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-11rem)] min-h-[32rem] overflow-hidden rounded-lg border border-border bg-background">
      <ReactFlow
        nodes={elements.nodes}
        edges={elements.edges}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.2}
        maxZoom={1.6}
        onNodeClick={onNodeClick}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
      >
        <Background color="var(--border)" gap={20} />
        <Controls />
        <MiniMap
          pannable
          zoomable
          nodeColor={(node) => {
            const data = node.data as GraphNodeData;
            if (data.isBrokenTarget) return "var(--destructive)";
            if (data.isPlaceholder) return "#f59e0b";
            return "var(--foreground)";
          }}
        />
      </ReactFlow>
    </div>
  );
}
