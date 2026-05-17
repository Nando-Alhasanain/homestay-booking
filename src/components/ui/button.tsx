import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[20px] border px-4 py-2.5 text-sm font-bold transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-border bg-white text-foreground hover:bg-muted",
        primary:
          "border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        ghost: "border-transparent bg-transparent text-foreground hover:bg-muted",
        danger: "border-danger bg-danger text-white hover:bg-danger/90",
      },
      size: {
        default: "min-h-11 px-4",
        sm: "min-h-9 rounded-2xl px-3 text-xs",
        lg: "min-h-12 rounded-[24px] px-5",
        icon: "h-11 w-11 rounded-full p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
