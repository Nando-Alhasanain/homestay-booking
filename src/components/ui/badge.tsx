import * as React from "react";

import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "primary";

const tones: Record<BadgeTone, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  success: "border-transparent bg-green-50 text-success",
  warning: "border-transparent bg-amber-50 text-warning",
  danger: "border-transparent bg-red-50 text-danger",
  primary: "border-transparent bg-primary/10 text-primary",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-2xl border px-2.5 py-1 text-xs font-bold whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
