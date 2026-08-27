import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium leading-normal",
  {
    variants: {
      variant: {
        wine: "bg-wine-100 text-wine-800",
        cream: "bg-cream-200 text-wine-800",
        success: "bg-status-success-bg text-status-success",
        warning: "bg-status-warning-bg text-status-warning",
        danger: "bg-status-danger-bg text-status-danger",
        info: "bg-status-info-bg text-status-info",
        neutral: "bg-status-neutral-bg text-status-neutral",
        outline: "border border-sand-300 text-sand-600",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
