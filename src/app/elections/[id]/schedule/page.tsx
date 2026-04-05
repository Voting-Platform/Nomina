import { getElectionById } from "@/actions/election/get-election-by-id";
import { notFound } from "next/navigation";
import { ScheduleManager } from "./schedule-manager";

export const dynamic = "force-dynamic";

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const election = await getElectionById(id).catch(() => notFound());

  return (
    <div>
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
        Election Schedule
      </h2>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Control when voting opens and closes
      </p>
      <ScheduleManager
        electionId={id}
        initialStatus={election.status}
        initialSchedulingMode={election.schedulingMode}
        initialStartAt={election.scheduledStartAt}
        initialEndAt={election.scheduledEndAt}
      />
    </div>
  );
}
