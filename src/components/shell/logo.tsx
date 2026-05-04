import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
};

export function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("size-6 shrink-0", className)}
      fill="none"
    >
      <line
        x1="9"
        y1="9"
        x2="23"
        y2="9"
        stroke="var(--muted-foreground)"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <line
        x1="9"
        y1="9"
        x2="16"
        y2="23"
        stroke="var(--muted-foreground)"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <line
        x1="23"
        y1="9"
        x2="16"
        y2="23"
        stroke="var(--muted-foreground)"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="9" cy="9" r="3.75" fill="var(--chart-1)" />
      <circle cx="23" cy="9" r="3.75" fill="var(--chart-2)" />
      <circle cx="16" cy="23" r="3.75" fill="var(--chart-3)" />
    </svg>
  );
}
