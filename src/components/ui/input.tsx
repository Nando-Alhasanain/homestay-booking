import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "min-h-[46px] w-full rounded-xl border border-border bg-card px-3.5 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-foreground focus:ring-2 focus:ring-foreground",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
