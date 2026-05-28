import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[var(--primary-light)] text-[var(--primary)]",
        secondary: "bg-[var(--secondary-light)] text-[var(--secondary)]",
        destructive: "bg-[var(--destructive-light)] text-[var(--destructive)]",
        warning: "bg-[var(--warning-light)] text-[var(--warning)]",
        info: "bg-[var(--info-light)] text-[var(--info)]",
        outline: "border border-[var(--border)] text-[var(--text-secondary)]",
        // Election status badges
        draft: "bg-gray-100 text-gray-600",
        scheduled: "bg-[var(--info-light)] text-[var(--info)]",
        open: "bg-[var(--secondary-light)] text-[var(--secondary)]",
        closed: "bg-[var(--destructive-light)] text-[var(--destructive)]",
        archived: "bg-gray-100 text-gray-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
