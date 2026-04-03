import { getElectionById } from "@/actions/election/get-election-by-id";
import { notFound } from "next/navigation";
import { EditElectionForm } from "./edit-election-form";

export const dynamic = "force-dynamic";

export default async function EditElectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const election = await getElectionById(id).catch(() => notFound());

  return (
    <div>
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
        Edit Election
      </h2>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Update the title, description, and voter base settings
      </p>
      <EditElectionForm
        electionId={id}
        initialTitle={election.title}
        initialDescription={election.description}
        initialVoterBaseMode={election.voterBaseMode}
        initialAllowedEmails={election.allowedVoterEmails || []}
        initialAllowedDomains={election.allowedVoterDomains || []}
      />
    </div>
  );
}
