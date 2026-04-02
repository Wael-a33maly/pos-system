"use client";

// VisuallyHidden component - hides content visually but keeps it accessible
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export interface VisuallyHiddenProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  asChild?: boolean;
}

/**
 * VisuallyHidden - Hides content visually but keeps it accessible to screen readers
 * Uses Tailwind's sr-only class
 */
export function VisuallyHidden({
  className,
  asChild = false,
  ...props
}: VisuallyHiddenProps) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      className={cn("sr-only", className)}
      {...props}
    />
  );
}

export default VisuallyHidden;
