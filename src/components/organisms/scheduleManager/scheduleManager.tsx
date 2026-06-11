"use client";

import { useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/atoms/statusBadge";
import { SchedulingForm } from "@/components/organisms/createElectionWizard/forms/schedulingForm";
import { updateScheduling } from "@/lib/api/server/scheduling/update-scheduling";
import { manuallyOpenElection } from "@/lib/api/server/scheduling/manually-open-election";
import { manuallyCloseElection } from "@/lib/api/server/scheduling/manually-close-election";
import { getElectionById } from "@/lib/api/server/election/get-election-by-id";
import type { SchedulingInput, ElectionStatus, SchedulingMode } from "@/types/election";
import type { ElectionDetailData } from "@/types";
import { Save, Play, Square } from "lucide-react";

interface ScheduleManagerProps {
  electionId: string;
  initialData: ElectionDetailData;
}

export function ScheduleManager({ electionId, initialData }: ScheduleManagerProps) {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [initialDataTimestamp] = useState(() => Date.now());

  const { data: election } = useQuery({
    queryKey: ["election", electionId],
    queryFn: () => getElectionById(electionId),
    initialData,
    initialDataUpdatedAt: initialDataTimestamp,
  });

  const status = election.status as ElectionStatus;

  const [scheduling, setScheduling] = useState<SchedulingInput>({
    mode: initialData.schedulingMode as SchedulingMode,
    scheduledStartAt: initialData.scheduledStartAt || undefined,
    scheduledEndAt: initialData.scheduledEndAt || undefined,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    startTransition(async () => {
      await updateScheduling(electionId, scheduling);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      queryClient.invalidateQueries({ queryKey: ["election", electionId] });
    });
  };

  const handleOpen = () => {
    startTransition(async () => {
      await manuallyOpenElection(electionId);
      queryClient.invalidateQueries({ queryKey: ["election", electionId] });
    });
  };

  const handleClose = () => {
    startTransition(async () => {
      await manuallyCloseElection(electionId);
      queryClient.invalidateQueries({ queryKey: ["election", electionId] });
    });
  };

  const canEdit = ["draft", "scheduled"].includes(status);

  return (
    <div className="space-y-6">
      {/* Current status */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--text-secondary)] mb-1">Current status</p>
          <StatusBadge status={status} />
        </div>

        {/* Manual controls */}
        {election.schedulingMode === "manual" && (
          <div className="flex gap-2">
            {(status === "draft" || status === "scheduled") && (
              <Button onClick={handleOpen} disabled={isPending} variant="secondary" className="bg-[var(--secondary)] text-white hover:bg-[var(--secondary-hover)]">
                <Play className="h-4 w-4" /> Open Voting
              </Button>
            )}
            {status === "open" && (
              <Button onClick={handleClose} disabled={isPending} variant="destructive">
                <Square className="h-4 w-4" /> Close Voting
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Scheduling config */}
      {canEdit ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Scheduling Mode</h3>
          <SchedulingForm scheduling={scheduling} onSchedulingChange={setScheduling} />
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={isPending}>
              <Save className="h-4 w-4" /> {isPending ? "Saving..." : "Save Schedule"}
            </Button>
            {saved && <p className="text-sm text-[var(--secondary)]">Saved!</p>}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
          <p className="text-sm text-[var(--text-secondary)]">
            Scheduling cannot be modified once the election is {status}.
          </p>
        </div>
      )}
    </div>
  );
}
