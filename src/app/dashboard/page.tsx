import { Navbar } from "@/components/organisms/navbar";
import { getMyElections } from "@/actions/election/get-my-elections";
import { getOrSyncDbUser } from "@/actions/user";
import { redirect } from "next/navigation";
import { DashboardContent } from "./dashboard-content";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const dbUser = await getOrSyncDbUser();
  if (!dbUser) redirect("/auth/login");

  const elections = await getMyElections();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <main className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              My Elections
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Manage and monitor all your elections
            </p>
          </div>
        </div>

        <DashboardContent elections={elections} />
      </main>
    </div>
  );
}
