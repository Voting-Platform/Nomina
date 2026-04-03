import { getOrSyncDbUser } from "@/actions/user";
import { getElectionById } from "@/actions/election/get-election-by-id";
import { redirect, notFound } from "next/navigation";
import { ElectionDetailNav } from "./components/election-detail-nav";

export default async function ElectionDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dbUser = await getOrSyncDbUser();
  if (!dbUser) redirect("/auth/login");

  const election = await getElectionById(id).catch((err) => {
    console.error(`[ElectionDetailLayout] getElectionById("${id}") failed:`, err);
    notFound();
  });

  return (
    <main className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Election header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
          {election.title}
        </h1>
        {election.description && (
          <p className="mt-1.5 text-sm text-[var(--text-secondary)] max-w-2xl">
            {election.description}
          </p>
        )}
      </div>

      {/* Tab navigation */}
      <ElectionDetailNav electionId={id} />

      {/* Page content */}
      <div className="mt-6">{children}</div>
    </main>
  );
}
