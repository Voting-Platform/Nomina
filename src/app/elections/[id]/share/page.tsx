import { getElectionById } from "@/actions/election/get-election-by-id";
import { notFound } from "next/navigation";
import { ShareManager } from "./share-manager";

export const dynamic = "force-dynamic";

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const election = await getElectionById(id).catch(() => notFound());

  return (
    <div>
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
        Share Election
      </h2>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Share the voting link with your audience
      </p>
      <ShareManager
        electionId={id}
        electionLink={election.electionLink || ""}
        slug={election.slug}
      />
    </div>
  );
}
