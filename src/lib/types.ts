import type { Link, Note, Version } from "@prisma/client";

export type { Link, Note, Version };

export type Backlink = {
  id: string;
  title: string;
  isPlaceholder: boolean;
};

export type LinkEdge = {
  id: string;
  sourceId: string;
  targetId: string | null;
  targetTitle: string;
  isBroken: boolean;
};

export type NoteWithRelations = Note & {
  backlinks: Backlink[];
  outgoingLinks: LinkEdge[];
};

export type GraphNode = {
  id: string;
  title: string;
  isPlaceholder: boolean;
  isDeleted: boolean;
  tagCount: number;
};

export type GraphPayload = {
  nodes: GraphNode[];
  edges: LinkEdge[];
};

export type DiffLineType = "added" | "removed" | "unchanged";

export type DiffLine = {
  type: DiffLineType;
  text: string;
};

export type VersionSummary = Pick<Version, "id" | "version" | "createdAt">;

export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
