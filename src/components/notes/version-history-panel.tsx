"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, GitCompare, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useDiff,
  useRestoreVersion,
  useVersion,
  useVersions,
} from "@/hooks/use-versions";
import { VersionDiffView } from "@/components/notes/version-diff-view";

type VersionHistoryPanelProps = {
  noteId: string;
};

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function VersionHistoryPanel({ noteId }: VersionHistoryPanelProps) {
  const versionsQuery = useVersions(noteId);
  const restoreVersion = useRestoreVersion(noteId);
  const versions = useMemo(() => versionsQuery.data ?? [], [versionsQuery.data]);
  const [from, setFrom] = useState<number | undefined>();
  const [to, setTo] = useState<number | undefined>();
  const [isDiffOpen, setIsDiffOpen] = useState(false);
  const [viewVersion, setViewVersion] = useState<number | undefined>();
  const diffQuery = useDiff(noteId, from, to);
  const versionQuery = useVersion(noteId, viewVersion);

  const newestVersion = useMemo(
    () => versions.reduce((max, version) => Math.max(max, version.version), 0),
    [versions],
  );

  if (versionsQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading versions...</p>;
  }

  if (versions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        No versions yet.
      </p>
    );
  }

  function openDiff(version: number) {
    setFrom(version);
    setTo(newestVersion && newestVersion !== version ? newestVersion : undefined);
    setIsDiffOpen(true);
  }

  return (
    <>
      <div className="space-y-2">
        {versions.map((version) => (
          <div
            key={version.id}
            className="rounded-lg border border-border p-3 text-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">Version {version.version}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {formatDate(version.createdAt)}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  title="View"
                  onClick={() => setViewVersion(version.version)}
                >
                  <Eye />
                  <span className="sr-only">View</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  title="Compare"
                  onClick={() => openDiff(version.version)}
                >
                  <GitCompare />
                  <span className="sr-only">Compare</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  title="Restore"
                  disabled={restoreVersion.isPending}
                  onClick={async () => {
                    const toastId = `restore-version-${noteId}`;
                    try {
                      const result = await restoreVersion.mutateAsync(version.version);
                      toast.success(
                        `Restored as version ${result.version.version}`,
                        { id: toastId },
                      );
                    } catch (error) {
                      toast.error(
                        error instanceof Error ? error.message : "Restore failed",
                        { id: toastId },
                      );
                    }
                  }}
                >
                  <RotateCcw />
                  <span className="sr-only">Restore</span>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isDiffOpen} onOpenChange={setIsDiffOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Version diff</DialogTitle>
            <DialogDescription>
              Compare version {from ?? "-"} with version {to ?? "-"}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <label className="grid gap-1 text-sm">
              From
              <select
                className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
                value={from ?? ""}
                onChange={(event) => setFrom(Number(event.target.value))}
              >
                {versions.map((version) => (
                  <option key={version.id} value={version.version}>
                    Version {version.version}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              To
              <select
                className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
                value={to ?? ""}
                onChange={(event) => setTo(Number(event.target.value))}
              >
                <option value="" disabled>
                  Select version
                </option>
                {versions.map((version) => (
                  <option key={version.id} value={version.version}>
                    Version {version.version}
                  </option>
                ))}
              </select>
            </label>
            <Button
              type="button"
              className="self-end"
              disabled={!from || !to || from === to || diffQuery.isFetching}
              onClick={() => void diffQuery.refetch()}
            >
              <GitCompare data-icon="inline-start" />
              Compare
            </Button>
          </div>

          {diffQuery.isLoading || diffQuery.isFetching ? (
            <p className="text-sm text-muted-foreground">Loading diff...</p>
          ) : diffQuery.data ? (
            <VersionDiffView diff={diffQuery.data} />
          ) : (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              Choose two versions to compare.
            </p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={viewVersion !== undefined}
        onOpenChange={(open) => {
          if (!open) setViewVersion(undefined);
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Version {viewVersion ?? "-"}</DialogTitle>
            <DialogDescription>
              Snapshot content preserved for this note.
            </DialogDescription>
          </DialogHeader>
          {versionQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading version...</p>
          ) : versionQuery.data ? (
            <pre className="max-h-[60vh] overflow-auto rounded-lg border border-border bg-muted/30 p-3 whitespace-pre-wrap text-sm leading-6 font-mono">
              {versionQuery.data.body || " "}
            </pre>
          ) : (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              Version not found.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
