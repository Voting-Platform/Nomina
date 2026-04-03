"use client";

import { Badge } from "./badge";
import type { ElectionStatus } from "@/types/election";

const statusConfig: Record<ElectionStatus, { label: string; variant: "draft" | "scheduled" | "open" | "closed" | "archived" }> = {
  draft: { label: "Draft", variant: "draft" },
  scheduled: { label: "Scheduled", variant: "scheduled" },
  open: { label: "Live", variant: "open" },
  closed: { label: "Closed", variant: "closed" },
  archived: { label: "Archived", variant: "archived" },
};

interface StatusBadgeProps {
  status: ElectionStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} className={className}>
      {status === "open" && (
        <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      )}
      {config.label}
    </Badge>
  );
}
