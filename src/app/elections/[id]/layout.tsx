
import { getElectionById } from "@/lib/api/server";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ElectionDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const election = await getElectionById(id).catch(() => {
    notFound();
  });

  return (
    <main className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
      {children}
    </main>
  );
}
