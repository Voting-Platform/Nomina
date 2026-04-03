import { getElectionById } from "@/actions/election/get-election-by-id";
import { notFound } from "next/navigation";
import { CandidatesManager } from "./candidates-manager";

export const dynamic = "force-dynamic";

export default async function CandidatesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const election = await getElectionById(id).catch(() => notFound());

  return (
    <div>
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
        Manage Candidates
      </h2>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Add, edit, or remove candidates for this election
      </p>
      <CandidatesManager electionId={id} initialCandidates={election.candidates} />
    </div>
  );
}
