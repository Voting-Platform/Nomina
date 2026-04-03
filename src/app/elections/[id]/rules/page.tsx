import { getElectionById } from "@/actions/election/get-election-by-id";
import { notFound } from "next/navigation";
import { RulesManager } from "./rules-manager";

export const dynamic = "force-dynamic";

export default async function RulesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const election = await getElectionById(id).catch(() => notFound());

  return (
    <div>
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
        Voting Rules
      </h2>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Configure voting limits and candidate privileges
      </p>
      <RulesManager
        electionId={id}
        initialRules={{
          maxTotalVotesPerVoter: election.maxTotalVotesPerVoter,
          maxVotesPerCandidate: election.maxVotesPerCandidate,
          allowVoterVisibility: election.allowVoterVisibility,
        }}
        candidates={election.candidates}
      />
    </div>
  );
}
