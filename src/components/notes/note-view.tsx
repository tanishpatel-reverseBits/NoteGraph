"use client";

import Link from "next/link";
import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { LinkEdge } from "@/lib/types";
import { cn } from "@/lib/utils";

type NoteViewProps = {
  body: string;
  outgoingLinks: LinkEdge[];
};

const WIKI_SCHEME = "wiki:";

function transformWikilinks(body: string): string {
  return body.replace(/\[\[([^\[\]\n]+)\]\]/g, (_match, raw: string) => {
    const title = raw.trim();
    if (!title) return _match;
    return `[${title}](${WIKI_SCHEME}${encodeURIComponent(title)})`;
  });
}

export function NoteView({ body, outgoingLinks }: NoteViewProps) {
  const transformed = useMemo(() => transformWikilinks(body), [body]);
  const linkIndex = useMemo(() => {
    const map = new Map<string, LinkEdge>();
    for (const link of outgoingLinks) map.set(link.targetTitle, link);
    return map;
  }, [outgoingLinks]);

  if (body.trim().length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
        Empty note. Switch to edit mode and start writing.
      </p>
    );
  }

  return (
    <div
      className={cn(
        "prose prose-sm max-w-none dark:prose-invert",
        "prose-headings:font-semibold prose-pre:bg-muted prose-pre:text-foreground",
        "prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-foreground",
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ href, children, ...props }) {
            if (href?.startsWith(WIKI_SCHEME)) {
              const title = decodeURIComponent(href.slice(WIKI_SCHEME.length));
              const edge = linkIndex.get(title);
              if (edge?.targetId && !edge.isBroken) {
                return (
                  <Link
                    href={`/notes/${edge.targetId}`}
                    className="rounded bg-primary/10 px-1 py-0.5 text-primary no-underline hover:bg-primary/20"
                  >
                    {children}
                  </Link>
                );
              }
              return (
                <span className="rounded border border-dashed border-destructive bg-destructive/10 px-1 py-0.5 text-destructive">
                  {children}
                </span>
              );
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline underline-offset-2"
                {...props}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {transformed}
      </ReactMarkdown>
    </div>
  );
}
