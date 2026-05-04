"use client";

function LegendItem({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
      <span className={className} />
      {label}
    </span>
  );
}

export function GraphLegend() {
  return (
    <div className="flex flex-wrap gap-3 rounded-lg border border-border px-3 py-2">
      <LegendItem
        label="Note"
        className="size-3 rounded-full bg-foreground"
      />
      <LegendItem
        label="Placeholder"
        className="size-3 rounded-full border border-amber-500 bg-amber-100"
      />
      <LegendItem
        label="Broken"
        className="h-0 w-6 border-t-2 border-dashed border-destructive"
      />
    </div>
  );
}
