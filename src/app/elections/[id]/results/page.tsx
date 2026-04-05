import { getElectionById } from "@/actions/election/get-election-by-id";
import { notFound } from "next/navigation";
import { ResultsView } from "./results-view";

export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const election = await getElectionById(id).catch(() => notFound());

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Election Results
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {election.totalVotes} total votes from {election.uniqueVoterCount} voters
          </p>
        </div>
      </div>
      <ResultsView
        electionId={id}
        candidates={election.candidates}
        totalVotes={election.totalVotes}
      />
    </div>
  );
}
