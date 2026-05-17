import * as React from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-[20px] border border-border bg-card p-5 text-card-foreground", className)}
      {...props}
    />
  );
}

export function ElevatedCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <Card className={cn("shadow-panel", className)} {...props} />;
}
