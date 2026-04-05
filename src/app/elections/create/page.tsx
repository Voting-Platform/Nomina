import { getOrSyncDbUser } from "@/actions/user";
import { redirect } from "next/navigation";
import { WizardContainer } from "./wizard-container";

export const dynamic = "force-dynamic";

export default async function CreateElectionPage() {
  const dbUser = await getOrSyncDbUser();
  if (!dbUser) redirect("/auth/login");

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Page header */}
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
          Create New Election
        </h1>
        <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
          Set up your election in a few easy steps
        </p>
      </div>

      <WizardContainer />
    </main>
  );
}
